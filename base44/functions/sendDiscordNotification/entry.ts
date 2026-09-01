import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only a call id is accepted. The destination webhook and the message content
    // are both resolved server-side, so this endpoint can never be used as an
    // arbitrary Discord relay.
    let body = {};
    try { body = await req.json(); } catch {}
    const callId = body.call_id;
    if (!callId) return Response.json({ error: 'call_id is required' }, { status: 400 });

    let call = null;
    try { call = await base44.asServiceRole.entities.ActiveCall.get(callId); } catch {}
    if (!call) return Response.json({ error: 'Call not found' }, { status: 404 });

    let dept = null;
    if (call.department_id) {
      try { dept = await base44.asServiceRole.entities.CADDepartment.get(call.department_id); } catch {}
    }
    if (!dept?.discord_webhook_url) {
      return Response.json({ skipped: true, reason: 'No webhook configured for department' });
    }

    const webhookUrl = new URL(dept.discord_webhook_url);
    if (webhookUrl.hostname !== 'discord.com' && webhookUrl.hostname !== 'discordapp.com') {
      return Response.json({ error: 'Department webhook is not a Discord URL' }, { status: 400 });
    }

    const color = call.priority === '1 - High' ? 15158332 : call.priority === '2 - Medium' ? 15844367 : 3447003;
    const embed = {
      title: `🚨 New Call: ${call.call_type || 'Unknown'}`,
      description: call.description || `Location: ${call.location || 'Unknown'}`,
      color,
      timestamp: new Date().toISOString(),
      fields: [
        { name: 'Priority', value: call.priority || 'N/A', inline: true },
        { name: 'Location', value: call.location || 'Unknown', inline: true },
        { name: 'Department', value: dept.name || 'Unknown', inline: true },
        ...(call.caller_name
          ? [{ name: 'Caller', value: `${call.caller_name}${call.caller_phone ? ` · ${call.caller_phone}` : ''}`, inline: false }]
          : []),
      ],
      footer: { text: 'RosterHQ' },
    };

    const response = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json({ error: `Discord error: ${text}` }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});