/* Shared authorization guards for backend functions.
   Each returns null when access is allowed, or a Response to return immediately. */

export async function requireAdmin(base44) {
  let user = null;
  try {
    user = await base44.auth.me();
  } catch (_e) {
    user = null;
  }
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
  return null;
}

/* CAD record lookups: platform admins, or personnel with a CAD record. */
export async function requireCADAccess(base44) {
  let user = null;
  try {
    user = await base44.auth.me();
  } catch (_e) {
    user = null;
  }
  if (!user) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (user.role === 'admin') return { user };

  const matches = [];
  if (user.discord_id) {
    matches.push(...await base44.asServiceRole.entities.CADPersonnel.filter({ discord_id: user.discord_id }));
  }
  if (matches.length === 0 && user.email) {
    matches.push(...await base44.asServiceRole.entities.CADPersonnel.filter({ email: user.email }));
  }
  if (matches.length === 0) {
    return { error: Response.json({ error: 'CAD access required' }, { status: 403 }) };
  }
  return { user, personnel: matches[0] };
}