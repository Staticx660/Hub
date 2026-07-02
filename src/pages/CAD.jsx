import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, MapPin, Phone, X, Siren, Building2, Layers, CheckCircle2 } from "lucide-react";

const priorityColors = { "1 - High": "bg-red-500/15 text-red-400 border-red-500/30", "2 - Medium": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", "3 - Low": "bg-blue-500/15 text-blue-400 border-blue-500/30" };
const unitStatusColors = { "Available": "bg-green-500/15 text-green-400", "On Call": "bg-red-500/15 text-red-400", "Transporting": "bg-yellow-500/15 text-yellow-400", "Out of Service": "bg-gray-500/15 text-gray-400", "Off Duty": "bg-slate-700 text-slate-400" };
const emptyCallForm = { call_type: "", priority: "3 - Low", location: "", description: "", caller_name: "", caller_phone: "", department_id: "" };

export default function CAD() {
  const [calls, setCalls] = useState([]);
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [callForm, setCallForm] = useState(emptyCallForm);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [c, u, d, g] = await Promise.all([
        base44.entities.ActiveCall.list("-created_date"),
        base44.entities.CADUnit.list(),
        base44.entities.CADDepartment.list(),
        base44.entities.CADUnitGroup.list(),
      ]);
      setCalls(c); setUnits(u); setDepartments(d); setGroups(g);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const activeCalls = calls.filter(c => c.status !== "Closed");
  const deptName = (id) => departments.find(d => d.id === id)?.name || "Unassigned";
  const deptColor = (id) => departments.find(d => d.id === id)?.color || "#64748b";
  const unitName = (id) => units.find(u => u.id === id)?.name || "Unknown";
  const unitsByDept = (deptId) => units.filter(u => u.department_id === deptId);

  const handleCreateCall = async () => {
    try {
      await base44.entities.ActiveCall.create({ ...callForm, status: "Active" });
      const dept = departments.find(d => d.id === callForm.department_id);
      if (dept?.discord_webhook_url) {
        try {
          await base44.functions.invoke('sendDiscordNotification', {
            webhook_url: dept.discord_webhook_url,
            title: `🚨 New Call: ${callForm.call_type}`,
            description: callForm.description || `Location: ${callForm.location}`,
            color: callForm.priority === "1 - High" ? 15158332 : callForm.priority === "2 - Medium" ? 15844367 : 3447003,
            fields: [
              { name: "Priority", value: callForm.priority, inline: true },
              { name: "Location", value: callForm.location, inline: true },
              { name: "Department", value: dept.name, inline: true },
              ...(callForm.caller_name ? [{ name: "Caller", value: `${callForm.caller_name}${callForm.caller_phone ? ` · ${callForm.caller_phone}` : ""}`, inline: false }] : []),
            ]
          });
        } catch (e) { console.error("Discord notification failed:", e); }
      }
      toast({ title: "Call created" });
      setDialogOpen(false); setCallForm(emptyCallForm); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const assignUnit = async (callId, unitId) => {
    if (!unitId) return;
    try {
      const call = calls.find(c => c.id === callId);
      const newIds = [...(call.assigned_unit_ids || []), unitId];
      await base44.entities.ActiveCall.update(callId, { assigned_unit_ids: newIds });
      await base44.entities.CADUnit.update(unitId, { status: "On Call", assigned_call_id: callId });
      toast({ title: "Unit assigned" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const unassignUnit = async (callId, unitId) => {
    try {
      const call = calls.find(c => c.id === callId);
      const newIds = (call.assigned_unit_ids || []).filter(id => id !== unitId);
      await base44.entities.ActiveCall.update(callId, { assigned_unit_ids: newIds });
      await base44.entities.CADUnit.update(unitId, { status: "Available", assigned_call_id: "" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const closeCall = async (callId) => {
    try {
      const call = calls.find(c => c.id === callId);
      await base44.entities.ActiveCall.update(callId, { status: "Closed" });
      await Promise.all((call.assigned_unit_ids || []).map(uid =>
        base44.entities.CADUnit.update(uid, { status: "Available", assigned_call_id: "" })
      ));
      toast({ title: "Call closed" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const dispatchGroup = async (groupId, callId) => {
    if (!callId) return;
    try {
      const group = groups.find(g => g.id === groupId);
      const call = calls.find(c => c.id === callId);
      const newIds = [...new Set([...(call.assigned_unit_ids || []), ...(group.unit_ids || [])])];
      await base44.entities.ActiveCall.update(callId, { assigned_unit_ids: newIds });
      await Promise.all((group.unit_ids || []).map(uid =>
        base44.entities.CADUnit.update(uid, { status: "On Call", assigned_call_id: callId })
      ));
      toast({ title: "Group dispatched" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const openCreateCall = () => { setCallForm({ ...emptyCallForm, department_id: departments[0]?.id || "" }); setDialogOpen(true); };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  if (departments.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
        <h2 className="text-xl font-semibold text-white mb-2">No CAD Departments</h2>
        <p className="text-slate-400 mb-4">Create departments in the Admin Panel to start dispatching.</p>
        <Button onClick={() => window.location.href = "/cad/admin"} className="bg-cyan-600 hover:bg-cyan-700">Go to Admin Panel</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">CAD Dispatch</h1>
          <p className="text-sm text-slate-400">{activeCalls.length} active calls · {units.filter(u => u.status === "Available").length} units available</p>
        </div>
        <Button onClick={openCreateCall} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" /> New Call</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Calls */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Siren className="w-4 h-4" /> Active Calls</h2>
          {activeCalls.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-xl">
              <Siren className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-500">No active calls</p>
            </div>
          ) : (
            activeCalls.map((call) => (
              <div key={call.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${priorityColors[call.priority] || priorityColors["3 - Low"]}`}>{call.priority}</span>
                    <div>
                      <h3 className="font-semibold text-white">{call.call_type}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {call.location}</p>
                    </div>
                  </div>
                  <button onClick={() => closeCall(call.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> Close
                  </button>
                </div>
                {call.description && <p className="text-sm text-slate-400 mb-3">{call.description}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  {call.caller_name && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {call.caller_name}{call.caller_phone ? ` · ${call.caller_phone}` : ""}</span>}
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: deptColor(call.department_id) }} /> {deptName(call.department_id)}</span>
                </div>
                {/* Assigned Units */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {(call.assigned_unit_ids || []).map(uid => (
                    <span key={uid} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                      {unitName(uid)}
                      <button onClick={() => unassignUnit(call.id, uid)} className="text-slate-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {(call.assigned_unit_ids || []).length === 0 && <span className="text-xs text-slate-600">No units assigned</span>}
                </div>
                {/* Assign Unit Dropdown */}
                <Select onValueChange={(v) => assignUnit(call.id, v)}>
                  <SelectTrigger className="h-8 bg-slate-800 border-slate-700 text-slate-300 text-sm w-full max-w-xs"><SelectValue placeholder="+ Assign unit..." /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {units.filter(u => u.status === "Available" || u.status === "Off Duty").map(u => (
                      <SelectItem key={u.id} value={u.id} className="text-white">{u.name} · {u.unit_type} <span className="text-slate-500">({u.status})</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </div>

        {/* Right Panel: Units + Groups */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3"><Building2 className="w-4 h-4" /> Available Units</h2>
            <div className="space-y-3">
              {departments.map(dept => {
                const deptUnits = unitsByDept(dept.id);
                if (deptUnits.length === 0) return null;
                return (
                  <div key={dept.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: dept.color }} />
                      <span className="text-sm font-medium text-white">{dept.name}</span>
                      <span className="text-xs text-slate-500">{deptUnits.filter(u => u.status === "Available").length}/{deptUnits.length}</span>
                    </div>
                    <div className="space-y-1">
                      {deptUnits.map(u => (
                        <div key={u.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{u.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${unitStatusColors[u.status] || unitStatusColors["Off Duty"]}`}>{u.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preset Groups */}
          {groups.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3"><Layers className="w-4 h-4" /> Preset Groups</h2>
              <div className="space-y-2">
                {groups.map(g => (
                  <div key={g.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{g.name}</span>
                      <span className="text-xs text-slate-500">{g.unit_ids?.length || 0} units</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{deptName(g.department_id)}</p>
                    <Select onValueChange={(v) => dispatchGroup(g.id, v)}>
                      <SelectTrigger className="h-7 bg-slate-800 border-slate-700 text-slate-300 text-xs"><SelectValue placeholder="Dispatch to call..." /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {activeCalls.map(c => <SelectItem key={c.id} value={c.id} className="text-white">{c.call_type} · {c.location}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Call Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">New Call for Service</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Call Type</Label><Input value={callForm.call_type} onChange={e => setCallForm({ ...callForm, call_type: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Burglary in progress" /></div>
              <div><Label className="text-slate-300">Priority</Label>
                <Select value={callForm.priority} onValueChange={v => setCallForm({ ...callForm, priority: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{Object.keys(priorityColors).map(p => <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-slate-300">Location</Label><Input value={callForm.location} onChange={e => setCallForm({ ...callForm, location: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. 123 Main St" /></div>
            <div><Label className="text-slate-300">Description</Label><Textarea value={callForm.description} onChange={e => setCallForm({ ...callForm, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Caller Name</Label><Input value={callForm.caller_name} onChange={e => setCallForm({ ...callForm, caller_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div><Label className="text-slate-300">Caller Phone</Label><Input value={callForm.caller_phone} onChange={e => setCallForm({ ...callForm, caller_phone: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
            </div>
            <div><Label className="text-slate-300">Department</Label>
              <Select value={callForm.department_id} onValueChange={v => setCallForm({ ...callForm, department_id: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleCreateCall} disabled={!callForm.call_type || !callForm.location} className="bg-cyan-600 hover:bg-cyan-700">Create Call</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}