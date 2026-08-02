import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import DataTable from "@/components/mdt/ui/DataTable";
import DockedDetail from "@/components/mdt/ui/DockedDetail";
import { StatusPill } from "@/components/mdt/ui/primitives";
import { Plus, Loader2 } from "lucide-react";

const PRI_TONE = { "1 - High": "crit", "2 - Medium": "warn", "3 - Low": "info" };
const PRI_BAR = { "1 - High": "#ef4444", "2 - Medium": "#f59e0b", "3 - Low": "#3b82f6" };
const STATUS_TONE = { Pending: "ok", Active: "info", Closed: "neutral" };
const FILTERS = [["open", "Open"], ["pending", "Unassigned"], ["active", "Active"], ["all", "All"]];

/** Police call queue — dense table plus docked detail with attach/detach. */
export default function CallQueueWorkspace({ department, session, setSession, onOpenCall, detailCollapsed }) {
  const { toast } = useToast();
  const [calls, setCalls] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    const [allCalls, allSessions] = await Promise.all([
      base44.entities.ActiveCall.list("-created_date", 500),
      base44.entities.CADSession.filter({ is_active: true }),
    ]);
    setCalls(allCalls);
    setSessions(allSessions);
    setLoading(false);
  };

  useEffect(() => {
    let timer;
    const debounced = () => { clearTimeout(timer); timer = setTimeout(load, 600); };
    load();
    const u1 = base44.entities.ActiveCall.subscribe(debounced);
    const u2 = base44.entities.CADSession.subscribe(debounced);
    return () => { u1(); u2(); clearTimeout(timer); };
  }, []);

  const rows = calls.filter((c) =>
    filter === "all" ? true :
    filter === "open" ? c.status !== "Closed" :
    filter === "pending" ? c.status === "Pending" : c.status === "Active"
  );
  const selected = rows.find((c) => c.id === selectedId) || null;
  const unitsOn = (call) => sessions.filter((s) => (call.assigned_unit_ids || []).includes(s.id));
  const attached = selected ? (selected.assigned_unit_ids || []).includes(session.id) : false;

  const newCall = async () => {
    try {
      const runNum = `911-${Date.now().toString().slice(-6)}`;
      const c = await base44.entities.ActiveCall.create({
        call_type: "New Call", priority: "2 - Medium", status: "Pending", location: "", description: "",
        department_id: department.id, run_number: runNum, assigned_unit_ids: [], cad_notes: "",
        call_origin: "911", postal: "", block: "",
      });
      onOpenCall(c.id);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const toggleAttach = async () => {
    try {
      const ids = selected.assigned_unit_ids || [];
      const next = attached ? ids.filter((id) => id !== session.id) : [...ids, session.id];
      const log = [...(selected.assignment_log || []), {
        unit_name: session.callsign || session.user_name,
        action: attached ? "detached" : "attached",
        timestamp: new Date().toISOString(),
      }];
      await base44.entities.ActiveCall.update(selected.id, {
        assigned_unit_ids: next,
        assignment_log: log,
        status: !attached && selected.status === "Pending" ? "Active" : selected.status,
      });
      const sessionUpdates = attached
        ? { active_call_id: "", status: "Available" }
        : { active_call_id: selected.id, status: "On Call" };
      await base44.entities.CADSession.update(session.id, sessionUpdates);
      setSession({ ...session, ...sessionUpdates });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const columns = [
    { key: "priority", label: "P", width: 40, render: (r) => <StatusPill tone={PRI_TONE[r.priority]}>{r.priority?.[0] || "—"}</StatusPill> },
    { key: "run_number", label: "Run #", width: 110 },
    { key: "call_type", label: "Type", width: 170 },
    { key: "location", label: "Location", width: 150 },
    { key: "postal", label: "Postal", width: 68 },
    { key: "units", label: "Units", width: 120, sortable: false, render: (r) => unitsOn(r).map((s) => s.callsign || s.user_name).join(", ") || <span className="text-mdt-muted">unassigned</span> },
    { key: "status", label: "Status", width: 92, render: (r) => <StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill> },
    { key: "created_date", label: "Received", width: 100, render: (r) => (r.created_date ? new Date(r.created_date).toLocaleTimeString("en-US", { hour12: false }) : "—") },
  ];

  const detailRows = selected ? [
    { label: "Description", value: [selected.call_type, selected.location].filter(Boolean).join(", ") },
    { label: "Narrative", value: selected.description },
    { label: "Location", value: [selected.location, selected.cross_streets, selected.postal && `Postal ${selected.postal}`].filter(Boolean).join(" · ") },
    { label: "Caller", value: [selected.caller_name, selected.caller_phone].filter(Boolean).join(" · ") },
    { label: "Assigned Units", value: unitsOn(selected).map((s) => `${s.callsign || "—"} ${s.user_name}`).join(", ") || "unassigned" },
    { label: "Priority / Status", value: `${selected.priority || "—"} · ${selected.status}` },
  ] : [];

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-mdt-dim animate-spin" /></div>;
  }

  return (
    <>
      <div className="flex items-center gap-2 h-9 px-3 border-b border-mdt-line bg-mdt-bg flex-shrink-0">
        <span className="text-[12px] uppercase tracking-[0.06em] text-mdt-muted">Call Queue</span>
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`h-6 px-2.5 text-[12.5px] border ${filter === k ? "bg-mdt-accent/15 border-mdt-accent/60 text-mdt-accent" : "bg-mdt-surface border-mdt-line text-mdt-text hover:bg-mdt-surface-3"}`}
          >
            {label}
          </button>
        ))}
        <span className="text-[12.5px] text-mdt-muted ml-1">{rows.length} shown</span>
        <div className="flex-1" />
        <button onClick={newCall} className="flex items-center gap-1.5 h-6 px-2.5 border border-mdt-accent/60 bg-mdt-accent/15 text-mdt-accent text-[12.5px]">
          <Plus className="w-3.5 h-3.5" /> New Call
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
        <DataTable
          columns={columns}
          rows={rows}
          selectedKey={selected?.id}
          onRowClick={(r) => setSelectedId(r.id === selectedId ? null : r.id)}
          onRowDoubleClick={(r) => onOpenCall(r.id)}
          rowTone={(r) => PRI_BAR[r.priority]}
          sort={{ key: "created_date", dir: "desc" }}
          emptyMessage="No calls in the queue"
        />
      </div>

      {selected && !detailCollapsed && (
        <DockedDetail
          title={`Selected Call: ${selected.run_number || selected.call_type}`}
          rows={detailRows}
          footer={
            <div className="flex items-center gap-2">
              <button onClick={toggleAttach} className="h-7 px-3 border border-mdt-accent/60 bg-mdt-accent/15 text-mdt-accent text-[12.5px]">
                {attached ? "Detach From Call" : "Attach To Call"}
              </button>
              <button onClick={() => onOpenCall(selected.id)} className="h-7 px-3 border border-mdt-line-2 bg-mdt-surface text-mdt-text text-[12.5px] hover:bg-mdt-surface-3">
                Open Full Record
              </button>
            </div>
          }
        />
      )}
    </>
  );
}