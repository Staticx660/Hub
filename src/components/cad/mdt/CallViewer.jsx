import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Ban, Save, X, FileText, MapPin } from "lucide-react";

const CALL_TITLES = ["Structure Fire", "Medical Emergency", "Traffic Accident", "Domestic Dispute", "Burglary", "Robbery", "Assault", "Theft", "Vandalism", "Noise Complaint", "Suspicious Person", "Welfare Check", "Traffic Stop", "DUI", "Shots Fired", "Pursuit", "Other"];
const CALL_ORIGINS = ["911", "Non-Emergency", "Walk-In", "Officer Initiated", "Self-Dispatch"];
const STATUS_OPTS = ["Pending", "Active", "Closed"];
const PRIORITY_OPTS = ["1 - High", "2 - Medium", "3 - Low"];

export default function CallViewer({ department, session, selectedCallId, onSelectCall, onBack }) {
  const [call, setCall] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedCallId) loadCall();
    else setLoading(false);
  }, [selectedCallId]);

  useEffect(() => {
    const unsub = base44.entities.ActiveCall.subscribe(() => { if (selectedCallId) loadCall(); });
    return unsub;
  }, [selectedCallId]);

  const loadCall = async () => {
    try {
      const c = await base44.entities.ActiveCall.get(selectedCallId);
      setCall(c);
      const [allSessions, allDepts] = await Promise.all([
        base44.entities.CADSession.filter({ is_active: true }),
        base44.entities.CADDepartment.list(),
      ]);
      const nonCivilianIds = allDepts.filter(d => d.category !== "Civilian").map(d => d.id);
      setSessions(allSessions.filter(s => nonCivilianIds.includes(s.department_id)));
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  const update = (field, value) => setCall(prev => prev ? { ...prev, [field]: value } : prev);

  const save = async () => {
    if (!call) return;
    setSaving(true);
    try {
      await base44.entities.ActiveCall.update(call.id, {
        call_type: call.call_type, status: call.status, priority: call.priority,
        location: call.location, description: call.description, cad_notes: call.cad_notes,
        call_origin: call.call_origin, postal: call.postal, block: call.block,
      });
      toast({ title: "Call updated" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  const closeCall = async () => {
    if (!call || !confirm("Close this call? All attached units will be released.")) return;
    try {
      for (const unitId of (call.assigned_unit_ids || [])) {
        await base44.entities.CADSession.update(unitId, { active_call_id: "", status: "Available" });
      }
      const log = [...(call.assignment_log || []), { unit_name: session?.callsign || "dispatch", action: "closed", timestamp: new Date().toISOString() }];
      await base44.entities.ActiveCall.update(call.id, { status: "Closed", assigned_unit_ids: [], assignment_log: log });
      toast({ title: "Call closed" });
      onBack();
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
      setCall(c);
      if (onSelectCall) onSelectCall(c.id);
      toast({ title: "New call created", description: runNum });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const addUnit = async (unitId) => {
    try {
      const unit = sessions.find(s => s.id === unitId);
      const newIds = [...new Set([...(call.assigned_unit_ids || []), unitId])];
      const log = [...(call.assignment_log || []), { unit_name: unit?.callsign || "unit", action: "attached", timestamp: new Date().toISOString() }];
      await base44.entities.ActiveCall.update(call.id, { assigned_unit_ids: newIds, assignment_log: log, status: "Active" });
      await base44.entities.CADSession.update(unitId, { active_call_id: call.id, status: "On Call" });
      toast({ title: "Unit assigned", description: unit?.callsign || unit?.user_name });
      loadCall();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const removeUnit = async (unitId) => {
    try {
      const unit = sessions.find(s => s.id === unitId);
      const newIds = (call.assigned_unit_ids || []).filter(id => id !== unitId);
      const log = [...(call.assignment_log || []), { unit_name: unit?.callsign || "unit", action: "detached", timestamp: new Date().toISOString() }];
      await base44.entities.ActiveCall.update(call.id, { assigned_unit_ids: newIds, assignment_log: log });
      await base44.entities.CADSession.update(unitId, { active_call_id: "", status: "Available" });
      toast({ title: "Unit removed" });
      loadCall();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600">
        <FileText className="w-12 h-12 mb-3 opacity-30" />
        <p>No call selected</p>
        <button onClick={newCall} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"><Plus className="w-3.5 h-3.5" /> New Call</button>
      </div>
    );
  }

  const assignedUnits = sessions.filter(s => call.assigned_unit_ids?.includes(s.id));
  const availableUnits = sessions.filter(s => !call.assigned_unit_ids?.includes(s.id) && s.status === "Available");
  const accent = department.color || "#3b82f6";

  const fieldLabel = "text-[10px] font-bold uppercase text-slate-500 tracking-wide mb-1 block";
  const inputCls = "bg-[#1a1e23] border-[#272d35] text-white";

  return (
    <div className="flex flex-col h-full bg-[#121418]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2227] bg-[#1a1e23]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-sm font-bold text-white tracking-wide">CALL VIEWER</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={newCall} title="New Call" className="w-8 h-8 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
          <button onClick={closeCall} title="Close Call" className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 flex items-center justify-center"><Ban className="w-4 h-4" /></button>
          <button onClick={save} disabled={saving} title="Save" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent + "20", color: accent }}><Save className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Sub-header */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-[#1e2227] bg-[#1a1e23]">
        <span className="text-xs text-slate-500">DISPATCH</span>
        <span className="text-xs font-mono text-white">{call.run_number || "No Call ID"}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${call.status === "Active" ? "bg-green-500/15 text-green-400" : call.status === "Pending" ? "bg-yellow-500/15 text-yellow-400" : "bg-slate-700 text-slate-400"}`}>{call.status?.toUpperCase()}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-bold">{call.priority}</span>
      </div>

      {/* Content - 3 columns */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.5fr] gap-3">
          {/* Left Column */}
          <div className="space-y-3">
            <div>
              <label className={fieldLabel}>Call Origin</label>
              <Select value={call.call_origin || ""} onValueChange={(v) => update("call_origin", v)}>
                <SelectTrigger className={inputCls + " h-8 text-xs"}><SelectValue placeholder="Select origin" /></SelectTrigger>
                <SelectContent className="bg-[#1a1e23] border-[#272d35]">{CALL_ORIGINS.map(o => <SelectItem key={o} value={o} className="text-white text-xs">{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className={fieldLabel}>Address</label>
              <div className="grid grid-cols-2 gap-2">
                <Input value={call.postal || ""} onChange={(e) => update("postal", e.target.value)} className={inputCls + " h-8 text-xs"} placeholder="Postal" />
                <Input value={call.block || ""} onChange={(e) => update("block", e.target.value)} className={inputCls + " h-8 text-xs"} placeholder="Block" />
              </div>
              <Input value={call.location || ""} onChange={(e) => update("location", e.target.value)} className={inputCls + " h-8 text-xs mt-2"} placeholder="Address" />
            </div>
            <div>
              <label className={fieldLabel}>Call Description</label>
              <Textarea value={call.description || ""} onChange={(e) => update("description", e.target.value)} className={inputCls + " text-xs resize-none"} rows={6} placeholder="Describe the situation..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={fieldLabel}>Caller</label>
                <Input value={call.caller_name || ""} onChange={(e) => update("caller_name", e.target.value)} className={inputCls + " h-8 text-xs"} placeholder="Caller name" />
              </div>
              <div>
                <label className={fieldLabel}>Phone</label>
                <Input value={call.caller_phone || ""} onChange={(e) => update("caller_phone", e.target.value)} className={inputCls + " h-8 text-xs"} placeholder="Caller phone" />
              </div>
            </div>
          </div>

          {/* Center Column */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={fieldLabel}>Call Status</label>
                <Select value={call.status} onValueChange={(v) => update("status", v)}>
                  <SelectTrigger className={inputCls + " h-8 text-xs"}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1e23] border-[#272d35]">{STATUS_OPTS.map(s => <SelectItem key={s} value={s} className="text-white text-xs">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className={fieldLabel}>Priority</label>
                <Select value={call.priority} onValueChange={(v) => update("priority", v)}>
                  <SelectTrigger className={inputCls + " h-8 text-xs"}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1e23] border-[#272d35]">{PRIORITY_OPTS.map(p => <SelectItem key={p} value={p} className="text-white text-xs">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={fieldLabel}>Call Title</label>
                <Select value={call.call_type} onValueChange={(v) => update("call_type", v)}>
                  <SelectTrigger className={inputCls + " h-8 text-xs"}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1e23] border-[#272d35] max-h-60">{CALL_TITLES.map(t => <SelectItem key={t} value={t} className="text-white text-xs">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className={fieldLabel}>Code</label>
                <Input value={call.run_number || ""} readOnly className={inputCls + " h-8 text-xs font-mono text-slate-400"} />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Units ({assignedUnits.length})</label>
              <div className="bg-[#1a1e23] border border-[#272d35] rounded-lg p-2 space-y-1.5 min-h-[140px]">
                {assignedUnits.length === 0 && <p className="text-xs text-slate-600 text-center py-3">No units assigned</p>}
                {assignedUnits.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-[#121418] rounded p-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{u.callsign || "—"}</span>
                      <span className="text-xs text-white truncate">{u.user_name}</span>
                    </div>
                    <button onClick={() => removeUnit(u.id)} className="text-red-400 hover:text-red-300 flex-shrink-0"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {availableUnits.length > 0 && (
                  <Select onValueChange={addUnit}>
                    <SelectTrigger className="bg-[#121418] border-[#272d35] text-slate-400 h-7 text-xs"><Plus className="w-3 h-3 inline mr-1" /> Add Unit</SelectTrigger>
                    <SelectContent className="bg-[#1a1e23] border-[#272d35]">{availableUnits.map(u => <SelectItem key={u.id} value={u.id} className="text-white text-xs">{u.callsign} — {u.user_name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col">
            <label className={fieldLabel}>Call Notes</label>
            <Textarea value={call.cad_notes || ""} onChange={(e) => update("cad_notes", e.target.value)} className={inputCls + " text-xs flex-1 min-h-[300px] resize-none"} placeholder="Dispatch notes..." />
            <p className="text-[10px] text-slate-600 mt-1">NOTE</p>
          </div>
        </div>
      </div>
    </div>
  );
}