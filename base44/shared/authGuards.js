/* Shared authorization guards for backend functions.
   Each returns null (or { user }) when access is allowed, or a Response to return immediately.

   Access tiers:
     SYSTEM MANAGER — full control: permissions, Discord config, identifiers/emails, data wipes.
                      Platform admins (User.role === 'admin') and CADPersonnel.is_system_manager.
     SYSTEM ADMIN   — day-to-day management: create/edit/remove operational records.
                      CADPersonnel.is_cad_admin (managers are always admins too).
     CAD ACCESS     — any user with a CADPersonnel record.
*/

async function loadActor(base44) {
  let user = null;
  try {
    user = await base44.auth.me();
  } catch (_e) {
    user = null;
  }
  if (!user) return { user: null };

  // Re-read the role from the database rather than trusting token claims.
  let freshRole = user.role;
  try {
    const fresh = await base44.asServiceRole.entities.User.get(user.id);
    freshRole = fresh?.role;
  } catch (_e) { /* fall back to token claim */ }

  let personnel = null;
  if (user.discord_id) {
    const m = await base44.asServiceRole.entities.CADPersonnel.filter({ discord_id: user.discord_id });
    personnel = m[0] || null;
  }
  if (!personnel && user.email) {
    const m = await base44.asServiceRole.entities.CADPersonnel.filter({ email: user.email });
    personnel = m[0] || null;
  }

  const isPlatformAdmin = freshRole === 'admin';
  const isSystemManager = isPlatformAdmin || !!personnel?.is_system_manager;
  const isSystemAdmin = isSystemManager || !!personnel?.is_cad_admin;
  const isSupervisor = isSystemAdmin || !!personnel?.is_supervisor;

  return { user, personnel, isPlatformAdmin, isSystemManager, isSystemAdmin, isSupervisor };
}

export { loadActor };

const unauthorized = () => Response.json({ error: 'Unauthorized' }, { status: 401 });
const forbidden = (msg) => Response.json({ error: msg }, { status: 403 });

export async function requireAdmin(base44) {
  const actor = await loadActor(base44);
  if (!actor.user) return unauthorized();
  if (!actor.isSystemAdmin) return forbidden('Admin access required');
  return null;
}

/* Highest tier — everything sensitive (permissions, secrets-backed config, emails, wipes). */
export async function requireSystemManager(base44) {
  const actor = await loadActor(base44);
  if (!actor.user) return { error: unauthorized() };
  if (!actor.isSystemManager) return { error: forbidden('System Manager access required') };
  return actor;
}

/* Day-to-day administration — create / edit / remove operational records. */
export async function requireSystemAdmin(base44) {
  const actor = await loadActor(base44);
  if (!actor.user) return { error: unauthorized() };
  if (!actor.isSystemAdmin) return { error: forbidden('System Admin access required') };
  return actor;
}

/* CAD record lookups: system admins/managers, or personnel with a CAD record. */
export async function requireCADAccess(base44) {
  const actor = await loadActor(base44);
  if (!actor.user) return { error: unauthorized() };
  if (actor.isSystemAdmin) return { user: actor.user, personnel: actor.personnel };
  if (!actor.personnel) return { error: forbidden('CAD access required') };
  return { user: actor.user, personnel: actor.personnel };
}