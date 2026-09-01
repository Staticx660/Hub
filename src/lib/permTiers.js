/**
 * Single source of truth for how a personnel record's permission flags map to a
 * named access tier. Every admin surface uses this so labels never disagree.
 */
export const TIERS = {
  manager: { label: "System Manager", tone: "warn" },
  admin: { label: "System Admin", tone: "info" },
  supervisor: { label: "Supervisor", tone: "ok" },
  standard: { label: "Standard", tone: "neutral" },
};

export function permTier(personnel) {
  if (!personnel) return TIERS.standard;
  if (personnel.is_system_manager) return TIERS.manager;
  if (personnel.is_cad_admin) return TIERS.admin;
  if (personnel.is_supervisor) return TIERS.supervisor;
  return TIERS.standard;
}