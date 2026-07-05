import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Ambulance, Plus, Layers, Siren, Phone, ChevronRight, Stethoscope, AlertCircle } from "lucide-react";

const STATUS_OPTS = ["Available", "Busy", "On Call", "Unavailable"];
const statusBadge = (s) => {
  if (s === "Available") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "Busy") return "bg-amber-50 text-amber-700 border border-amber-200";
  if (s === "On Call") return "bg-rose-50 text-rose-700 border border-rose-200";
  if (s === "Panic") return "bg-red-500 text-white border border-red-600 animate-pulse";
  return "bg-slate-100 text-slate-600 border border-slate-200";
};

export default function EMSDashboard({ department, session, onOpenCall, onNewCall, onManageGroups }) {
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

  useEffect(() => {
    load();
    const u1 = base44.entities.ActiveCall.subscribe(() => load());
    const u2 = base44.entities.CADSession.subscribe(() => load());
    return () => { u1(); u2(); };
  }, []);

  const setUnitStatus = async (sessionId, newStatus) => {
    try {
      await base44.entities.CADSession.update(sessionId, { status: newStatus });
      toast({ title: "Status updated", description: newStatus });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" /></div>;

  const activeCalls = calls.filter(c => c.status === "Active");
  const emergencyCalls = calls.filter(c => c.status === "Pending");
  const availableCount = sessions.filter(s => s.status === "Available").length;

  const th = "text-left px-3 py-2 font-semibold text-slate-400 text-[10px] uppercase tracking-wider whitespace-nowrap";
  const td = "px-3 py-2 border-t border-slate-100";

  const cardShell = "bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0";

  return (
    <div className="h-full overflow-hidden p-4 bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Top Left: Active Calls */}
        <div className={cardShell}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Siren className="w-4 h-4 text-emerald-600" /> Active Calls</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{activeCalls.filter(c => c.assigned_unit_ids?.length > 0).length}/{activeCalls.length}</span>
              <Button onClick={onNewCall} size="sm" className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 gap-1"><Plus className="w-3 h-3" /> New</Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10"><tr><th className={th}>ID</th><th className={th}>Call Title</th><th className={th}>Address</th><th className={th}>Units</th><th className={th}>Status</th></tr></thead>
              <tbody>
                {activeCalls.length === 0 ? <tr><td colSpan="5" className="text-center text-slate-400 py-8">No active calls</td></tr> :
                  activeCalls.map(call => (
                    <tr key={call.id} onClick={() => onOpenCall(call.id)} className="hover:bg-emerald-50/50 cursor-pointer transition-colors">
                      <td className={td + " text-slate-400 font-mono"}>{call.run_number || "—"}</td>
                      <td className={td + " text-slate-900 font-medium"}>{call.call_type}</td>
                      <td className={td + " text-slate-500 truncate max-w-[120px]"}>{call.location}</td>
                      <td className={td + " text-emerald-600 font-medium"}>{call.assigned_unit_ids?.length || 0}</td>
                      <td className={td}><span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{call.status}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Right: Active Units */}
        <div className={cardShell}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-emerald-600" /> Active Units</h3>
            <span className="text-xs text-slate-400">Available: <span className="text-emerald-600 font-bold">{availableCount}</span></span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10"><tr><th className={th}>Unit</th><th className={th}>Name</th><th className={th}>Dept</th><th className={th}>Status</th></tr></thead>
              <tbody>
                {sessions.length === 0 ? <tr><td colSpan="4" className="text-center text-slate-400 py-8">No active units</td></tr> :
                  sessions.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className={td}><span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{s.callsign || "—"}</span></td>
                      <td className={td + " text-slate-900 font-medium truncate max-w-[100px]"}>{s.user_name}</td>
                      <td className={td + " text-slate-500 truncate max-w-[80px]"}>{s.department_name || "—"}</td>
                      <td className={td}>
                        <Select value={s.status} onValueChange={(v) => setUnitStatus(s.id, v)}>
                          <SelectTrigger className="h-7 w-28 text-[10px] bg-transparent border-0 p-0 focus:ring-0 shadow-none"><span className={`px-2 py-0.5 rounded-full border ${statusBadge(s.status)}`}>{s.status}</span></SelectTrigger>
                          <SelectContent className="bg-white border-slate-200">{STATUS_OPTS.map(st => <SelectItem key={st} value={st} className="text-slate-900 text-xs">{st}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Left: Emergency Calls */}
        <div className={cardShell}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Phone className="w-4 h-4 text-rose-500" /> Emergency Calls</h3>
            <span className="text-xs text-slate-400">{emergencyCalls.length}</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10"><tr><th className={th}>ID</th><th className={th}>Type</th><th className={th}>Caller</th><th className={th}>Location</th><th className={th}>Description</th></tr></thead>
              <tbody>
                {emergencyCalls.length === 0 ? <tr><td colSpan="5" className="text-center text-slate-400 py-8">No emergency calls</td></tr> :
                  emergencyCalls.map(call => (
                    <tr key={call.id} onClick={() => onOpenCall(call.id)} className="hover:bg-rose-50/40 cursor-pointer transition-colors">
                      <td className={td + " text-slate-400 font-mono"}>{call.run_number || "—"}</td>
                      <td className={td + " text-slate-900 font-medium"}>{call.call_type}</td>
                      <td className={td + " text-slate-500 truncate max-w-[80px]"}>{call.caller_name || "—"}</td>
                      <td className={td + " text-slate-500 truncate max-w-[100px]"}>{call.location}</td>
                      <td className={td + " text-slate-400 truncate max-w-[120px]"}>{call.description}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Right: Active Groups */}
        <div className={cardShell}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-600" /> Active Groups</h3>
            <span className="text-xs text-slate-400">{groups.length}</span>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 py-8">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p className="text-xs text-slate-400">No active groups</p>
              </div>
            ) : groups.map(g => (
              <div key={g.id} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Layers className="w-4 h-4 text-emerald-600" /></div>
                  <div>
                    <p className="text-xs text-slate-900 font-medium">{g.name || "Group"}</p>
                    <p className="text-[10px] text-slate-400">{g.unit_ids?.length || 0} units</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 bg-white">
            <Button onClick={onManageGroups} size="sm" variant="outline" className="w-full h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">Manage Groups</Button>
          </div>
        </div>
      </div>
    </div>
  );
}