import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { searchType, firstName, lastName, dob, plate, serial, personId, personName, exact } = body;

    const matchField = (field, query) => {
      if (!query) return true;
      if (!field) return false;
      return exact ? field === query : field.toLowerCase().includes(query.toLowerCase());
    };

    if (searchType === 'person') {
      const all = await base44.asServiceRole.entities.Civilian.list('-created_date', 500);
      const results = all.filter(c =>
        matchField(c.first_name, firstName) &&
        matchField(c.last_name, lastName) &&
        (!dob || c.dob === dob)
      );

      if (personId) {
        const name = personName || (all.find(c => c.id === personId) ? `${all.find(c => c.id === personId).first_name} ${all.find(c => c.id === personId).last_name}` : "");
        const [allWarrants, vehicles] = await Promise.all([
          base44.asServiceRole.entities.Warrant.filter({ status: "Active" }),
          base44.asServiceRole.entities.CivilianVehicle.filter({ owner_id: personId }),
        ]);
        const matchingWarrants = allWarrants.filter(w =>
          w.person_id === personId || (name && w.person_name === name)
        );
        return Response.json({ results, warrants: matchingWarrants, vehicles });
      }

      return Response.json({ results });
    } else if (searchType === 'vehicle') {
      const all = await base44.asServiceRole.entities.CivilianVehicle.list('-created_date', 500);
      const results = all.filter(v => matchField(v.plate, plate));
      return Response.json({ results });
    } else if (searchType === 'firearm') {
      const all = await base44.asServiceRole.entities.Firearm.list('-created_date', 500);
      const results = all.filter(f => matchField(f.serial_number, serial));
      return Response.json({ results });
    }

    return Response.json({ results: [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});