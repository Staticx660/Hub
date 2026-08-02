import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Layers, Flame, Phone, ChevronRight, Truck, AlertCircle, MapPin, Users, User } from "lucide-react";
import { dedupeActiveSessions } from "@/lib/cadSessions";

const STATUS_OPTS = ["Available", "Busy", "On Call", "Unavailable"];
const statusBadge = (s) => {
  if (s === "Available") return "bg-green-500/15 text-green-400 border border-green-500/30";
  if (s === "Busy") return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30";
  if (s === "On Call") return "bg-red-500/15 text-red-400 border border-red-500/30";
  if (s === "Panic") return "bg-red-500 text-white border border-red-600 animate-pulse";
  return "bg-cad-surface-3 text-cad-muted border border-cad-border";
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
      setSessions(dedupeActiveSessions(allSessions.filter(s => nonCivilianIds.includes(s.department_id))));
      try {
        const g = await base44.entities.CADUnitGroup.filter({});
        setGroups(g);
      } catch { setGroups([]); }
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  const apparatusWithCrew = groups.map(g => {
    const crew = sessions.filter(s => s.group_id === g.id);
    return { ...g, crewCount: crew.length };
  });

  useEffect(() => {
    let timer;
    const debouncedLoad = () => { clearTimeout(timer); timer = setTimeout(() => load(), 600); };
    load();
    const u1 = base44.entities.ActiveCall.subscribe(debouncedLoad);
    const u2 = base44.entities.CADSession.subscribe(debouncedLoad);
    const u3 = base44.entities.CADUnitGroup.subscribe(debouncedLoad);
    return () => { u1(); u2(); u3(); clearTimeout(timer); };
  }, []);

  const setUnitStatus = async (sessionId, newStatus) => {
    try {
      await base44.entities.CADSession.update(sessionId, { status: newStatus });
      if (sessionId === session.id && setSession) setSession({ ...session, status: newStatus });
      toast({ title: "Status updated", description: newStatus });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-cad-border border-t-red-500 rounded-full animate-spin" /></div>;

  const activeCalls = calls.filter(c => c.status === "Active");
  const emergencyCalls = calls.filter(c => c.status === "Pending");
  const availableCount = sessions.filter(s => s.status === "Available").length;
  const onCallCount = sessions.filter(s => s.status === "On Call").length;

  const th = "text-left px-3 py-2 font-semibold text-cad-dim text-[10px] uppercase tracking-wider whitespace-nowrap";
  const td = "px-3 py-2 border-t border-cad-border/40";
  const cardShell = "cad-card flex flex-col overflow-hidden min-h-0";
  const cardHead = "flex items-center justify-between px-3 py-2 border-b border-cad-border/40";
  const theadRow = "bg-cad-surface-2/60 sticky top-0 z-10";

  return (
    <div className="h-full overflow-hidden p-3 cad-gradient-bg cad-font">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
        {/* Top Left: Active Fire Incidents */}
        <div className={cardShell}>
          <div className={cardHead}>
            <h3 className="text-xs font-bold text-cad-text flex items-center gap-2"><Flame className="w-3.5 h-3.5 text-red-400" /> ACTIVE INCIDENTS</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cad-dim">{activeCalls.filter(c => c.assigned_unit_ids?.length > 0).length}/{activeCalls.length}</span>
              <Button onClick={onNewCall} size="sm" className="h-6 px-2 text-xs bg-red-600 hover:bg-red-700 gap-1"><Plus className="w-3 h-3" /> New</Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto cad-scroll">
            <table className="w-full text-xs">
              <thead className={theadRow}><tr><th className={th}>ID</th><th className={th}>Incident</th><th className={th}>Location</th><th className={th}>Apparatus</th><th className={th}>Status</th></tr></thead>
              <tbody>
                {activeCalls.length === 0 ? <tr><td colSpan="5" className="text-center text-cad-dim py-6">No active incidents</td></tr> :
                  activeCalls.map(call => (
                    <tr key={call.id} onClick={() => onOpenCall(call.id)} className="hover:bg-red-500/10 cursor-pointer transition-colors">
                      <td className={td + " text-cad-muted font-mono"}>{call.run_number || "—"}</td>
                      <td className={td + " text-cad-text font-medium"}><span className="mr-1">{incidentIcon(call.call_type)}</span>{call.call_type}</td>
                      <td className={td + " text-cad-muted truncate max-w-[120px]"}>{call.location}</td>
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
          <div className={cardHead}>
            <h3 className="text-xs font-bold text-cad-text flex items-center gap-2"><User className="w-3.5 h-3.5 text-amber-400" /> PERSONNEL</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-cad-dim">AVAIL: <span className="text-green-400 font-bold">{availableCount}</span></span>
              <span className="text-cad-dim">ON CALL: <span className="text-red-400 font-bold">{onCallCount}</span></span>
            </div>
          </div>
          <div className="flex-1 overflow-auto cad-scroll">
            <table className="w-full text-xs">
              <thead className={theadRow}><tr><th className={th}>Person</th><th className={th}>Apparatus</th><th className={th}>Dept</th><th className={th}>Status</th></tr></thead>
              <tbody>
                {sessions.length === 0 ? <tr><td colSpan="4" className="text-center text-cad-dim py-6">No active personnel</td></tr> :
                  sessions.map(s => (
                    <tr key={s.id} className="hover:bg-cad-surface-2/40 transition-colors">
                      <td className={td}>
                        <div className="flex flex-col">
                          <span className="text-cad-text font-medium truncate max-w-[100px]">{s.user_name}</span>
                          <span className="font-mono text-[10px] text-amber-400">{s.callsign || "—"}</span>
                        </div>
                      </td>
                      <td className={td}><span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{s.group_name || "—"}</span></td>
                      <td className={td + " text-cad-muted truncate max-w-[80px]"}>{s.department_name || "—"}</td>
                      <td className={td}>
                        <Select value={s.status} onValueChange={(v) => setUnitStatus(s.id, v)}>
                          <SelectTrigger className="h-6 w-28 text-[10px] bg-transparent border-0 p-0 focus:ring-0 shadow-none"><span className={`px-1.5 py-0.5 rounded ${statusBadge(s.status)}`}>{s.status}</span></SelectTrigger>
                          <SelectContent className="bg-cad-surface border-cad-border">{STATUS_OPTS.map(st => <SelectItem key={st} value={st} className="text-cad-text text-xs">{st}</SelectItem>)}</SelectContent>
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
                    <tr key={call.id} onClick={() => onOpenCall(call.id)} className="hover:bg-red-500/10 cursor-pointer transition-colors">
                      <td className={td + " text-cad-muted font-mono"}>{call.run_number || "—"}</td>
                      <td className={td + " text-cad-text font-medium"}><span className="mr-1">{incidentIcon(call.call_type)}</span>{call.call_type}</td>
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

        {/* Bottom Right: Apparatus */}
        <div className={cardShell}>
          <div className={cardHead}>
            <h3 className="text-xs font-bold text-cad-text flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-amber-400" /> APPARATUS</h3>
            <span className="text-xs text-cad-dim">{groups.length}</span>
          </div>
          <div className="flex-1 overflow-auto cad-scroll p-2 space-y-1.5">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-cad-dim py-8">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p className="text-xs">No apparatus assigned</p>
              </div>
            ) : apparatusWithCrew.map(g => {
              const maxSeats = g.max_seats || 0;
              const minSeats = g.min_seats || 0;
              const understaffed = minSeats > 0 && g.crewCount < minSeats;
              return (
                <div key={g.id} className="bg-cad-surface-2/40 rounded-lg p-2 flex items-center justify-between transition-colors hover:bg-cad-surface-2/60">
                  <div className="flex items-center gap-2">
                    <Truck className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-cad-text font-medium">{g.name || "Apparatus"}</span>
                    <span className={`text-[10px] ${understaffed ? "text-red-400 font-bold" : "text-cad-dim"}`}>{g.crewCount}{maxSeats ? `/${maxSeats}` : ""} crew{understaffed ? " ⚠" : ""}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusBadge(g.status || "Off Duty")}`}>{g.status || "Off Duty"}</span>
                </div>
              );
            })}
          </div>
          <div className="p-2 border-t border-cad-border/40">
            <Button onClick={onManageGroups} size="sm" variant="outline" className="w-full h-7 text-xs border-cad-border text-cad-muted hover:text-cad-text">Manage Apparatus</Button>
          </div>
        </div>
      </div>
    </div>
  );
}