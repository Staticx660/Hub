import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Phone, Siren, Unlink, Link2, Users, Clock, Save, Radio, CheckCircle2, ArrowLeft, Send } from "lucide-react";
import GTA5Map from "@/components/cad/mdt/GTA5Map";

export default function MyCallView({ department, session, setSession, selectedCallId, setSelectedCallId, setActiveView }) {
  const [call, setCall] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState("");
  const [logInput, setLogInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const callId = selectedCallId || session.active_call_id;

  const load = async () => {
    if (!callId) { setLoading(false); return; }
    try {
      const [c, s] = await Promise.all([
        base44.entities.ActiveCall.get(callId),
        base44.entities.CADSession.filter({ department_id: department.id, is_active: true }),
      ]);
      if (c.status === "Closed") { setCall(null); } else { setCall(c); setNotes(c.cad_notes || ""); }
      setSessions(s);
    } catch (e) { setCall(null); }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); setCall(null); load(); }, [callId]);

  useEffect(() => {
    const unsub = base44.entities.ActiveCall.subscribe((event) => {
      if (!callId) return;
      if (event.type === "delete" && event.data?.id === callId) { setCall(null); setSelectedCallId(null); }
      else if (event.type === "update" && event.data?.id === callId) { load(); }
    });
    return unsub;
  }, [callId]);

  const isAttached = call?.assigned_unit_ids?.includes(session.id);
  const isSupervisor = session.rank?.toLowerCase().match(/sergeant|lieutenant|captain|chief|supervisor|commander|sheriff/);

  const saveNotes = async () => {
    setSaving(true);
    try {
      await base44.entities.ActiveCall.update(call.id, { cad_notes: notes });
      setCall({ ...call, cad_notes: notes });
      toast({ title: "CAD Notes updated" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  const attach = async () => {
    try {
      const newIds = [...new Set([...(call.assigned_unit_ids || []), session.id])];
      const log = [...(call.assignment_log || []), { unit_name: session.callsign || session.user_name, action: "attached", timestamp: new Date().toISOString() }];
      await base44.entities.ActiveCall.update(call.id, { assigned_unit_ids: newIds, assignment_log: log });
      await base44.entities.CADSession.update(session.id, { active_call_id: call.id, status: "On Call" });
      setSession({ ...session, active_call_id: call.id, status: "On Call" });
      setSelectedCallId(null);
      toast({ title: "Attached to call" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const detach = async () => {
    try {
      const newIds = (call.assigned_unit_ids || []).filter((id) => id !== session.id);
      const log = [...(call.assignment_log || []), { unit_name: session.callsign || session.user_name, action: "detached", timestamp: new Date().toISOString() }];
      await base44.entities.ActiveCall.update(call.id, { assigned_unit_ids: newIds, assignment_log: log });
      await base44.entities.CADSession.update(session.id, { active_call_id: "", status: "Available" });
      setSession({ ...session, active_call_id: "", status: "Available" });
      setSelectedCallId(null);
      toast({ title: "Detached from call" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const clearCall = async () => {
    if (!confirm("Mark this call as cleared/closed?")) return;
    try {
      const log = [...(call.assignment_log || []), { unit_name: session.callsign || session.user_name, action: "cleared", timestamp: new Date().toISOString() }];
      await base44.entities.ActiveCall.update(call.id, { status: "Closed", assignment_log: log });
      await base44.entities.CADSession.update(session.id, { active_call_id: "" });
      setSession({ ...session, active_call_id: "" });
      setSelectedCallId(null);
      setCall(null);
      setActiveView("dispatch");
      toast({ title: "Call cleared" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const addLogEntry = async () => {
    if (!logInput.trim()) return;
    try {
      const log = [...(call.assignment_log || []), { unit_name: session.callsign || session.user_name, action: "note", timestamp: new Date().toISOString(), message: logInput.trim() }];
      await base44.entities.ActiveCall.update(call.id, { assignment_log: log });
      setCall({ ...call, assignment_log: log });
      setLogInput("");
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600">
        <Radio className="w-16 h-16 mb-3 opacity-30" />
        <p className="text-lg font-medium">No Active Call</p>
        <p className="text-sm">Attach to a call from the Dispatch view to see call details here</p>
      </div>
    );
  }

  const attachedUnits = sessions.filter((s) => call.assigned_unit_ids?.includes(s.id));
  const log = call.assignment_log || [];

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {selectedCallId && selectedCallId !== session.active_call_id && (
          <button onClick={() => { setSelectedCallId(null); setActiveView("dispatch"); }} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dispatch
          </button>
        )}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center"><Siren className="w-6 h-6 text-red-400" /></div>
              <div>
                <h2 className="text-xl font-bold text-white">{call.call_type}</h2>
                {call.run_number && <span className="text-sm text-blue-400 font-mono">{call.run_number}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {call.status !== "Closed" && <Button onClick={clearCall} variant="outline" className="border-green-500/30 text-green-400 gap-2"><CheckCircle2 className="w-4 h-4" /> Clear Call</Button>}
              {isAttached ? <Button onClick={detach} variant="outline" className="border-red-500/30 text-red-400 gap-2"><Unlink className="w-4 h-4" /> Detach</Button> : <Button onClick={attach} className="bg-blue-600 hover:bg-blue-700 gap-2"><Link2 className="w-4 h-4" /> Attach</Button>}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-slate-500 block text-xs">Location</span><span className="text-slate-200 flex items-center gap-1"><MapPin className="w-3 h-3" /> {call.location}</span></div>
            <div><span className="text-slate-500 block text-xs">Priority</span><span className="text-slate-200">{call.priority}</span></div>
            <div><span className="text-slate-500 block text-xs">Caller</span><span className="text-slate-200 flex items-center gap-1"><Phone className="w-3 h-3" /> {call.caller_name || "Unknown"}</span></div>
            <div><span className="text-slate-500 block text-xs">Status</span><span className="text-slate-200">{call.status}</span></div>
          </div>
          {call.caller_phone && <p className="text-sm text-slate-400 mt-2">Caller Phone: {call.caller_phone}</p>}
          {call.description && <p className="text-sm text-slate-400 mt-3 bg-slate-800/40 rounded-lg p-3">{call.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">GTA V Location Map</h3>
            <GTA5Map location={call.location} height={280} />
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">CAD Notes</h3>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-slate-800 border-slate-700 text-white" rows={6} placeholder="Enter call notes, updates, observations..." />
            <Button onClick={saveNotes} disabled={saving || !isAttached} size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700 gap-1.5"><Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Notes"}</Button>
            {!isAttached && <p className="text-xs text-slate-500 mt-2">Attach to this call to edit notes</p>}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Attached Units ({attachedUnits.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {attachedUnits.map((u) => (
              <div key={u.id} className="bg-slate-800/50 rounded-lg p-2.5">
                <p className="text-sm text-white font-medium">{u.callsign || u.user_name}</p>
                <p className="text-xs text-slate-500">{u.rank || "Unit"}</p>
              </div>
            ))}
            {attachedUnits.length === 0 && <p className="text-sm text-slate-600">No units attached</p>}
          </div>
        </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Call Log</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
              {log.length === 0 ? <p className="text-xs text-slate-600 text-center py-2">No log entries yet</p> : log.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${entry.action === "attached" ? "bg-green-400" : entry.action === "detached" ? "bg-yellow-400" : entry.action === "cleared" ? "bg-green-400" : "bg-blue-400"}`} />
                  <div className="flex-1">
                    <span className="text-slate-300">{entry.unit_name}</span>{" "}
                    <span className="text-slate-500">{entry.action === "note" ? "" : entry.action}</span>
                    {entry.message && <span className="text-slate-200"> {entry.message}</span>}
                  </div>
                  <span className="text-slate-600 flex-shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
            {call.status !== "Closed" && (
              <div className="flex gap-2">
                <input value={logInput} onChange={e => setLogInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addLogEntry(); }} className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Type a log update..." />
                <Button onClick={addLogEntry} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5"><Send className="w-3.5 h-3.5" /></Button>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}