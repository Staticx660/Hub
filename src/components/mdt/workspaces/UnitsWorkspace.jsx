import React from "react";
import DataTable from "@/components/mdt/ui/DataTable";
import { StatusPill } from "@/components/mdt/ui/primitives";

const TONE = { Available: "ok", Busy: "warn", "On Call": "info", Unavailable: "neutral", Panic: "crit" };

/** Unit status board — one row per on-duty unit, cross-department. */
export default function UnitsWorkspace({ sessions, calls }) {
  const callFor = (id) => calls.find((c) => c.id === id);
  const columns = [
    { key: "callsign", label: "Callsign", width: 110 },
    { key: "user_name", label: "Unit", width: 160 },
    { key: "rank", label: "Rank", width: 130 },
    { key: "department_name", label: "Department", width: 180 },
    { key: "group_name", label: "Apparatus / Group", width: 160 },
    { key: "status", label: "Status", width: 105, render: (r) => <StatusPill tone={r.panic_active ? "crit" : TONE[r.status]}>{r.panic_active ? "PANIC" : r.status}</StatusPill> },
    { key: "active_call_id", label: "On Call", width: 165, render: (r) => (callFor(r.active_call_id) ? `${callFor(r.active_call_id).run_number || ""} ${callFor(r.active_call_id).call_type}` : "—") },
    { key: "login_time", label: "On Duty", width: 100, render: (r) => (r.login_time ? new Date(r.login_time).toLocaleTimeString("en-US", { hour12: false }) : "—") },
  ];

  return (
    <>
      <div className="flex items-center gap-2 h-9 px-3 border-b border-mdt-line bg-mdt-bg flex-shrink-0">
        <span className="text-[12px] uppercase tracking-[0.06em] text-mdt-muted">Unit Status Board</span>
        <span className="text-[12.5px] text-mdt-muted">{sessions.length} on duty</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
        <DataTable columns={columns} rows={sessions} sort={{ key: "callsign", dir: "asc" }} emptyMessage="No units on duty" />
      </div>
    </>
  );
}