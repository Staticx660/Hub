// Shared helpers for penal-code charges — keeps the code AND name attached everywhere.

export function formatPenalCharge(pc) {
  if (!pc) return "";
  return pc.title ? `${pc.code} - ${pc.title}` : pc.code || "";
}

/** Derive the configured Charge Type for a penal code.
 *  Matches the code's own charge_type/category (Infraction/Misdemeanor/Felony)
 *  against the ChargeType records configured in the admin panel. */
export function derivePenalChargeType(pc, chargeTypes = []) {
  if (!pc) return "";
  const candidates = [pc.charge_type, pc.category].filter(Boolean);

  // Exact name match against configured charge types
  for (const cand of candidates) {
    const exact = chargeTypes.find((ct) => ct.name?.toLowerCase() === cand.toLowerCase());
    if (exact) return exact.name;
  }

  // Level keyword (or F/M/I code prefix) match
  const raw = candidates.join(" ").toLowerCase();
  const prefix = (pc.code || "").trim().charAt(0).toUpperCase();
  const level = /felony/.test(raw) ? "felony"
    : /misdemeanor/.test(raw) ? "misdemeanor"
    : /infraction/.test(raw) ? "infraction"
    : prefix === "F" ? "felony" : prefix === "M" ? "misdemeanor" : prefix === "I" ? "infraction" : null;

  if (level) {
    const match = chargeTypes.find((ct) => ct.name?.toLowerCase().includes(level));
    if (match) return match.name;
    return level.charAt(0).toUpperCase() + level.slice(1);
  }
  return pc.charge_type || "";
}