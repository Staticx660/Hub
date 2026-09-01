import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { countOnlineDispatchers, recommendUnits, resolveDepartments } from '../../shared/autoDispatch.js';
import { requireCADAccess } from '../../shared/authGuards.js';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const payload = await req.json().catch(() => ({}));

    // ── Trust boundary: only the internal automation (shared token) or an
    // authenticated CAD user / admin may trigger dispatch. ──
    const settingsList = await svc.entities.AutoDispatchSetting.list();
    const storedToken = settingsList[0]?.trigger_token;
    const providedToken = payload?.trigger_token || req.headers.get('x-autodispatch-token');
    const internalCall = Boolean(storedToken) && providedToken === storedToken;

    if (!internalCall) {
      const guard = await requireCADAccess(base44);
      if (guard.error) return guard.error;
    }

    const callId = payload?.event?.entity_id || payload?.call_id;
    if (!callId) return Response.json({ error: 'No call id in payload' }, { status: 400 });

    let call = payload?.data;
    if (!call || payload?.payload_too_large) {
      call = await svc.entities.ActiveCall.get(callId);
    }
    if (!call) return Response.json({ error: 'Call not found' }, { status: 404 });

    // ── Settings (single record, created on first run) ──
    let settings = settingsList[0];
    if (!settings) settings = await svc.entities.AutoDispatchSetting.create({ enabled: true });

    const logBase = { call_id: callId, call_type: call.call_type, location: call.location, postal: call.postal || '' };
    const finish = async (outcome, extra = {}) => {
      await svc.entities.AutoDispatchLog.create({ ...logBase, outcome, ...extra });
      await svc.entities.AutoDispatchSetting.update(settings.id, {
        last_run_status: outcome,
        last_run_at: new Date().toISOString(),
      });
      return Response.json({ outcome, ...extra });
    };

    if (settings.enabled === false) return await finish('Skipped - Disabled');

    // ── Dispatcher detection: any dispatcher on duty disables automation ──
    const [sessions, departments] = await Promise.all([
      svc.entities.CADSession.filter({ is_active: true }),
      svc.entities.CADDepartment.filter({ is_active: true }),
    ]);

    const dispatcherCount = countOnlineDispatchers(sessions, departments);
    if (dispatcherCount >= 1) {
      return await finish('Skipped - Dispatcher Online', {
        reasoning: `${dispatcherCount} dispatcher(s) on duty — a human dispatcher handles this call.`,
      });
    }

    // ── AI call processing: categorize, prioritize, pick responding departments ──
    const deptDirectory = departments
      .map((d) => `${d.name} (category: ${d.category})`)
      .join('; ');

    const ai = await svc.integrations.Core.InvokeLLM({
      prompt: `You are an automated emergency dispatcher for a roleplay city. No human dispatcher is on duty, so you must route this 911 call.

Available departments: ${deptDirectory}

Call details:
- Type: ${call.call_type}
- Location: ${call.location || 'unknown'}${call.postal ? ` (postal ${call.postal})` : ''}
- Cross streets: ${call.cross_streets || 'n/a'}
- Caller: ${call.caller_name || 'unknown'}
- Description: ${call.description || 'none provided'}

Routing rules: medical emergencies go to the EMS department; structure and vehicle fires go to the Fire department; crimes, traffic stops and backup requests go to the Police department. A motor vehicle crash gets Police + EMS. A vehicle fire gets Fire + EMS + Police.

Return the incident category, a priority ("1 - High", "2 - Medium" or "3 - Low"), the exact names of every department that should respond, a one-sentence explanation of the routing decision, and a short professional dispatch narrative summarizing the incident for responding units.`,
      response_json_schema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          priority: { type: 'string' },
          departments: { type: 'array', items: { type: 'string' } },
          reasoning: { type: 'string' },
          narrative: { type: 'string' },
        },
        required: ['category', 'priority', 'departments'],
      },
    });

    const responding = resolveDepartments(departments, ai.departments);
    if (responding.length === 0) {
      return await finish('Failed', { error: 'AI did not match any active department', reasoning: ai.reasoning || '' });
    }

    // ── Unit recommendations ──
    const openCalls = await svc.entities.ActiveCall.filter({ status: 'Active' });
    const callPostalById = {};
    for (const c of openCalls) if (c.postal) callPostalById[c.id] = c.postal;

    let recommended = recommendUnits({
      sessions,
      departments,
      departmentIds: responding.map((d) => d.id),
      call,
      callPostalById,
      limit: settings.max_recommended_units || 3,
    });

    // ── Re-read the call: the AI step takes seconds, and units may have
    // detached or the call may have closed in the meantime. Never re-attach a
    // unit that intentionally left, and never resurrect a closed call. ──
    const fresh = await svc.entities.ActiveCall.get(callId).catch(() => null);
    if (!fresh || fresh.status === 'Closed') {
      return await finish('Failed', { error: 'Call was closed or removed before dispatch completed' });
    }
    call = fresh;

    const detachedUnitIds = new Set(
      (fresh.assignment_log || []).filter((e) => e.action === 'detached').map((e) => e.unit_name)
    );
    const freshIds = fresh.assigned_unit_ids || [];
    const freshSessions = await svc.entities.CADSession.filter({ is_active: true });
    const freshById = {};
    for (const s of freshSessions) freshById[s.id] = s;

    recommended = recommended.filter((r) => {
      const s = freshById[r.session_id];
      if (!s) return false; // clocked out mid-run
      if (detachedUnitIds.has(r.callsign || r.unit_name) && !freshIds.includes(r.session_id)) return false;
      if (s.active_call_id && s.active_call_id !== callId) return false; // now busy elsewhere
      return true;
    });

    const priority = ['1 - High', '2 - Medium', '3 - Low'].includes(ai.priority) ? ai.priority : call.priority;
    const assignUnits = settings.auto_assign_units !== false;
    const assignedIds = assignUnits ? recommended.map((r) => r.session_id) : [];
    if (assignUnits) recommended.forEach((r) => { r.assigned = true; });

    const stamp = new Date().toISOString();
    const noteLines = [
      `[AUTO-DISPATCH ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}]`,
      `Category: ${ai.category} | Priority: ${priority}`,
      `Responding: ${responding.map((d) => d.name).join(', ')}`,
      recommended.length
        ? `Recommended units: ${recommended.map((r) => `${r.callsign || r.unit_name}${r.distance !== null ? ` (~${r.distance}m)` : ''}`).join(', ')}`
        : 'No on-duty units available — call left pending.',
      ai.reasoning ? `Reason: ${ai.reasoning}` : '',
    ].filter(Boolean);

    const updates = {
      priority,
      department_id: responding[0].id,
      status: assignedIds.length > 0 || (call.assigned_unit_ids || []).length > 0 ? 'Active' : 'Pending',
      cad_notes: [call.cad_notes, noteLines.join('\n')].filter(Boolean).join('\n\n'),
      assignment_log: [
        ...(call.assignment_log || []),
        ...recommended.map((r) => ({
          unit_name: r.callsign || r.unit_name,
          action: assignUnits ? 'Auto-Assigned' : 'Recommended',
          timestamp: stamp,
          message: `${r.department_name} — ${r.status}${r.distance !== null ? ` — ~${r.distance}m out` : ''}`,
        })),
      ],
    };
    if (assignedIds.length > 0) updates.assigned_unit_ids = [...(call.assigned_unit_ids || []), ...assignedIds];
    if (settings.ai_narratives !== false && ai.narrative) {
      updates.description = call.description ? `${call.description}\n\n${ai.narrative}` : ai.narrative;
    }

    await svc.entities.ActiveCall.update(callId, updates);

    // Move assigned units onto the call
    for (const r of recommended) {
      if (!assignUnits) break;
      try {
        await svc.entities.CADSession.update(r.session_id, { status: 'On Call', active_call_id: callId });
      } catch (_e) { /* unit may have clocked out mid-run */ }
    }

    // ── Discord notification to each responding department ──
    if (settings.discord_notify !== false) {
      for (const dept of responding) {
        if (!dept.discord_webhook_url) continue;
        try {
          const url = new URL(dept.discord_webhook_url);
          if (url.hostname !== 'discord.com' && url.hostname !== 'discordapp.com') continue;
          await fetch(dept.discord_webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [{
                title: `🚨 Auto-Dispatch — ${ai.category}`,
                description: ai.narrative || call.description || '',
                color: priority === '1 - High' ? 0xef4444 : priority === '2 - Medium' ? 0xf59e0b : 0x3b82f6,
                fields: [
                  { name: 'Call Type', value: String(call.call_type || 'Unknown'), inline: true },
                  { name: 'Priority', value: priority, inline: true },
                  { name: 'Location', value: `${call.location || 'Unknown'}${call.postal ? ` (${call.postal})` : ''}`, inline: false },
                  { name: 'Units', value: recommended.length ? recommended.map((r) => r.callsign || r.unit_name).join(', ') : 'None available', inline: false },
                ],
                timestamp: stamp,
                footer: { text: 'OCRP Hub — Automated Dispatch (no dispatcher on duty)' },
              }],
            }),
          });
        } catch (_e) { /* notification is best-effort */ }
      }
    }

    const createdAt = call.created_date ? new Date(call.created_date).getTime() : null;
    const dispatchSeconds = createdAt ? Math.max(0, Math.round((Date.now() - createdAt) / 1000)) : undefined;

    return await finish('Auto-Dispatched', {
      dispatch_seconds: dispatchSeconds,
      category: ai.category,
      priority,
      department_names: responding.map((d) => d.name),
      recommended_units: recommended,
      narrative: ai.narrative || '',
      reasoning: ai.reasoning || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}