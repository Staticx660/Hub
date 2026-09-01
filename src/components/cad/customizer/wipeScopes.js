// Wipe scopes mirror the SCOPES map in base44/functions/wipeSystemData.
export const WIPE_SCOPES = [
  { key: "calls", label: "Active Calls", desc: "All dispatch calls, pending, active and closed." },
  { key: "bolos", label: "BOLOs", desc: "All be-on-the-lookout entries." },
  { key: "warrants", label: "Warrants", desc: "All warrant records." },
  { key: "civilians", label: "Civilians", desc: "All civilian character records and their licenses." },
  { key: "vehicles", label: "Civilian Vehicles", desc: "All registered vehicle records." },
  { key: "firearms", label: "Firearms", desc: "All registered firearm records." },
  { key: "reports", label: "Reports", desc: "All incident, arrest, citation and other filed reports." },
  { key: "pcrs", label: "Patient Care Reports", desc: "All EMS patient care reports." },
  { key: "sessions", label: "Sessions & Unit Groups", desc: "All active unit sessions and unit groups." },
];