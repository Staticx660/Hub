import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — Admin only' }, { status: 403 });

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