import { postalDistance } from "./postalCoords.js";

// Departments that run dispatch — if any of their units are on duty, automation stands down.
export function countOnlineDispatchers(sessions, departments) {
  const dispatchDeptIds = new Set(
    departments.filter((d) => d.category === "Dispatch").map((d) => d.id)
  );
  return sessions.filter((s) => s.is_active && dispatchDeptIds.has(s.department_id)).length;
}

// Only one active session per user/department — mirrors the frontend dedupe rule.
export function dedupeSessions(sessions) {
  const seen = new Map();
  for (const s of sessions) {
    const key = `${s.user_id}|${s.department_id}`;
    const prev = seen.get(key);
    if (!prev || new Date(s.login_time || 0) > new Date(prev.login_time || 0)) seen.set(key, s);
  }
  return [...seen.values()];
}

const STATUS_SCORE = { Available: 100, "On Call": 40, Busy: 20, Unavailable: 0, Panic: 0 };
const PRIORITY_WEIGHT = { "1 - High": 1.5, "2 - Medium": 1.2, "3 - Low": 1 };

// Rank on-duty units for a call: department match, status, current assignment, distance, priority.
export function recommendUnits({ sessions, departments, departmentIds, call, callPostalById = {}, limit = 3 }) {
  const deptById = {};
  for (const d of departments) deptById[d.id] = d;
  const wanted = new Set(departmentIds);
  const weight = PRIORITY_WEIGHT[call.priority] || 1;

  return dedupeSessions(sessions)
    .filter((s) => s.is_active && wanted.has(s.department_id) && s.status !== "Unavailable" && !s.panic_active)
    .map((s) => {
      // A unit's only known position is the postal of the call it is currently on.
      const unitPostal = s.active_call_id ? callPostalById[s.active_call_id] : null;
      const distance = unitPostal ? postalDistance(unitPostal, call.postal) : null;
      let score = (STATUS_SCORE[s.status] ?? 30) * weight;
      if (s.active_call_id) score -= 35;
      if (distance !== null) score -= Math.min(distance / 100, 40);
      return {
        session_id: s.id,
        unit_name: s.user_name,
        callsign: s.callsign || "",
        department_name: deptById[s.department_id]?.name || "",
        status: s.status,
        distance: distance,
        score: Math.round(score),
        assigned: false,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Match the AI's requested department names/categories back to real CAD departments.
export function resolveDepartments(departments, requested) {
  const matched = [];
  for (const raw of requested || []) {
    const needle = String(raw).toLowerCase().trim();
    if (!needle) continue;
    const hit =
      departments.find((d) => d.name?.toLowerCase() === needle) ||
      departments.find((d) => d.name?.toLowerCase().includes(needle) || needle.includes(d.name?.toLowerCase())) ||
      departments.find((d) => d.category?.toLowerCase() === needle);
    if (hit && !matched.some((m) => m.id === hit.id)) matched.push(hit);
  }
  return matched;
}