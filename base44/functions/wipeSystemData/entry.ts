import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — Admin only' }, { status: 403 });

    // Secondary check: re-verify the caller's role from the current database record
    // (not just the token claims) before allowing mass deletion via service role.
    const freshUser = await base44.asServiceRole.entities.User.get(user.id);
    if (!freshUser || freshUser.role !== 'admin') {
      return Response.json({ error: 'Forbidden — Admin only' }, { status: 403 });
    }

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