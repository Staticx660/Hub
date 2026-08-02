import React, { useState } from "react";
import DataTable from "@/components/mdt/ui/DataTable";
import SplitView from "@/components/mdt/ui/SplitView";
import { Panel, Toolbar, StatusPill, Field, Btn, EmptyState } from "@/components/mdt/ui/primitives";
import { Radio, X, Filter } from "lucide-react";

const PRI_TONE = { "1 - High": "crit", "2 - Medium": "warn", "3 - Low": "info" };
const PRI_BAR = { "1 - High": "#ef4444", "2 - Medium": "#f59e0b", "3 - Low": "#3b82f6" };
const STATUS_TONE = { Pending: "warn", Active: "ok", Closed: "neutral" };

/** Calls workspace — dense queue table with a collapsing detail rail. */
export default function CallsWorkspace({ calls, sessions, deptName }) {
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("open");

  const rows = calls.filter((c) => (statusFilter === "open" ? c.status !== "Closed" : statusFilter === "all" ? true : c.status === "Pending"));
  const selected = rows.find((c) => c.id === selectedId) || null;
  const unitsOn = (call) => sessions.filter((s) => (call.assigned_unit_ids || []).includes(s.id));

  const columns = [
    { key: "priority", label: "P", width: 44, render: (r) => <StatusPill tone={PRI_TONE[r.priority]}>{r.priority?.[0] || "—"}</StatusPill> },
    { key: "run_number", label: "Run #", width: 110, mono: true },
    { key: "call_type", label: "Type", width: 190 },
    { key: "location", label: "Location" },
    { key: "postal", label: "Postal", width: 70, mono: true },
    { key: "units", label: "Units", width: 130, sortable: false, render: (r) => unitsOn(r).map((s) => s.callsign || s.user_name).join(", ") || <span className="text-mdt-dim">unassigned</span> },
    { key: "status", label: "Status", width: 90, render: (r) => <StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill> },
    { key: "created_date", label: "Received", width: 90, mono: true, align: "right", render: (r) => (r.created_date ? new Date(r.created_date).toLocaleTimeString("en-US", { hour12: false }) : "—") },
  ];

  return (
    <>
      <Toolbar>
        <span className="text-[11px] uppercase tracking-[0.09em] text-mdt-dim">Call Queue</span>
        <div className="flex items-center gap-px ml-1">
          {[["open", "Open"], ["pending", "Unassigned"], ["all", "All"]].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              className={`h-6 px-2 text-[11.5px] font-medium border ${statusFilter === k ? "bg-mdt-accent/20 border-mdt-accent/40 text-mdt-text" : "bg-mdt-surface border-mdt-line-2 text-mdt-muted hover:text-mdt-text"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <Filter className="w-3.5 h-3.5 text-mdt-dim" />
        <span className="text-[11.5px] text-mdt-dim">{rows.length} shown · {deptName}</span>
      </Toolbar>

      <SplitView
        showDetail={!!selected}
        master={
          <Panel title={null}>
            <DataTable
              columns={columns}
              rows={rows}
              selectedKey={selected?.id}
              onRowClick={(r) => setSelectedId(r.id === selectedId ? null : r.id)}
              rowTone={(r) => PRI_BAR[r.priority]}
              sort={{ key: "created_date", dir: "desc" }}
              emptyMessage="No calls in the queue"
            />
          </Panel>
        }
        detail={
          selected ? (
            <Panel
              title={`${selected.run_number || "Call"} — ${selected.call_type}`}
              actions={<Btn variant="ghost" icon={X} onClick={() => setSelectedId(null)} />}
              bodyClassName="p-2.5 space-y-3"
            >
              <div className="flex gap-1.5">
                <StatusPill tone={PRI_TONE[selected.priority]}>{selected.priority}</StatusPill>
                <StatusPill tone={STATUS_TONE[selected.status]}>{selected.status}</StatusPill>
                {selected.call_origin && <StatusPill>{selected.call_origin}</StatusPill>}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Location" value={selected.location} className="col-span-2" />
                <Field label="Postal" value={selected.postal} />
                <Field label="Block" value={selected.block} />
                <Field label="Cross Streets" value={selected.cross_streets} className="col-span-2" />
                <Field label="Caller" value={selected.caller_name} />
                <Field label="Phone" value={selected.caller_phone} />
              </div>
              <div>
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-0.5">Narrative</div>
                <p className="text-[12px] text-mdt-muted whitespace-pre-wrap">{selected.description || "—"}</p>
              </div>
              <div>
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1">Assigned Units</div>
                {unitsOn(selected).length === 0 ? (
                  <p className="text-[12px] text-mdt-dim">None assigned.</p>
                ) : (
                  unitsOn(selected).map((s) => (
                    <div key={s.id} className="flex items-center gap-2 h-6 text-[12px]">
                      <span className="font-mono text-mdt-text">{s.callsign || "—"}</span>
                      <span className="text-mdt-muted truncate">{s.user_name}</span>
                      <StatusPill className="ml-auto">{s.status}</StatusPill>
                    </div>
                  ))
                )}
              </div>
              {selected.assignment_log?.length > 0 && (
                <div>
                  <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1">Activity Log</div>
                  {selected.assignment_log.slice(-8).map((l, i) => (
                    <div key={i} className="text-[11.5px] text-mdt-muted border-l border-mdt-line pl-2 py-0.5">
                      <span className="font-mono text-mdt-dim">{l.timestamp ? new Date(l.timestamp).toLocaleTimeString("en-US", { hour12: false }) : ""}</span>{" "}
                      <span className="text-mdt-text">{l.unit_name}</span> {l.action} — {l.message}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          ) : (
            <Panel title="Detail"><EmptyState icon={Radio} title="Select a call" /></Panel>
          )
        }
      />
    </>
  );
}