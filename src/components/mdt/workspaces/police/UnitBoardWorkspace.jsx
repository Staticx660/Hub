import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTable from "@/components/mdt/ui/DataTable";
import { StatusPill } from "@/components/mdt/ui/primitives";
import { dedupeActiveSessions } from "@/lib/cadSessions";
import { playStatusBeep } from "@/components/cad/mdt/panicSound";
import { Trash2, Loader2 } from "lucide-react";

const STATUS_OPTS = ["Available", "Busy", "On Call", "Unavailable"];
const TONE = { Available: "ok", Busy: "warn", "On Call": "info", Unavailable: "neutral", Panic: "crit" };

/** Unit status board — live roster of on-duty units with inline status control. */
export default function UnitBoardWorkspace({ session, setSession }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const canRemove = user?.role === "admin";

  const load = async () => {
    const [allSessions, allCalls, depts] = await Promise.all([
      base44.entities.CADSession.filter({ is_active: true }),
      base44.entities.ActiveCall.list("-created_date", 300),
      base44.entities.CADDepartment.list(),
    ]);
    const nonCivilian = depts.filter((d) => d.category !== "Civilian").map((d) => d.id);
    setSessions(dedupeActiveSessions(allSessions.filter((s) => nonCivilian.includes(s.department_id))));
    setCalls(allCalls);
    setLoading(false);
  };

  useEffect(() => {
    let timer;
    const debounced = () => { clearTimeout(timer); timer = setTimeout(load, 600); };
    load();
    const u1 = base44.entities.CADSession.subscribe(debounced);
    const u2 = base44.entities.ActiveCall.subscribe(debounced);
    return () => { u1(); u2(); clearTimeout(timer); };
  }, []);

  const setStatus = async (id, status) => {
    try {
      await base44.entities.CADSession.update(id, { status });
      if (id === session.id) setSession({ ...session, status });
      playStatusBeep();
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const removeUnit = async (id) => {
    if (!confirm("Remove this unit from active duty?")) return;
    try {
      await base44.entities.CADSession.update(id, { is_active: false, logout_time: new Date().toISOString(), status: "Unavailable" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const callFor = (id) => calls.find((c) => c.id === id);

  const columns = [
    { key: "callsign", label: "Callsign", width: 100, mono: true },
    { key: "user_name", label: "Unit", width: 160 },
    { key: "rank", label: "Rank", width: 130 },
    { key: "department_name", label: "Department", width: 170 },
    { key: "active_call_id", label: "On Call", width: 170, render: (r) => { const c = callFor(r.active_call_id); return c ? `${c.run_number || ""} ${c.call_type}` : "—"; } },
    {
      key: "status", label: "Status", width: 140, sortable: false,
      render: (r) => r.panic_active ? <StatusPill tone="crit">PANIC</StatusPill> : (
        <Select value={STATUS_OPTS.includes(r.status) ? r.status : undefined} onValueChange={(v) => setStatus(r.id, v)}>
          <SelectTrigger className="h-6 w-[126px] rounded-none border-mdt-line-2 bg-mdt-surface text-mdt-text text-[12px] shadow-none">
            <SelectValue placeholder={r.status} />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            {STATUS_OPTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      ),
    },
    { key: "login_time", label: "On Duty", width: 90, render: (r) => (r.login_time ? new Date(r.login_time).toLocaleTimeString("en-US", { hour12: false }) : "—") },
    ...(canRemove ? [{ key: "actions", label: "", width: 40, sortable: false, render: (r) => <button onClick={() => removeUnit(r.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button> }] : []),
  ];

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-mdt-dim animate-spin" /></div>;
  }

  return (
    <>
      <div className="flex items-center gap-3 h-9 px-3 border-b border-mdt-line bg-mdt-bg flex-shrink-0">
        <span className="text-[12px] uppercase tracking-[0.06em] text-mdt-muted">Unit Status Board</span>
        <span className="text-[12.5px] text-mdt-muted">{sessions.length} on duty · {sessions.filter((s) => s.status === "Available").length} available</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
        <DataTable columns={columns} rows={sessions} sort={{ key: "callsign", dir: "asc" }} emptyMessage="No units on duty" />
      </div>
    </>
  );
}