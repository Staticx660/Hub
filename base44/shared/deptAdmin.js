/* Resolves which roster departments a user administers.
   A user is a department admin when their RosterMember record for that
   department has is_admin = true. Platform admins administer everything. */

export async function findRosterMembers(base44, user) {
  const matches = [];
  if (user.discord_id) {
    matches.push(...await base44.asServiceRole.entities.RosterMember.filter({ discord_id: user.discord_id }));
  }
  if (matches.length === 0 && user.full_name) {
    matches.push(...await base44.asServiceRole.entities.RosterMember.filter({ name: user.full_name }));
  }
  return matches;
}

/* Returns an array of Department ids the user may administer. */
export async function resolveDeptAdminIds(base44, user) {
  if (!user) return [];
  if (user.role === 'admin') {
    const all = await base44.asServiceRole.entities.Department.list();
    return all.map((d) => d.id);
  }
  const members = await findRosterMembers(base44, user);
  const ids = new Set();
  for (const m of members) {
    if (!m.is_admin) continue;
    if (m.department_id) ids.add(m.department_id);
    for (const extra of m.additional_department_ids || []) ids.add(extra);
  }
  return [...ids];
}

/* Guard: null when the user may administer departmentId, else a Response. */
export async function requireDeptAdmin(base44, departmentId) {
  let user = null;
  try {
    user = await base44.auth.me();
  } catch (_e) {
    user = null;
  }
  if (!user) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (user.role === 'admin') return { user };

  const allowed = await resolveDeptAdminIds(base44, user);
  if (!departmentId || !allowed.includes(departmentId)) {
    return { error: Response.json({ error: 'Department admin access required' }, { status: 403 }) };
  }
  return { user, allowed };
}