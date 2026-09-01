// Two-way department sync between the Roster (RosterMember / Department)
// and the CAD (CADPersonnel / CADDepartment).
// Departments are matched by Discord role ID first, then by name.
// People are matched by Discord ID first, then by exact name.

const norm = (s) => (s || "").toLowerCase().trim();
const sameSet = (a = [], b = []) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

async function loadDeptMaps(svc) {
  const [depts, cadDepts] = await Promise.all([
    svc.Department.list("-updated_date", 500),
    svc.CADDepartment.list("-updated_date", 500),
  ]);
  const toCad = new Map();
  const toRoster = new Map();
  for (const d of depts) {
    const c = cadDepts.find(
      (x) => (d.discord_role_id && x.discord_role_id === d.discord_role_id) || norm(x.name) === norm(d.name)
    );
    if (c && !toRoster.has(c.id)) {
      toCad.set(d.id, c.id);
      toRoster.set(c.id, d.id);
    }
  }
  return { toCad, toRoster };
}

// Map a list of ids through `map`, then keep any ids in `existing` that have no
// counterpart on the source side (so unmapped departments are never wiped).
function mergeAdditional(sourceIds, map, existing, reverseMap, primary) {
  const out = new Set();
  for (const id of sourceIds || []) { const m = map.get(id); if (m) out.add(m); }
  for (const id of existing || []) { if (!reverseMap.has(id)) out.add(id); }
  out.delete(primary);
  return [...out];
}

async function findByIdentity(entity, record) {
  if (record.discord_id) {
    const [hit] = await entity.filter({ discord_id: record.discord_id });
    if (hit) return hit;
  }
  if (record.name) {
    const [hit] = await entity.filter({ name: record.name });
    if (hit) return hit;
  }
  return null;
}

export async function syncRosterToPersonnel(svc, member) {
  const { toCad, toRoster } = await loadDeptMaps(svc);
  const primary = toCad.get(member.department_id);
  if (!primary) return { skipped: "roster department has no matching CAD department" };

  const target = await findByIdentity(svc.CADPersonnel, member);
  const additional = mergeAdditional(member.additional_department_ids, toCad, target?.additional_department_ids, toRoster, primary);

  if (!target) {
    await svc.CADPersonnel.create({
      name: member.name, discord_id: member.discord_id || "", department_id: primary,
      additional_department_ids: additional, rank: member.rank || "",
      badge_number: member.badge_number || "", callsign: member.callsign || "", status: "Off Duty",
    });
    return { created: "CADPersonnel" };
  }

  const updates = {};
  if (target.department_id !== primary) updates.department_id = primary;
  if (!sameSet(target.additional_department_ids, additional)) updates.additional_department_ids = additional;
  for (const f of ["rank", "badge_number", "callsign"]) {
    if (member[f] && target[f] !== member[f]) updates[f] = member[f];
  }
  if (member.discord_id && !target.discord_id) updates.discord_id = member.discord_id;
  if (Object.keys(updates).length) await svc.CADPersonnel.update(target.id, updates);
  return { updated: Object.keys(updates) };
}

export async function syncPersonnelToRoster(svc, person) {
  const { toCad, toRoster } = await loadDeptMaps(svc);
  const primary = toRoster.get(person.department_id);
  if (!primary) return { skipped: "CAD department has no matching roster department" };

  const target = await findByIdentity(svc.RosterMember, person);
  const additional = mergeAdditional(person.additional_department_ids, toRoster, target?.additional_department_ids, toCad, primary);

  if (!target) {
    if (!person.discord_id) return { skipped: "no Discord ID — not creating roster member" };
    await svc.RosterMember.create({
      name: person.name, discord_id: person.discord_id, department_id: primary,
      additional_department_ids: additional, rank: person.rank || "",
      badge_number: person.badge_number || "", callsign: person.callsign || "", status: "Active",
    });
    return { created: "RosterMember" };
  }

  const updates = {};
  if (target.department_id !== primary) {
    updates.department_id = primary;
    const dept = await svc.Department.get(primary);
    updates.rank_level = dept?.ranks?.find((r) => r.name === target.rank)?.level || 0;
  }
  if (!sameSet(target.additional_department_ids, additional)) updates.additional_department_ids = additional;
  if (Object.keys(updates).length) await svc.RosterMember.update(target.id, updates);
  return { updated: Object.keys(updates) };
}