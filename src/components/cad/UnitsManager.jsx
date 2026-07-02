import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Siren } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const unitTypes = ["Patrol Car", "Fire Engine", "Ladder Truck", "Ambulance", "Rescue", "SWAT", "K-9", "Motorcycle", "Helicopter", "Boat", "Command Vehicle", "Other"];
const statusColors = { "Available": "bg-green-500/15 text-green-400", "On Call": "bg-red-500/15 text-red-400", "Transporting": "bg-yellow-500/15 text-yellow-400", "Out of Service": "bg-gray-500/15 text-gray-400", "Off Duty": "bg-slate-700 text-slate-400" };
const emptyForm = { name: "", callsign: "", department_id: "", unit_type: "Patrol Car", status: "Available", is_preset: false, personnel_names: [], notes: "" };

export default function UnitsManager() {
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterDept, setFilterDept] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    try {
      const [u, d] = await Promise.all([base44.entities.CADUnit.list(), base44.entities.CADDepartment.list()]);
      setUnits(u); setDepartments(d);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deptName = (id) => departments.find(d => d.id === id)?.name || "Unassigned";
  const deptColor = (id) => departments.find(d => d.id === id)?.color || "#64748b";
  const filtered = filterDept === "all" ? units : units.filter(u => u.department_id === filterDept);

  const handleSave = async () => {
    try {
      if (editing) { await base44.entities.CADUnit.update(editing.id, form); toast({ title: "Unit updated" }); }
      else { await base44.entities.CADUnit.create(form); toast({ title: "Unit created" }); }
      setDialogOpen(false); setEditing(null); setForm(emptyForm); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this unit?")) return;
    try { await base44.entities.CADUnit.delete(id); toast({ title: "Unit deleted" }); load(); }
    catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const openEdit = (u) => { setEditing(u); setForm({ ...emptyForm, ...u, personnel_names: u.personnel_names || [] }); setDialogOpen(true); };
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, department_id: departments[0]?.id || "" }); setDialogOpen(true); };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Units</h2>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white h-8"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} disabled={departments.length === 0} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" /> Add Unit</Button>
      </div>
      {departments.length === 0 ? (
        <div className="text-center py-12 text-slate-500"><p>Create a department first before adding units.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((u) => (
            <div key={u.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 rounded-full" style={{ background: deptColor(u.department_id) }} />
                  <div>
                    <h3 className="font-semibold text-white">{u.name}</h3>
                    <p className="text-xs text-slate-500">{u.callsign || "No callsign"} · {deptName(u.department_id)}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{u.unit_type}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[u.status] || statusColors["Off Duty"]}`}>{u.status}</span>
                {u.is_preset && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">Preset</span>}
              </div>
              {u.personnel_names?.length > 0 && <p className="text-xs text-slate-500 mt-2">Crew: {u.personnel_names.join(", ")}</p>}
            </div>
          ))}
        </div>
      )}
      {filtered.length === 0 && departments.length > 0 && !loading && (
        <div className="text-center py-12 text-slate-500"><Siren className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No units yet.</p></div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Unit" : "New Unit"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Patrol 1" /></div>
              <div><Label className="text-slate-300">Callsign</Label><Input value={form.callsign} onChange={e => setForm({ ...form, callsign: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. 1-ADAM-12" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Department</Label>
                <Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-slate-300">Unit Type</Label>
                <Select value={form.unit_type} onValueChange={v => setForm({ ...form, unit_type: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{unitTypes.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{Object.keys(statusColors).map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-slate-300">Preset Unit</Label>
                <Select value={form.is_preset ? "yes" : "no"} onValueChange={v => setForm({ ...form, is_preset: v === "yes" })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700"><SelectItem value="no" className="text-white">No</SelectItem><SelectItem value="yes" className="text-white">Yes</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-slate-300">Personnel (comma-separated)</Label><Input value={form.personnel_names.join(", ")} onChange={e => setForm({ ...form, personnel_names: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Ofc. Smith, Ofc. Jones" /></div>
            <div><Label className="text-slate-300">Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.department_id} className="bg-cyan-600 hover:bg-cyan-700">{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}