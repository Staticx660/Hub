import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Layers, Flame, Phone, ChevronRight, Truck, AlertCircle, MapPin, Users, User } from "lucide-react";

const STATUS_OPTS = ["Available", "Busy", "On Call", "Unavailable"];
const statusBadge = (s) => {
  if (s === "Available") return "bg-green-500/15 text-green-400 border border-green-500/30";
  if (s === "Busy") return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30";
  if (s === "On Call") return "bg-red-500/15 text-red-400 border border-red-500/30";
  if (s === "Panic") return "bg-red-500 text-white border border-red-600 animate-pulse";
  return "bg-slate-700 text-slate-400 border border-slate-600";
};

const incidentIcon = (type) => {
  const t = (type || "").toLowerCase();
  if (t.includes("structure") || t.includes("fire")) return "🔥";
  if (t.includes("mva") || t.includes("accident") || t.includes("extrication")) return "🚗";
  if (t.includes("hazmat") || t.includes("chemical")) return "☣️";
  if (t.includes("rescue")) return "🪖";
  if (t.includes("medical") || t.includes("aid")) return "🚑";
  return "🚨";
};

export default function FireDashboard({ department, session, setSession, onOpenCall, onNewCall, onManageGroups }) {
  const [calls, setCalls] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  const apparatusWithCrew = groups.map(g => {
    const crew = sessions.filter(s => s.group_id === g.id);
    return { ...g, crewCount: crew.length, crewStatus: crew.length > 0 ? crew[0].status : "Off Duty" };
  });

  useEffect(() => {
    load();
    const u1 = base44.entities.ActiveCall.subscribe(() => load());
    const u2 = base44.entities.CADSession.subscribe(() => load());
    return () => { u1(); u2(); };
  }, []);

  const setUnitStatus = async (sessionId, newStatus) => {
    try {
      await base44.entities.CADSession.update(sessionId, { status: newStatus });
      if (sessionId === session.id && setSession) setSession({ ...session, status: newStatus });
      toast({ title: "Status updated", description: newStatus });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-slate-700 border-t-red-500 rounded-full animate-spin" /></div>;

  const activeCalls = calls.filter(c => c.status === "Active");
  const emergencyCalls = calls.filter(c => c.status === "Pending");
  const availableCount = sessions.filter(s => s.status === "Available").length;
  const onCallCount = sessions.filter(s => s.status === "On Call").length;

  const th = "text-left px-3 py-2 font-semibold text-slate-500 text-[10px] uppercase tracking-wider whitespace-nowrap";
  const td = "px-3 py-2 border-t border-slate-800";
  const cardShell = "bg-[#1c1518] rounded-lg border border-red-950/40 flex flex-col overflow-hidden min-h-0";

  return (
    <div className="h-full overflow-hidden p-3 bg-[#0f0c0d]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
        {/* Top Left: Active Fire Incidents */}
        <div className={cardShell}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-red-950/40">
            <h3 className="text-xs font-bold text-white flex items-center gap-2"><Flame className="w-3.5 h-3.5 text-red-400" /> ACTIVE INCIDENTS</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{activeCalls.filter(c => c.assigned_unit_ids?.length > 0).length}/{activeCalls.length}</span>
              <Button onClick={onNewCall} size="sm" className="h-6 px-2 text-xs bg-red-600 hover:bg-red-700 gap-1"><Plus className="w-3 h-3" /> New</Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#141011] sticky top-0 z-10"><tr><th className={th}>ID</th><th className={th}>Incident</th><th className={th}>Location</th><th className={th}>Apparatus</th><th className={th}>Status</th></tr></thead>
              <tbody>
                {activeCalls.length === 0 ? <tr><td colSpan="5" className="text-center text-slate-600 py-6">No active incidents</td></tr> :
                  activeCalls.map(call => (
                    <tr key={call.id} onClick={() => onOpenCall(call.id)} className="hover:bg-red-500/10 cursor-pointer transition-colors">
                      <td className={td + " text-slate-400 font-mono"}>{call.run_number || "—"}</td>
                      <td className={td + " text-white font-medium"}><span className="mr-1">{incidentIcon(call.call_type)}</span>{call.call_type}</td>
                      <td className={td + " text-slate-400 truncate max-w-[120px]"}>{call.location}</td>
                      <td className={td + " text-red-400 font-medium"}>{call.assigned_unit_ids?.length || 0}</td>
                      <td className={td}><span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">{call.status}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Right: Personnel */}
        <div className={cardShell}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-red-950/40">
            <h3 className="text-xs font-bold text-white flex items-center gap-2"><User className="w-3.5 h-3.5 text-amber-400" /> PERSONNEL</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">AVAIL: <span className="text-green-400 font-bold">{availableCount}</span></span>
              <span className="text-slate-500">ON CALL: <span className="text-red-400 font-bold">{onCallCount}</span></span>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#141011] sticky top-0 z-10"><tr><th className={th}>Person</th><th className={th}>Apparatus</th><th className={th}>Dept</th><th className={th}>Status</th></tr></thead>
              <tbody>
                {sessions.length === 0 ? <tr><td colSpan="4" className="text-center text-slate-600 py-6">No active personnel</td></tr> :
                  sessions.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className={td}>
                        <div className="flex flex-col">
                          <span className="text-white font-medium truncate max-w-[100px]">{s.user_name}</span>
                          <span className="font-mono text-[10px] text-amber-400">{s.callsign || "—"}</span>
                        </div>
                      </td>
                      <td className={td}><span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{s.group_name || "—"}</span></td>
                      <td className={td + " text-slate-400 truncate max-w-[80px]"}>{s.department_name || "—"}</td>
                      <td className={td}>
                        <Select value={s.status} onValueChange={(v) => setUnitStatus(s.id, v)}>
                          <SelectTrigger className="h-6 w-28 text-[10px] bg-transparent border-0 p-0 focus:ring-0 shadow-none"><span className={`px-1.5 py-0.5 rounded ${statusBadge(s.status)}`}>{s.status}</span></SelectTrigger>
                          <SelectContent className="bg-[#1a1e23] border-[#272d35]">{STATUS_OPTS.map(st => <SelectItem key={st} value={st} className="text-white text-xs">{st}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Left: Emergency / Pending Calls */}
        <div className={cardShell}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-red-950/40">
            <h3 className="text-xs font-bold text-white flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-red-400" /> EMERGENCY CALLS</h3>
            <span className="text-xs text-slate-500">{emergencyCalls.length}</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#141011] sticky top-0 z-10"><tr><th className={th}>ID</th><th className={th}>Type</th><th className={th}>Caller</th><th className={th}>Location</th><th className={th}>Description</th></tr></thead>
              <tbody>
                {emergencyCalls.length === 0 ? <tr><td colSpan="5" className="text-center text-slate-600 py-6">No emergency calls</td></tr> :
                  emergencyCalls.map(call => (
                    <tr key={call.id} onClick={() => onOpenCall(call.id)} className="hover:bg-red-500/10 cursor-pointer transition-colors">
                      <td className={td + " text-slate-400 font-mono"}>{call.run_number || "—"}</td>
                      <td className={td + " text-white font-medium"}><span className="mr-1">{incidentIcon(call.call_type)}</span>{call.call_type}</td>
                      <td className={td + " text-slate-400 truncate max-w-[80px]"}>{call.caller_name || "—"}</td>
                      <td className={td + " text-slate-400 truncate max-w-[100px]"}>{call.location}</td>
                      <td className={td + " text-slate-500 truncate max-w-[120px]"}>{call.description}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Right: Apparatus */}
        <div className={cardShell}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-red-950/40">
            <h3 className="text-xs font-bold text-white flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-amber-400" /> APPARATUS</h3>
            <span className="text-xs text-slate-500">{groups.length}</span>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1.5">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-700 py-8">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p className="text-xs text-slate-600">No apparatus assigned</p>
              </div>
            ) : apparatusWithCrew.map(g => (
              <div key={g.id} className="bg-[#141011] rounded-lg p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-3 h-3 text-amber-500" />
                  <span className="text-xs text-white font-medium">{g.name || "Apparatus"}</span>
                  <span className="text-[10px] text-slate-500">{g.crewCount} crew</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${g.crewCount > 0 ? statusBadge(g.crewStatus) : "bg-slate-700 text-slate-500 border border-slate-600"}`}>{g.crewCount > 0 ? g.crewStatus : "Off Duty"}</span>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-red-950/40">
            <Button onClick={onManageGroups} size="sm" variant="outline" className="w-full h-7 text-xs border-slate-700 text-slate-400 hover:text-white">Manage Apparatus</Button>
          </div>
        </div>
      </div>
    </div>
  );
}