import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Phone, Plus, Layers, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { dedupeActiveSessions } from "@/lib/cadSessions";
import { playStatusBeep } from "@/components/cad/mdt/panicSound";
import { Panel, Btn, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";
import DataTable from "@/components/mdt/ui/DataTable";

const STATUS_TONE = { Available: "ok", Busy: "warn", "On Call": "crit", Unavailable: "neutral", Panic: "crit", "Off Duty": "neutral" };
const STATUS_OPTS = ["Available", "Busy", "On Call", "Unavailable"];
const GROUP_STATUS_OPTS = ["Available", "Busy", "On Call", "Unavailable", "Off Duty"];
const selectCls = "h-6 px-1 bg-mdt-surface-3 border border-mdt-line-2 text-[11px] text-mdt-text focus:outline-none focus:border-mdt-accent";

export default function DispatchView({ department, session, setSession, setActiveView, setSelectedCallId }) {
  const [calls, setCalls] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const canLogoutUnits = user?.role === "admin" || department?.category === "Dispatch";

  const load = async () => {
    try {
      const [allCalls, allSessions, allDepts] = await Promise.all([
        base44.entities.ActiveCall.list('-created_date', 500),
        base44.entities.CADSession.filter({ is_active: true }),
        base44.entities.CADDepartment.list(),
      ]);
      const nonCivilianIds = allDepts.filter(d => d.category !== "Civilian").map(d => d.id);
      setCalls(allCalls.filter(c => c.status !== "Closed"));
      setSessions(dedupeActiveSessions(allSessions.filter(s => nonCivilianIds.includes(s.department_id))));
      try {
        const g = await base44.entities.CADUnitGroup.filter({});
        setGroups(g);
      } catch { setGroups([]); }
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => {
    let timer;
    const debouncedLoad = () => { clearTimeout(timer); timer = setTimeout(() => load(), 600); };
    load();
    const u1 = base44.entities.ActiveCall.subscribe(debouncedLoad);
    const u2 = base44.entities.CADSession.subscribe(debouncedLoad);
    const u3 = base44.entities.CADUnitGroup.subscribe(debouncedLoad);
    return () => { u1(); u2(); u3(); clearTimeout(timer); };
  }, []);

  const activeCalls = calls.filter(c => c.status === "Active");
  const emergencyCalls = calls.filter(c => c.status === "Pending");
  const availableCount = sessions.filter(s => s.status === "Available").length;

  const openCall = (callId) => { setSelectedCallId(callId); setActiveView("callviewer"); };

  const setUnitStatus = async (sessionId, newStatus) => {
    try {
      await base44.entities.CADSession.update(sessionId, { status: newStatus });
      if (sessionId === session.id) setSession({ ...session, status: newStatus });
      playStatusBeep();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const removeUnit = async (sessionId) => {
    if (!confirm("Remove this unit from active duty?")) return;
    try {
      await base44.entities.CADSession.update(sessionId, { is_active: false, logout_time: new Date().toISOString(), status: "Unavailable" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const setGroupStatus = async (groupId, newStatus) => {
    try {
      await base44.entities.CADUnitGroup.update(groupId, { status: newStatus });
      playStatusBeep();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const newCall = async () => {
    try {
      const runNum = `911-${Date.now().toString().slice(-6)}`;
      const c = await base44.entities.ActiveCall.create({
        call_type: "New Call", priority: "2 - Medium", status: "Pending", location: "", description: "",
        department_id: department.id, run_number: runNum, assigned_unit_ids: [], cad_notes: "",
        call_origin: "911", postal: "", block: "",
      });
      toast({ title: "New call created", description: runNum });
      setSelectedCallId(c.id);
      setActiveView("callviewer");
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) {
    return <div className="mdt h-full bg-mdt-bg flex items-center justify-center"><div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }

  const callColumns = [
    { key: "run_number", label: "ID", width: 96, mono: true, render: (c) => c.run_number || "—" },
    { key: "call_type", label: "Call Title" },
    { key: "location", label: "Address" },
    { key: "units", label: "U", width: 40, align: "right", sortable: false, render: (c) => (c.assigned_unit_ids || []).length },
    { key: "status", label: "Status", width: 74, render: () => <StatusPill tone="ok">Active</StatusPill> },
  ];

  const emergencyColumns = [
    { key: "run_number", label: "ID", width: 96, mono: true, render: (c) => c.run_number || "—" },
    { key: "call_type", label: "Type" },
    { key: "caller_name", label: "Caller", render: (c) => c.caller_name || "—" },
    { key: "location", label: "Location" },
    { key: "description", label: "Description" },
  ];

  const unitColumns = [
    { key: "callsign", label: "Unit", width: 84, mono: true, render: (s) => <span className="text-mdt-accent font-semibold">{s.callsign || "—"}</span> },
    { key: "user_name", label: "Name" },
    { key: "department_name", label: "Dept", render: (s) => s.department_name || "—" },
    {
      key: "status", label: "Status", width: 132, sortable: false, render: (s) => (
        <select value={s.status} onChange={(e) => setUnitStatus(s.id, e.target.value)} className={selectCls} onClick={(e) => e.stopPropagation()}>
          {[...new Set([s.status, ...STATUS_OPTS])].map(st => <option key={st} value={st}>{st}</option>)}
        </select>
      ),
    },
    ...(canLogoutUnits ? [{
      key: "actions", label: "", width: 36, sortable: false, render: (s) => (
        <button onClick={(e) => { e.stopPropagation(); removeUnit(s.id); }} className="text-mdt-dim hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
      ),
    }] : []),
  ];

  return (
    <div className="mdt h-full bg-mdt-bg p-px grid grid-cols-1 lg:grid-cols-2 grid-rows-2 gap-px overflow-hidden">
      <Panel
        title="Active Calls"
        className="min-h-0"
        actions={
          <>
            <span className="text-[10.5px] text-mdt-dim">{activeCalls.filter(c => c.assigned_unit_ids?.length > 0).length}/{activeCalls.length}</span>
            <Btn variant="primary" icon={Plus} onClick={newCall}>New</Btn>
          </>
        }
      >
        <DataTable columns={callColumns} rows={activeCalls} onRowClick={(c) => openCall(c.id)} rowTone={() => "#10b981"} emptyMessage="No active calls" />
      </Panel>

      <Panel
        title="Active Units"
        className="min-h-0"
        actions={<span className="text-[10.5px] text-mdt-dim">AVAILABLE <span className="text-emerald-300 font-bold">{availableCount}</span></span>}
      >
        <DataTable columns={unitColumns} rows={sessions} rowTone={(s) => (s.status === "Available" ? "#10b981" : s.status === "On Call" ? "#ef4444" : "#f59e0b")} emptyMessage="No active units" />
      </Panel>

      <Panel
        title="Emergency Calls"
        className="min-h-0"
        actions={<span className="text-[10.5px] text-mdt-dim flex items-center gap-1"><Phone className="w-3 h-3" /> {emergencyCalls.length}</span>}
      >
        <DataTable columns={emergencyColumns} rows={emergencyCalls} onRowClick={(c) => openCall(c.id)} rowTone={() => "#ef4444"} emptyMessage="No emergency calls" />
      </Panel>

      <Panel
        title="Active Groups"
        className="min-h-0"
        actions={<Btn onClick={() => setActiveView("groups")}>Manage Groups</Btn>}
      >
        {groups.length === 0 ? (
          <EmptyState icon={Layers} title="No active groups" hint="Create groups to dispatch crews together" />
        ) : (
          <div className="divide-y divide-mdt-line">
            {groups.map(g => {
              const crewCount = sessions.filter(s => s.group_id === g.id).length;
              const maxSeats = g.max_seats || 0;
              return (
                <div key={g.id} className="flex items-center justify-between gap-2 px-2 h-8 hover:bg-mdt-surface-3/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="w-3 h-3 text-mdt-dim shrink-0" />
                    <span className="text-[12px] text-mdt-text truncate">{g.name || "Group"}</span>
                    <span className="text-[10.5px] text-mdt-dim shrink-0">{crewCount}{maxSeats ? `/${maxSeats}` : ""}</span>
                  </div>
                  <select value={g.status || "Off Duty"} onChange={(e) => setGroupStatus(g.id, e.target.value)} className={selectCls}>
                    {GROUP_STATUS_OPTS.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}