import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { searchType, firstName, lastName, dob, plate, serial, personId, personName, vehicleId, vehiclePlate, exact } = body;

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
        const person = all.find(c => c.id === personId);
        const name = personName || (person ? `${person.first_name} ${person.last_name}` : "");

        const [allWarrants, vehicles, firearms, allReports, allBolos] = await Promise.all([
          base44.asServiceRole.entities.Warrant.filter({ status: "Active" }),
          base44.asServiceRole.entities.CivilianVehicle.filter({ owner_id: personId }),
          base44.asServiceRole.entities.Firearm.filter({ owner_id: personId }),
          base44.asServiceRole.entities.CADReport.list('-created_date', 500),
          base44.asServiceRole.entities.BOLO.list('-created_date', 500),
        ]);

        const matchingWarrants = allWarrants.filter(w =>
          w.person_id === personId || (name && w.person_name === name)
        );
        const matchingReports = allReports.filter(r =>
          r.linked_civilian_id === personId ||
          (name && (r.description?.toLowerCase().includes(name.toLowerCase()) || r.title?.toLowerCase().includes(name.toLowerCase())))
        );
        const matchingBolos = allBolos.filter(b =>
          (name && b.person_name === name) ||
          (name && b.description?.toLowerCase().includes(name.toLowerCase()))
        );

        return Response.json({ results, warrants: matchingWarrants, vehicles, firearms, reports: matchingReports, bolos: matchingBolos });
      }

      return Response.json({ results });
    } else if (searchType === 'vehicle') {
      const all = await base44.asServiceRole.entities.CivilianVehicle.list('-created_date', 500);
      const results = all.filter(v => matchField(v.plate, plate));

      if (vehicleId || vehiclePlate) {
        const searchPlate = vehiclePlate || (results.find(v => v.id === vehicleId)?.plate) || "";
        const [allReports, allBolos] = await Promise.all([
          base44.asServiceRole.entities.CADReport.list('-created_date', 500),
          base44.asServiceRole.entities.BOLO.list('-created_date', 500),
        ]);

        const matchingReports = allReports.filter(r =>
          r.linked_vehicle_plate === searchPlate ||
          (searchPlate && (r.description?.toLowerCase().includes(searchPlate.toLowerCase()) || r.location?.toLowerCase().includes(searchPlate.toLowerCase())))
        );
        const matchingBolos = allBolos.filter(b =>
          b.vehicle_plate === searchPlate ||
          (searchPlate && b.description?.toLowerCase().includes(searchPlate.toLowerCase()))
        );

        return Response.json({ results, reports: matchingReports, bolos: matchingBolos });
      }

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