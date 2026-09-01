import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { syncRosterToPersonnel, syncPersonnelToRoster } from '../../shared/rosterSync.js';

// Entity automation target: fires when a RosterMember or CADPersonnel record is
// created/updated and mirrors its department assignment onto the other system.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch {}
    const entityName = body?.event?.entity_name;
    const id = body?.event?.entity_id;
    if (!id || !['RosterMember', 'CADPersonnel'].includes(entityName)) {
      return Response.json({ error: 'Expected an entity event for RosterMember or CADPersonnel' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    // Always re-read the record — never trust the caller's payload.
    let record = null;
    try { record = await svc[entityName].get(id); } catch {}
    if (!record) return Response.json({ skipped: 'record not found' });

    const result = entityName === 'RosterMember'
      ? await syncRosterToPersonnel(svc, record)
      : await syncPersonnelToRoster(svc, record);
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}