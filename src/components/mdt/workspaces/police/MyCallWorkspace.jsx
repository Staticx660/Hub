import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Panel, Field, StatusPill, Btn, EmptyState } from "@/components/mdt/ui/primitives";
import GTA5Map from "@/components/cad/mdt/GTA5Map";
import ConfirmDialog from "@/components/mdt/ui/ConfirmDialog";
import { Radio, Link2, Unlink, CheckCircle2, Save, Send, Loader2, ArrowLeft } from "lucide-react";

const INPUT = "h-7 px-2 bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";

/** The unit's own assigned call — notes, log, attached units, map. */
export default function MyCallWorkspace({ department, session, setSession, selectedCallId, setSelectedCallId, setActiveView }) {
  const { toast } = useToast();
  const [call, setCall] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState("");
  const [logInput, setLogInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const callId = selectedCallId || session.active_call_id;

  const load = async () => {
    if (!callId) { setLoading(false); return; }
    try {
      const [c, s] = await Promise.all([
        base44.entities.ActiveCall.get(callId),
        base44.entities.CADSession.filter({ department_id: department.id, is_active: true }),
      ]);
      if (c.status === "Closed") setCall(null);
      else { setCall(c); setNotes(c.cad_notes || ""); }
      setSessions(s);
    } catch (e) { setCall(null); }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); setCall(null); load(); }, [callId]);

  useEffect(() => {
    const unsub = base44.entities.ActiveCall.subscribe((event) => {
      if (!callId) return;
      // delete events carry the id on the event itself, not always in data
      const eventId = event.id || event.data?.id;
      if (eventId !== callId) return;
      if (event.type === "delete") { setCall(null); setSelectedCallId(null); }
      else if (event.type === "update") load();
    });
    return unsub;
  }, [callId]);

  const isAttached = call?.assigned_unit_ids?.includes(session.id);

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
    try {
      const log = [...(call.assignment_log || []), { unit_name: session.callsign || session.user_name, action: "cleared", timestamp: new Date().toISOString() }];
      await base44.entities.ActiveCall.update(call.id, { status: "Closed", assignment_log: log });
      await base44.entities.CADSession.update(session.id, { active_call_id: "" });
      setSession({ ...session, active_call_id: "" });
      setSelectedCallId(null); setCall(null); setActiveView("dispatch");
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

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-mdt-dim animate-spin" /></div>;

  if (!call) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={Radio} title="No active call" hint="Attach to a call from the Call Queue to work it here" />
      </div>
    );
  }

  const attachedUnits = sessions.filter((s) => call.assigned_unit_ids?.includes(s.id));
  const log = call.assignment_log || [];

  return (
    <>
      <div className="flex items-center gap-2 h-9 px-3 border-b border-mdt-line bg-mdt-bg flex-shrink-0">
        {selectedCallId && selectedCallId !== session.active_call_id && (
          <Btn icon={ArrowLeft} onClick={() => { setSelectedCallId(null); setActiveView("dispatch"); }}>Back</Btn>
        )}
        <span className="text-[12px] uppercase tracking-[0.06em] text-mdt-muted">My Call</span>
        <span className="text-[12.5px] text-mdt-text">{call.run_number || "—"} · {call.call_type}</span>
        <StatusPill tone={call.status === "Active" ? "info" : "ok"}>{call.status}</StatusPill>
        <div className="flex-1" />
        <Btn icon={CheckCircle2} onClick={() => setClearConfirm(true)}>Clear Call</Btn>
        {isAttached ? <Btn variant="danger" icon={Unlink} onClick={detach}>Detach</Btn> : <Btn variant="primary" icon={Link2} onClick={attach}>Attach</Btn>}
      </div>

      <div className="flex-1 min-h-0 overflow-auto mdt-scroll p-2 grid grid-cols-1 xl:grid-cols-2 gap-2 auto-rows-min">
        <Panel title="Call Detail" className="xl:col-span-2" scroll={false}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 p-3">
            <Field label="Location" value={call.location} />
            <Field label="Cross Streets" value={call.cross_streets} />
            <Field label="Postal" value={call.postal} />
            <Field label="Priority" value={call.priority} />
            <Field label="Caller" value={call.caller_name} />
            <Field label="Caller Phone" value={call.caller_phone} />
            <Field label="Origin" value={call.call_origin} />
            <Field label="Units Attached" value={String(attachedUnits.length)} />
          </div>
          {call.description && <p className="mx-3 mb-3 border border-mdt-line bg-mdt-surface-2 px-3 py-2 text-[12.5px] text-mdt-text whitespace-pre-wrap">{call.description}</p>}
        </Panel>

        <Panel title="Location Map" scroll={false}>
          <div className="p-2"><GTA5Map location={call.location} height={280} /></div>
        </Panel>

        <Panel title="CAD Notes" scroll={false}>
          <div className="p-2 flex flex-col gap-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={9}
              placeholder="Call notes, updates, observations..."
              className="w-full p-2 bg-mdt-surface-2 border border-mdt-line-2 text-[12.5px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent resize-none"
            />
            <div className="flex items-center gap-2">
              <Btn variant="primary" icon={Save} onClick={saveNotes} disabled={saving || !isAttached}>{saving ? "Saving" : "Save Notes"}</Btn>
              {!isAttached && <span className="text-[11px] text-mdt-dim">Attach to this call to edit notes</span>}
            </div>
          </div>
        </Panel>

        <Panel title={`Attached Units (${attachedUnits.length})`} scroll={false}>
          {attachedUnits.length === 0 ? <p className="px-3 py-2 text-[12px] text-mdt-dim">No units attached</p> :
            attachedUnits.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-mdt-line last:border-b-0">
                <span className="text-[12.5px] text-mdt-text font-mono">{u.callsign || "—"}</span>
                <span className="text-[12.5px] text-mdt-muted flex-1 truncate">{u.user_name}</span>
                <StatusPill tone={u.status === "Available" ? "ok" : "info"}>{u.status}</StatusPill>
              </div>
            ))}
        </Panel>

        <Panel title="Call Log" scroll={false}>
          <div className="max-h-56 overflow-auto mdt-scroll">
            {log.length === 0 ? <p className="px-3 py-2 text-[12px] text-mdt-dim">No log entries yet</p> :
              log.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-1.5 border-b border-mdt-line last:border-b-0">
                  <span className="text-[11.5px] text-mdt-dim font-mono flex-shrink-0">{new Date(entry.timestamp).toLocaleTimeString("en-US", { hour12: false })}</span>
                  <span className="text-[12.5px] text-mdt-text flex-shrink-0">{entry.unit_name}</span>
                  <span className="text-[12.5px] text-mdt-muted">{entry.action === "note" ? entry.message : entry.action}</span>
                </div>
              ))}
          </div>
          <div className="flex items-center gap-2 p-2 border-t border-mdt-line">
            <input value={logInput} onChange={(e) => setLogInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLogEntry()} placeholder="Type a log update..." className={`${INPUT} flex-1`} />
            <Btn variant="primary" icon={Send} onClick={addLogEntry}>Log</Btn>
          </div>
        </Panel>
      </div>

      <ConfirmDialog
        open={clearConfirm}
        onOpenChange={setClearConfirm}
        title="Clear Call"
        description="Mark this call as cleared/closed?"
        confirmLabel="Clear Call"
        onConfirm={clearCall}
      />
    </>
  );
}