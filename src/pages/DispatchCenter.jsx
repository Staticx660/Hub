import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Siren, Users, MapPin, Phone, AlertTriangle, Activity, Radio, Clock, X } from "lucide-react";
import { logSystemEvent } from "@/lib/logSystemEvent";

const priorityColors = { "1 - High": "bg-red-500/15 text-red-400 border-red-500/30", "2 - Medium": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", "3 - Low": "bg-blue-500/15 text-blue-400 border-blue-500/30" };
const statusColors = { Available: "bg-green-500/15 text-green-400", Busy: "bg-yellow-500/15 text-yellow-400", "On Call": "bg-red-500/15 text-red-400", Unavailable: "bg-gray-500/15 text-gray-400", Panic: "bg-red-500 text-white animate-pulse" };

export default function DispatchCenter() {
  const [calls, setCalls] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
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

  const closeCall = async (call) => {
    try {
      await base44.entities.ActiveCall.update(call.id, { status: "Closed" });
      logSystemEvent("Call Closed", "CAD", `Call ${call.run_number || call.call_type} closed`, { entity_type: "ActiveCall", entity_id: call.id });
      toast({ title: "Call closed" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const updatePriority = async (callId, priority) => {
    try {
      await base44.entities.ActiveCall.update(callId, { priority });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const filteredCalls = filter === "911" ? calls.filter(c => c.call_type?.includes("911")) : filter === "high" ? calls.filter(c => c.priority === "1 - High") : calls;
  const highPriorityCalls = calls.filter(c => c.priority === "1 - High");
  const calls911 = calls.filter(c => c.call_type?.includes("911"));
  const panicUnits = sessions.filter(s => s.panic_active);
  const availableUnits = sessions.filter(s => s.status === "Available");

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Radio className="w-6 h-6 text-cyan-400" /> Dispatch Center</h1>
        <p className="text-sm text-slate-400 mt-1">Coordinate active calls, monitor 911 reports, and manage available units</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Siren className="w-4 h-4 text-cyan-400" /><span className="text-xs text-slate-500 uppercase">Active Calls</span></div>
          <p className="text-2xl font-bold text-white">{calls.length}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Phone className="w-4 h-4 text-red-400" /><span className="text-xs text-slate-500 uppercase">911 Calls</span></div>
          <p className="text-2xl font-bold text-red-400">{calls911.length}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-slate-500 uppercase">High Priority</span></div>
          <p className="text-2xl font-bold text-red-400">{highPriorityCalls.length}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-green-400" /><span className="text-xs text-slate-500 uppercase">Available Units</span></div>
          <p className="text-2xl font-bold text-green-400">{availableUnits.length}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Siren className="w-4 h-4" /> Active Calls ({filteredCalls.length})</h2>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-xs w-36"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">All Calls</SelectItem>
                <SelectItem value="911" className="text-white">911 Calls</SelectItem>
                <SelectItem value="high" className="text-white">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredCalls.length === 0 ? (
            <div className="text-center py-12 text-slate-600 bg-slate-900/40 border border-slate-800 rounded-xl"><Siren className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No active calls</p></div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredCalls.map(call => (
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
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {call.location}</span>
                    {call.caller_name && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {call.caller_name}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {call.assigned_unit_ids?.length || 0} units</span>
                  </div>
                  {call.description && <p className="text-xs text-slate-400 bg-slate-800/40 rounded p-2 mb-2">{call.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <Select value={call.priority} onValueChange={v => updatePriority(call.id, v)}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">{["1 - High", "2 - Medium", "3 - Low"].map(p => <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button onClick={() => closeCall(call)} size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 text-xs">Close Call</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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