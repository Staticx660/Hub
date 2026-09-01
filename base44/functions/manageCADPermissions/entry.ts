import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { requireSystemManager } from '../../shared/authGuards.js';

const ALLOWED_FLAGS = ['is_supervisor', 'is_cad_admin', 'is_system_manager'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await requireSystemManager(base44);
    if (actor.error) return actor.error;

    let body = {};
    try { body = await req.json(); } catch {}
    const action = body.action || 'list';
    const svc = base44.asServiceRole.entities;

    if (action === 'list') {
      const personnel = await svc.CADPersonnel.list('-updated_date', 1000);
      // Emails are never returned here — identity data stays out of the client.
      const results = personnel.map((p) => ({
        id: p.id,
        name: p.name,
        rank: p.rank || '',
        callsign: p.callsign || '',
        badge_number: p.badge_number || '',
        discord_id: p.discord_id || '',
        department_id: p.department_id || '',
        additional_department_ids: p.additional_department_ids || [],
        is_supervisor: !!p.is_supervisor,
        is_cad_admin: !!p.is_cad_admin,
        is_system_manager: !!p.is_system_manager,
      }));
      return Response.json({ personnel: results });
    }

    if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });

    if (action === 'setFlag') {
      if (!ALLOWED_FLAGS.includes(body.field)) {
        return Response.json({ error: 'Invalid permission flag' }, { status: 400 });
      }
      // A manager may not strip their own manager flag — prevents accidental lock-out.
      if (body.field === 'is_system_manager' && body.value === false) {
        const target = await svc.CADPersonnel.get(body.id);
        if (target && (target.discord_id === actor.user.discord_id || target.email === actor.user.email)) {
          return Response.json({ error: 'You cannot remove your own System Manager access' }, { status: 400 });
        }
      }
      await svc.CADPersonnel.update(body.id, { [body.field]: !!body.value });
      return Response.json({ success: true });
    }

    if (action === 'setDepartments') {
      const updates = {};
      if (typeof body.department_id === 'string') updates.department_id = body.department_id;
      if (Array.isArray(body.additional_department_ids)) updates.additional_department_ids = body.additional_department_ids;
      if (Object.keys(updates).length === 0) {
        return Response.json({ error: 'No department changes supplied' }, { status: 400 });
      }
      await svc.CADPersonnel.update(body.id, updates);
      return Response.json({ success: true });
    }

    if (action === 'delete') {
      await svc.CADPersonnel.delete(body.id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});