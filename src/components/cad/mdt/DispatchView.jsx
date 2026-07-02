import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Siren, MapPin, Phone, Plus, Link2, Unlink, Users, AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import SelfDispatchDialog from "@/components/cad/mdt/SelfDispatchDialog";

const priorityColors = { "1 - High": "bg-red-500/15 text-red-400 border-red-500/30", "2 - Medium": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", "3 - Low": "bg-blue-500/15 text-blue-400 border-blue-500/30" };
const statusColors = { Available: "bg-green-500/15 text-green-400", Busy: "bg-yellow-500/15 text-yellow-400", "On Call": "bg-red-500/15 text-red-400", Unavailable: "bg-gray-500/15 text-gray-400", Panic: "bg-red-500 text-white animate-pulse" };

export default function DispatchView({ department, session, setSession, setActiveView, setSelectedCallId }) {
  const [calls, setCalls] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selfDispatchOpen, setSelfDispatchOpen] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [c, s] = await Promise.all([
        base44.entities.ActiveCall.filter({ department_id: department.id }),
        base44.entities.CADSession.filter({ department_id: department.id, is_active: true }),
      ]);
      setCalls(c.filter((call) => call.status !== "Closed"));
      setSessions(s);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub1 = base44.entities.ActiveCall.subscribe(() => load());
    const unsub2 = base44.entities.CADSession.subscribe(() => load());
    return () => { unsub1(); unsub2(); };
  }, []);

  const isSupervisor = session.rank?.toLowerCase().match(/sergeant|lieutenant|captain|chief|supervisor|commander|sheriff/);

  const attachToCall = async (callId) => {
    try {
      const call = calls.find((c) => c.id === callId);
      const newIds = [...new Set([...(call.assigned_unit_ids || []), session.id])];
      const log = [...(call.assignment_log || []), { unit_name: session.callsign || session.user_name, action: "attached", timestamp: new Date().toISOString() }];
      await base44.entities.ActiveCall.update(callId, { assigned_unit_ids: newIds, assignment_log: log, status: "Active" });
      await base44.entities.CADSession.update(session.id, { active_call_id: callId, status: "On Call" });
      setSession({ ...session, active_call_id: callId, status: "On Call" });
      toast({ title: "Attached to call" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const detachFromCall = async () => {
    try {
      const call = calls.find((c) => c.id === session.active_call_id);
      if (call) {
        const newIds = (call.assigned_unit_ids || []).filter((id) => id !== session.id);
        const log = [...(call.assignment_log || []), { unit_name: session.callsign || session.user_name, action: "detached", timestamp: new Date().toISOString() }];
        await base44.entities.ActiveCall.update(call.id, { assigned_unit_ids: newIds, assignment_log: log });
      }
      await base44.entities.CADSession.update(session.id, { active_call_id: "", status: "Available" });
      setSession({ ...session, active_call_id: "", status: "Available" });
      toast({ title: "Detached from call" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const createSelfCall = async (formData) => {
    try {
      const runNum = `RUN-${Date.now().toString().slice(-6)}`;
      const newCall = await base44.entities.ActiveCall.create({
        ...formData, status: "Active", department_id: department.id, assigned_unit_ids: [session.id], run_number: runNum,
        assignment_log: [{ unit_name: session.callsign || session.user_name, action: "attached", timestamp: new Date().toISOString() }],
      });
      await base44.entities.CADSession.update(session.id, { active_call_id: newCall.id, status: "On Call" });
      setSession({ ...session, active_call_id: newCall.id, status: "On Call" });
      setSelfDispatchOpen(false);
      toast({ title: "Call created", description: runNum });
      setActiveView("mycall");
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const clearCall = async (callId) => {
    if (!confirm("Mark this call as cleared/closed?")) return;
    try {
      const call = calls.find((c) => c.id === callId);
      const log = [...(call.assignment_log || []), { unit_name: session.callsign || session.user_name, action: "cleared", timestamp: new Date().toISOString() }];
      await base44.entities.ActiveCall.update(callId, { status: "Closed", assignment_log: log });
      toast({ title: "Call cleared" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const openCall = (callId) => {
    setSelectedCallId(callId);
    setActiveView("mycall");
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;

  const myCall = calls.find((c) => c.id === session.active_call_id);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Siren className="w-4 h-4" /> Active Calls ({calls.length})</h2>
          <Button onClick={() => setSelfDispatchOpen(true)} size="sm" variant="outline" className="border-slate-700 text-slate-300 gap-1.5"><Plus className="w-3.5 h-3.5" /> Self-Dispatch</Button>
        </div>
        {myCall && (
          <div className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="text-xs font-bold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded">YOUR CALL</span><span className="font-mono text-sm text-blue-400">{myCall.run_number}</span></div>
              <div className="flex gap-2">
                <Button onClick={() => openCall(myCall.id)} size="sm" variant="ghost" className="h-7 text-blue-400 gap-1.5"><ChevronRight className="w-3 h-3" /> View</Button>
                <Button onClick={detachFromCall} size="sm" variant="outline" className="border-red-500/30 text-red-400 gap-1.5 h-7"><Unlink className="w-3 h-3" /> Detach</Button>
              </div>
            </div>
            <p className="text-white font-medium mt-2">{myCall.call_type}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {myCall.location}</p>
          </div>
        )}
        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600"><Siren className="w-12 h-12 mb-3 opacity-30" /><p>No active calls</p></div>
        ) : (
          <div className="space-y-2">
            {calls.map((call) => (
              <div key={call.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors cursor-pointer" onClick={() => openCall(call.id)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priorityColors[call.priority]}`}>{call.priority}</span>
                    <div><h3 className="font-semibold text-white text-sm">{call.call_type}</h3>{call.run_number && <span className="text-xs text-blue-400 font-mono">{call.run_number}</span>}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isSupervisor && call.status !== "Closed" && <button onClick={(e) => { e.stopPropagation(); clearCall(call.id); }} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium"><CheckCircle2 className="w-3 h-3" /> Clear</button>}
                    {call.id !== session.active_call_id && !myCall && <Button onClick={(e) => { e.stopPropagation(); attachToCall(call.id); }} size="sm" variant="ghost" className="h-7 text-blue-400 gap-1.5"><Link2 className="w-3 h-3" /> Attach</Button>}
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {call.location}</span>
                  {call.caller_name && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {call.caller_name}</span>}
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {call.assigned_unit_ids?.length || 0} units</span>
                </div>
                {call.cad_notes && <p className="text-xs text-slate-400 mt-2 bg-slate-800/50 rounded p-2">{call.cad_notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-64 border-l border-slate-800 bg-slate-900/50 p-3 overflow-y-auto flex-shrink-0">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Active Units ({sessions.length})</h2>
        <div className="space-y-1.5">
          {sessions.map((s) => (
            <div key={s.id} className={`flex items-center justify-between rounded-lg p-2.5 ${s.id === session.id ? "bg-blue-500/10 border border-blue-500/20" : "bg-slate-800/50"}`}>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{s.callsign || s.user_name}</p>
                {s.rank && <p className="text-xs text-slate-500">{s.rank}</p>}
              </div>
              <div className="flex items-center gap-1.5">
                {s.panic_active && <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
                <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[s.status] || statusColors.Unavailable}`}>{s.status}</span>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-xs text-slate-600 text-center py-4">No units on duty</p>}
        </div>
      </div>

      <SelfDispatchDialog open={selfDispatchOpen} onOpenChange={setSelfDispatchOpen} onCreate={createSelfCall} />
    </div>
  );
}