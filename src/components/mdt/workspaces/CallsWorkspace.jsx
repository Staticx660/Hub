import React, { useState } from "react";
import DataTable from "@/components/mdt/ui/DataTable";
import DockedDetail from "@/components/mdt/ui/DockedDetail";
import { StatusPill } from "@/components/mdt/ui/primitives";
import { Filter } from "lucide-react";

const PRI_TONE = { "1 - High": "crit", "2 - Medium": "warn", "3 - Low": "info" };
const PRI_BAR = { "1 - High": "#ef4444", "2 - Medium": "#f59e0b", "3 - Low": "#3b82f6" };
const STATUS_TONE = { Pending: "ok", Active: "info", Closed: "neutral" };

/** Calls workspace — maximized queue table with a bottom-docked detail pane. */
export default function CallsWorkspace({ calls, sessions, deptName, detailCollapsed }) {
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("open");

  const rows = calls.filter((c) => (statusFilter === "open" ? c.status !== "Closed" : statusFilter === "all" ? true : c.status === "Pending"));
  const selected = rows.find((c) => c.id === selectedId) || null;
  const unitsOn = (call) => sessions.filter((s) => (call.assigned_unit_ids || []).includes(s.id));

  const columns = [
    { key: "priority", label: "P", width: 40, render: (r) => <StatusPill tone={PRI_TONE[r.priority]}>{r.priority?.[0] || "—"}</StatusPill> },
    { key: "run_number", label: "Run #", width: 110 },
    { key: "call_type", label: "Type", width: 165 },
    { key: "location", label: "Location", width: 140 },
    { key: "postal", label: "Postal", width: 68 },
    { key: "units", label: "Units", width: 105, sortable: false, render: (r) => unitsOn(r).map((s) => s.callsign || s.user_name).join(", ") || <span className="text-mdt-muted">unassigned</span> },
    { key: "status", label: "Status", width: 90, render: (r) => <StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill> },
    { key: "created_date", label: "Received", width: 100, render: (r) => (r.created_date ? new Date(r.created_date).toLocaleTimeString("en-US", { hour12: false }) : "—") },
  ];

  const detailRows = selected
    ? [
        { label: "Description", value: [selected.call_type, selected.location].filter(Boolean).join(", ") },
        { label: "Narrative", value: selected.description },
        { label: "Location", value: [selected.location, selected.cross_streets, selected.postal && `Postal ${selected.postal}`].filter(Boolean).join(" · ") },
        { label: "Caller", value: [selected.caller_name, selected.caller_phone].filter(Boolean).join(" · ") },
        { label: "Assigned Units", value: unitsOn(selected).map((s) => `${s.callsign || "—"} ${s.user_name}`).join(", ") || "unassigned" },
        { label: "Priority / Status", value: `${selected.priority || "—"} · ${selected.status}` },
      ]
    : [];

  return (
    <>
      <div className="flex items-center gap-2 h-9 px-3 border-b border-mdt-line bg-mdt-bg flex-shrink-0">
        <span className="text-[12px] uppercase tracking-[0.06em] text-mdt-muted">Call Queue</span>
        <div className="flex items-center gap-1.5 ml-1">
          {[["open", "Open"], ["pending", "Unassigned"], ["all", "All"]].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              className={`h-6 px-2.5 text-[12.5px] border ${statusFilter === k ? "bg-mdt-accent/15 border-mdt-accent/60 text-mdt-accent" : "bg-mdt-surface border-mdt-line text-mdt-text hover:bg-mdt-surface-3"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <Filter className="w-3.5 h-3.5 text-mdt-dim ml-1" />
        <span className="text-[12.5px] text-mdt-muted">{rows.length} shown · {deptName}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
        <DataTable
          columns={columns}
          rows={rows}
          selectedKey={selected?.id}
          onRowClick={(r) => setSelectedId(r.id === selectedId ? null : r.id)}
          rowTone={(r) => PRI_BAR[r.priority]}
          sort={{ key: "created_date", dir: "desc" }}
          emptyMessage="No calls in the queue"
        />
      </div>

      {selected && !detailCollapsed && <DockedDetail title={`Selected Call: ${selected.run_number || selected.call_type}`} rows={detailRows} />}
    </>
  );
}