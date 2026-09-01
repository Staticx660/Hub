import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { requireSystemManager } from '../../shared/authGuards.js';

// Named wipe scopes so the admin can clear one category at a time.
const SCOPES: Record<string, string[]> = {
  calls: ['ActiveCall'],
  bolos: ['BOLO'],
  warrants: ['Warrant'],
  civilians: ['Civilian'],
  vehicles: ['CivilianVehicle'],
  firearms: ['Firearm'],
  reports: ['CADReport'],
  pcrs: ['PatientCareReport'],
  sessions: ['CADSession', 'CADUnitGroup'],
};

const ALL_ENTITIES = Object.values(SCOPES).flat();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Mass deletion is System Manager only; the guard re-reads the role from the
    // database rather than trusting token claims.
    const actor = await requireSystemManager(base44);
    if (actor.error) return actor.error;

    // Require explicit confirmation phrase in the request body
    let body: any = {};
    try { body = await req.json(); } catch {}
    if (body.confirm !== 'WIPE') {
      return Response.json({ error: 'Confirmation required — pass { confirm: "WIPE" }' }, { status: 400 });
    }

    const scope = body.scope || 'all';
    const entitiesToWipe = scope === 'all' ? ALL_ENTITIES : SCOPES[scope];
    if (!entitiesToWipe) {
      return Response.json({ error: `Unknown scope "${scope}"` }, { status: 400 });
    }

    const results: Record<string, string> = {};
    for (const entityName of entitiesToWipe) {
      try {
        await base44.asServiceRole.entities[entityName].deleteMany({});
        results[entityName] = 'wiped';
      } catch (e) {
        results[entityName] = `error: ${e.message}`;
      }
    }

    return Response.json({ success: true, scope, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});