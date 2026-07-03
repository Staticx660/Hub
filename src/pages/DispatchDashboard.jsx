import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Siren, Users, MapPin, Phone, AlertTriangle, Activity, Radio, Clock } from "lucide-react";

const priorityColors = { "1 - High": "bg-red-500/15 text-red-400 border-red-500/30", "2 - Medium": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", "3 - Low": "bg-blue-500/15 text-blue-400 border-blue-500/30" };
const statusColors = { Available: "bg-green-500/15 text-green-400", Busy: "bg-yellow-500/15 text-yellow-400", "On Call": "bg-red-500/15 text-red-400", Unavailable: "bg-gray-500/15 text-gray-400", Panic: "bg-red-500 text-white animate-pulse" };

export default function DispatchDashboard() {
  const [calls, setCalls] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [c, s, d] = await Promise.all([
        base44.entities.ActiveCall.list(),
        base44.entities.CADSession.filter({ is_active: true }),
        base44.entities.CADDepartment.filter({ is_active: true }),
      ]);
      setCalls(c.filter(call => call.status !== "Closed"));
      setSessions(s);
      setDepartments(d);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub1 = base44.entities.ActiveCall.subscribe(() => load());
    const unsub2 = base44.entities.CADSession.subscribe(() => load());
    return () => { unsub1(); unsub2(); };
  }, []);

  const deptName = (id) => departments.find(d => d.id === id)?.name || "Unassigned";
  const deptColor = (id) => departments.find(d => d.id === id)?.color || "#64748b";

  const highPriorityCalls = calls.filter(c => c.priority === "1 - High");
  const panicUnits = sessions.filter(s => s.panic_active);
  const availableUnits = sessions.filter(s => s.status === "Available");
  const onCallUnits = sessions.filter(s => s.status === "On Call");

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Radio className="w-6 h-6 text-cyan-400" /> Dispatch Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time monitoring across all departments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Siren className="w-4 h-4 text-cyan-400" /><span className="text-xs text-slate-500 uppercase">Active Calls</span></div>
          <p className="text-2xl font-bold text-white">{calls.length}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-slate-500 uppercase">High Priority</span></div>
          <p className="text-2xl font-bold text-red-400">{highPriorityCalls.length}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-green-400" /><span className="text-xs text-slate-500 uppercase">Available Units</span></div>
          <p className="text-2xl font-bold text-green-400">{availableUnits.length}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-yellow-400" /><span className="text-xs text-slate-500 uppercase">On Call</span></div>
          <p className="text-2xl font-bold text-yellow-400">{onCallUnits.length}</p>
        </div>
      </div>

      {panicUnits.length > 0 && (
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-400" /><h2 className="text-red-400 font-bold">PANIC ALERTS ({panicUnits.length})</h2></div>
          <div className="space-y-1">
            {panicUnits.map(u => (
              <div key={u.id} className="flex items-center gap-3 text-sm">
                <span className="font-mono font-bold text-red-300">{u.callsign || "No callsign"}</span>
                <span className="text-white">{u.user_name}</span>
                <span className="text-slate-400">{deptName(u.department_id)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Calls */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Siren className="w-4 h-4" /> Active Calls ({calls.length})</h2>
          {calls.length === 0 ? (
            <div className="text-center py-12 text-slate-600 bg-slate-900/40 border border-slate-800 rounded-xl"><Siren className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No active calls</p></div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {calls.map(call => (
                <div key={call.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priorityColors[call.priority]}`}>{call.priority}</span>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{call.call_type}</h3>
                        {call.run_number && <span className="text-xs text-blue-400 font-mono">{call.run_number}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: deptColor(call.department_id) }} />{deptName(call.department_id)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {call.location}</span>
                    {call.caller_name && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {call.caller_name}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {call.assigned_unit_ids?.length || 0} units</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Units */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> On-Duty Units ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-slate-600 bg-slate-900/40 border border-slate-800 rounded-xl"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No units on duty</p></div>
          ) : (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
              {sessions.map(s => (
                <div key={s.id} className={`flex items-center justify-between rounded-lg p-2.5 ${s.panic_active ? "bg-red-500/10 border border-red-500/30" : "bg-slate-900/60 border border-slate-800"}`}>
                  <div className="flex items-center gap-2">
                    {s.callsign && <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{s.callsign}</span>}
                    <div>
                      <p className="text-sm text-white font-medium">{s.user_name}</p>
                      <p className="text-xs text-slate-500">{s.rank} · {deptName(s.department_id)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {s.panic_active && <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[s.status] || statusColors.Unavailable}`}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}