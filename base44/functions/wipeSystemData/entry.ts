import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { requireSystemManager } from '../../shared/authGuards.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Mass deletion is System Manager only; the guard re-reads the role from the
    // database rather than trusting token claims.
    const actor = await requireSystemManager(base44);
    if (actor.error) return actor.error;

    // Require explicit confirmation phrase in the request body
    let body = {};
    try { body = await req.json(); } catch {}
    if (body.confirm !== 'WIPE') {
      return Response.json({ error: 'Confirmation required — pass { confirm: "WIPE" }' }, { status: 400 });
    }

    const entitiesToWipe = [
      'ActiveCall',
      'BOLO',
      'Warrant',
      'Civilian',
      'CivilianVehicle',
      'CADReport',
      'PatientCareReport',
      'CADSession',
      'CADUnitGroup',
      'Firearm'
    ];

    const results = {};
    for (const entityName of entitiesToWipe) {
      try {
        await base44.asServiceRole.entities[entityName].deleteMany({});
        results[entityName] = 'wiped';
      } catch (e) {
        results[entityName] = `error: ${e.message}`;
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});