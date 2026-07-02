import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Phone, Siren, Unlink, Users, Clock, Save, Radio } from "lucide-react";

export default function MyCallView({ department, session, setSession }) {
  const [call, setCall] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    if (!session.active_call_id) { setLoading(false); return; }
    try {
      const [c, s] = await Promise.all([
        base44.entities.ActiveCall.get(session.active_call_id),
        base44.entities.CADSession.filter({ department_id: department.id, is_active: true }),
      ]);
      setCall(c); setSessions(s); setNotes(c.cad_notes || "");
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [session.active_call_id]);

  const saveNotes = async () => {
    setSaving(true);
    try {
      await base44.entities.ActiveCall.update(call.id, { cad_notes: notes });
      setCall({ ...call, cad_notes: notes });
      toast({ title: "CAD Notes updated" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  const detach = async () => {
    try {
      const newIds = (call.assigned_unit_ids || []).filter((id) => id !== session.id);
      const log = [...(call.assignment_log || []), { unit_name: session.callsign || session.user_name, action: "detached", timestamp: new Date().toISOString() }];
      await base44.entities.ActiveCall.update(call.id, { assigned_unit_ids: newIds, assignment_log: log });
      await base44.entities.CADSession.update(session.id, { active_call_id: "", status: "Available" });
      setSession({ ...session, active_call_id: "", status: "Available" });
      setCall(null);
      toast({ title: "Detached from call" });
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
        {/* Call Header */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center"><Siren className="w-6 h-6 text-red-400" /></div>
              <div>
                <h2 className="text-xl font-bold text-white">{call.call_type}</h2>
                {call.run_number && <span className="text-sm text-blue-400 font-mono">{call.run_number}</span>}
              </div>
            </div>
            <Button onClick={detach} variant="outline" className="border-red-500/30 text-red-400 gap-2"><Unlink className="w-4 h-4" /> Detach</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-slate-500 block text-xs">Location</span><span className="text-slate-200 flex items-center gap-1"><MapPin className="w-3 h-3" /> {call.location}</span></div>
            <div><span className="text-slate-500 block text-xs">Priority</span><span className="text-slate-200">{call.priority}</span></div>
            <div><span className="text-slate-500 block text-xs">Caller</span><span className="text-slate-200 flex items-center gap-1"><Phone className="w-3 h-3" /> {call.caller_name || "Unknown"}</span></div>
            <div><span className="text-slate-500 block text-xs">Status</span><span className="text-slate-200">{call.status}</span></div>
          </div>
          {call.description && <p className="text-sm text-slate-400 mt-3 bg-slate-800/40 rounded-lg p-3">{call.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mini Map */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Location Map</h3>
            <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950" style={{ height: "220px" }}>
              <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              <div className="absolute top-2 left-2 text-xs text-slate-600 font-mono">LOS SANTOS GRID</div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <MapPin className="w-8 h-8 text-red-500 fill-red-500/20 drop-shadow-lg" />
                <span className="text-xs text-slate-400 mt-1 bg-slate-900/80 px-2 py-0.5 rounded">{call.location}</span>
              </div>
            </div>
          </div>

          {/* CAD Notes */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">CAD Notes</h3>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-slate-800 border-slate-700 text-white" rows={6} placeholder="Enter call notes, updates, observations..." />
            <Button onClick={saveNotes} disabled={saving} size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700 gap-1.5"><Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Notes"}</Button>
          </div>
        </div>

        {/* Attached Units */}
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

        {/* Assignment Log */}
        {log.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Assignment Log</h3>
            <div className="space-y-1.5">
              {log.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${entry.action === "assigned" ? "bg-green-400" : "bg-red-400"}`} />
                  <span className="text-slate-300">{entry.unit_name}</span>
                  <span className="text-slate-500">{entry.action}</span>
                  <span className="text-slate-600 ml-auto">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}