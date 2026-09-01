import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { requireCADAccess } from '../../shared/authGuards.js';

/* Returns the CAD personnel roster with only the operational fields the UI
   shows. Emails and Discord IDs stay on the server — they are never needed
   client-side, and CADPersonnel reads are now admin-only. */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const access = await requireCADAccess(base44);
    if (access.error) return access.error;

    const all = await base44.asServiceRole.entities.CADPersonnel.list('-created_date', 1000);
    const personnel = all.map((p) => ({
      id: p.id,
      name: p.name,
      rank: p.rank || '',
      badge_number: p.badge_number || '',
      callsign: p.callsign || '',
      status: p.status || 'Off Duty',
      department_id: p.department_id,
      additional_department_ids: p.additional_department_ids || [],
      is_supervisor: !!p.is_supervisor,
    }));

    return Response.json({ personnel });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});