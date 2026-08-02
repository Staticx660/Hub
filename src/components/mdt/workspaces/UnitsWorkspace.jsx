import React from "react";
import DataTable from "@/components/mdt/ui/DataTable";
import { Panel, Toolbar, StatusPill } from "@/components/mdt/ui/primitives";

const TONE = { Available: "ok", Busy: "warn", "On Call": "info", Unavailable: "neutral", Panic: "crit" };

/** Unit status board — one row per on-duty unit, cross-department. */
export default function UnitsWorkspace({ sessions, calls }) {
  const callFor = (id) => calls.find((c) => c.id === id);
  const columns = [
    { key: "callsign", label: "Callsign", width: 110, mono: true },
    { key: "user_name", label: "Unit" },
    { key: "rank", label: "Rank", width: 130 },
    { key: "department_name", label: "Department", width: 190 },
    { key: "group_name", label: "Apparatus / Group", width: 170 },
    { key: "status", label: "Status", width: 110, render: (r) => <StatusPill tone={r.panic_active ? "crit" : TONE[r.status]}>{r.panic_active ? "PANIC" : r.status}</StatusPill> },
    { key: "active_call_id", label: "On Call", width: 170, render: (r) => (callFor(r.active_call_id) ? `${callFor(r.active_call_id).run_number || ""} ${callFor(r.active_call_id).call_type}` : "—") },
    { key: "login_time", label: "On Duty", width: 90, mono: true, align: "right", render: (r) => (r.login_time ? new Date(r.login_time).toLocaleTimeString("en-US", { hour12: false }) : "—") },
  ];

  return (
    <>
      <Toolbar>
        <span className="text-[11px] uppercase tracking-[0.09em] text-mdt-dim">Unit Status Board</span>
        <span className="text-[11.5px] text-mdt-dim">{sessions.length} on duty</span>
      </Toolbar>
      <Panel title={null} className="flex-1">
        <DataTable columns={columns} rows={sessions} sort={{ key: "callsign", dir: "asc" }} emptyMessage="No units on duty" />
      </Panel>
    </>
  );
}