// Deduplicates active CAD sessions: keeps only the most recent session
// per user per department, so a unit never appears twice in unit lists.
export function dedupeActiveSessions(sessions) {
  const byKey = new Map();
  const time = (s) => new Date(s.login_time || s.created_date || 0).getTime();
  for (const s of sessions) {
    const key = `${s.user_id}|${s.department_id}`;
    const prev = byKey.get(key);
    if (!prev || time(s) > time(prev)) byKey.set(key, s);
  }
  return Array.from(byKey.values());
}