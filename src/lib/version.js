/* App version — patch number is the count of shipped changes below.
   Add a new entry at the TOP for every change/update; the version bumps itself. */
export const CHANGELOG = [
  { date: "2026-09-01", note: "Selectable UI themes (Enterprise, LA Style, PA Style) in CAD Settings, Edit Unit button on the MDT status strip, and removal of the Close MDT/Board menu action" },
  { date: "2026-09-01", note: "Roster side rebuilt on the enterprise MDT design system: sidebar, dashboard, shifts, LOA, org chart, certifications, documents, vehicles and uniforms" },
  { date: "2026-09-01", note: "Security hardening: private record protection for the in-game iFrame, consolidated Discord sync, and auto-dispatch re-check fix" },
  { date: "2026-08-02", note: "Rebuilt Admin Customization & Advanced panels on the enterprise design system" },
  { date: "2026-08-02", note: "Purged the legacy retro theme system across the entire CAD" },
  { date: "2026-08-02", note: "Street/cross-street dropdown combo inputs in dispatch" },
  { date: "2026-08-01", note: "Active dispatcher presence tracking in the station status strip" },
  { date: "2026-08-01", note: "Expanded New Call modal with full dispatch fields" },
  { date: "2026-08-01", note: "Enterprise rebuild of Admin members, permissions, settings and keybinds" },
  { date: "2026-07-31", note: "Unified enterprise sign-on terminal for all departments" },
  { date: "2026-07-30", note: "Dispatch and Fire/EMS command stations rebuilt as static consoles" },
  { date: "2026-07-29", note: "Civilian terminal rebuilt with enterprise form primitives" },
  { date: "2026-07-28", note: "Automated Dispatch System with AI narratives and unit routing" },
  { date: "2026-07-27", note: "Help Center with guides, setup checklist and AI assistant" },
  { date: "2026-07-26", note: "Patient Care Reports with tabbed EMS workflow" },
  { date: "2026-07-25", note: "Penal codes, charge types and bond types management" },
  { date: "2026-07-24", note: "Secure Discord account linking via bot DM and OAuth" },
  { date: "2026-07-23", note: "Permission syncing from Discord roles and CAD personnel flags" },
  { date: "2026-07-22", note: "Civilian CAD suite with DMV, vehicles and firearms" },
  { date: "2026-07-21", note: "MDT workstation with tabbed workspaces and keybinds" },
  { date: "2026-07-20", note: "Roster, shift tracking and LOA management" },
  { date: "2026-07-19", note: "Initial CAD dispatch, departments and unit sessions" },
];

export const APP_VERSION = `1.0.${String(CHANGELOG.length).padStart(2, "0")}`;