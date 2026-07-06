import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Users, Phone, Plus, Layers, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const statusColors = { Available: "text-green-400 bg-green-500/15", Busy: "text-yellow-400 bg-yellow-500/15", "On Call": "text-red-400 bg-red-500/15", Unavailable: "text-gray-400 bg-gray-500/15", Panic: "text-white bg-red-500 animate-pulse", "Off Duty": "text-cad-muted bg-cad-surface-3" };
const STATUS_OPTS = ["Available", "Busy", "On Call", "Unavailable"];
const GROUP_STATUS_OPTS = ["Available", "Busy", "On Call", "Unavailable", "Off Duty"];

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
      setSessions(allSessions.filter(s => nonCivilianIds.includes(s.department_id)));
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
      toast({ title: "Status updated", description: newStatus });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const removeUnit = async (sessionId) => {
    if (!confirm("Remove this unit from active duty?")) return;
    try {
      await base44.entities.CADSession.update(sessionId, { is_active: false, logout_time: new Date().toISOString(), status: "Unavailable" });
      toast({ title: "Unit removed" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const setGroupStatus = async (groupId, newStatus) => {
    try {
      await base44.entities.CADUnitGroup.update(groupId, { status: newStatus });
      toast({ title: "Group status updated", description: newStatus });
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

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-cad-border border-t-cad-accent rounded-full animate-spin" /></div>;

  const th = "text-left px-2 py-1.5 font-medium text-cad-dim text-[10px] uppercase whitespace-nowrap";
  const td = "px-2 py-2 border-t border-cad-border/40";
  const cardShell = "cad-card flex flex-col overflow-hidden min-h-0";
  const cardHead = "flex items-center justify-between px-3 py-2 border-b border-cad-border/40";
  const theadRow = "bg-cad-surface-2/60 sticky top-0 z-10";

  return (
    <div className="h-full overflow-hidden p-3 cad-gradient-bg cad-font">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
        {/* Top Left: Active Calls */}
        <div className={cardShell}>
          <div className={cardHead}>
            <h3 className="text-xs font-bold text-cad-text flex items-center gap-2"><Star className="w-3.5 h-3.5 text-red-400" /> ACTIVE CALLS</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cad-dim">{activeCalls.filter(c => c.assigned_unit_ids?.length > 0).length}/{activeCalls.length}</span>
              <Button onClick={newCall} size="sm" className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700 gap-1"><Plus className="w-3 h-3" /> New</Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto cad-scroll">
            <table className="w-full text-xs">
              <thead className={theadRow}><tr><th className={th}>ID</th><th className={th}>Call Title</th><th className={th}>Address</th><th className={th}>Units</th><th className={th}>Status</th></tr></thead>
              <tbody>
                {activeCalls.length === 0 ? <tr><td colSpan="5" className="text-center text-cad-dim py-6">No active calls</td></tr> :
                  activeCalls.map(call => (
                    <tr key={call.id} onClick={() => openCall(call.id)} className="hover:bg-cad-accent/5 cursor-pointer transition-colors">
                      <td className={td + " text-cad-muted font-mono"}>{call.run_number || "—"}</td>
                      <td className={td + " text-cad-text"}>{call.call_type}</td>
                      <td className={td + " text-cad-muted truncate max-w-[120px]"}>{call.location}</td>
                      <td className={td + " text-cad-accent"}>{call.assigned_unit_ids?.length || 0}</td>
                      <td className={td}><span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400">{call.status}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Right: Active Units */}
        <div className={cardShell}>
          <div className={cardHead}>
            <h3 className="text-xs font-bold text-cad-text flex items-center gap-2"><Users className="w-3.5 h-3.5 text-cad-accent" /> ACTIVE UNITS</h3>
            <span className="text-xs text-cad-dim">AVAILABLE: <span className="text-green-400 font-bold">{availableCount}</span></span>
          </div>
          <div className="flex-1 overflow-auto cad-scroll">
            <table className="w-full text-xs">
              <thead className={theadRow}><tr><th className={th}>Unit</th><th className={th}>Name</th><th className={th}>Dept</th><th className={th}>Status</th>{canLogoutUnits && <th className={th}>Actions</th>}</tr></thead>
              <tbody>
                {sessions.length === 0 ? <tr><td colSpan={canLogoutUnits ? 5 : 4} className="text-center text-cad-dim py-6">No active units</td></tr> :
                  sessions.map(s => (
                    <tr key={s.id} className="hover:bg-cad-surface-2/40 transition-colors">
                      <td className={td}><span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{s.callsign || "—"}</span></td>
                      <td className={td + " text-cad-text truncate max-w-[100px]"}>{s.user_name}</td>
                      <td className={td + " text-cad-muted truncate max-w-[80px]"}>{s.department_name || "—"}</td>
                      <td className={td}>
                        <Select value={s.status} onValueChange={(v) => setUnitStatus(s.id, v)}>
                          <SelectTrigger className="h-6 w-28 text-[10px] bg-transparent border-0 p-0 focus:ring-0"><span className={`px-1.5 py-0.5 rounded ${statusColors[s.status] || statusColors.Unavailable}`}>{s.status}</span></SelectTrigger>
                          <SelectContent className="bg-cad-surface border-cad-border">{STATUS_OPTS.map(st => <SelectItem key={st} value={st} className="text-cad-text text-xs">{st}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      {canLogoutUnits && <td className={td}><button onClick={() => removeUnit(s.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button></td>}
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Left: Emergency Calls */}
        <div className={cardShell}>
          <div className={cardHead}>
            <h3 className="text-xs font-bold text-cad-text flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-red-400" /> EMERGENCY CALLS</h3>
            <span className="text-xs text-cad-dim">{emergencyCalls.length}</span>
          </div>
          <div className="flex-1 overflow-auto cad-scroll">
            <table className="w-full text-xs">
              <thead className={theadRow}><tr><th className={th}>ID</th><th className={th}>Type</th><th className={th}>Caller</th><th className={th}>Location</th><th className={th}>Description</th></tr></thead>
              <tbody>
                {emergencyCalls.length === 0 ? <tr><td colSpan="5" className="text-center text-cad-dim py-6">No emergency calls</td></tr> :
                  emergencyCalls.map(call => (
                    <tr key={call.id} onClick={() => openCall(call.id)} className="hover:bg-cad-accent/5 cursor-pointer transition-colors">
                      <td className={td + " text-cad-muted font-mono"}>{call.run_number || "—"}</td>
                      <td className={td + " text-cad-text"}>{call.call_type}</td>
                      <td className={td + " text-cad-muted truncate max-w-[80px]"}>{call.caller_name || "—"}</td>
                      <td className={td + " text-cad-muted truncate max-w-[100px]"}>{call.location}</td>
                      <td className={td + " text-cad-dim truncate max-w-[120px]"}>{call.description}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Right: Active Groups */}
        <div className={cardShell}>
          <div className={cardHead}>
            <h3 className="text-xs font-bold text-cad-text flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-cad-accent" /> ACTIVE GROUPS</h3>
            <span className="text-xs text-cad-dim">{groups.length}</span>
          </div>
          <div className="flex-1 overflow-auto cad-scroll p-2 space-y-1.5">
            {groups.length === 0 ? <p className="text-xs text-cad-dim text-center py-6">No active groups</p> :
              groups.map(g => {
                const crewCount = sessions.filter(s => s.group_id === g.id).length;
                const maxSeats = g.max_seats || 0;
                return (
                  <div key={g.id} className="bg-cad-surface-2/40 rounded-lg p-2 flex items-center justify-between gap-2 transition-colors hover:bg-cad-surface-2/60">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Layers className="w-3 h-3 text-cad-dim shrink-0" />
                      <span className="text-xs text-cad-text font-medium truncate">{g.name || "Group"}</span>
                      <span className="text-[10px] text-cad-dim shrink-0">{crewCount}{maxSeats ? `/${maxSeats}` : ""}</span>
                    </div>
                    <Select value={g.status || "Off Duty"} onValueChange={(v) => setGroupStatus(g.id, v)}>
                      <SelectTrigger className="h-6 w-28 text-[10px] bg-transparent border-0 p-0 focus:ring-0 shadow-none shrink-0"><span className={`px-1.5 py-0.5 rounded ${statusColors[g.status] || statusColors["Off Duty"]}`}>{g.status || "Off Duty"}</span></SelectTrigger>
                      <SelectContent className="bg-cad-surface border-cad-border">{GROUP_STATUS_OPTS.map(st => <SelectItem key={st} value={st} className="text-cad-text text-xs">{st}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                );
              })
            }
          </div>
          <div className="p-2 border-t border-cad-border/40">
            <Button onClick={() => setActiveView("groups")} size="sm" variant="outline" className="w-full h-7 text-xs border-cad-border text-cad-muted hover:text-cad-text">Manage Groups</Button>
          </div>
        </div>
      </div>

    </div>
  );
}