import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = { name: "", department_id: "", description: "", unit_ids: [], min_seats: 1, max_seats: 4 };

export default function UnitGroupsManager() {
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [g, d, u] = await Promise.all([base44.entities.CADUnitGroup.list(), base44.entities.CADDepartment.list(), base44.entities.CADUnit.list()]);
      setGroups(g); setDepartments(d); setUnits(u);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deptName = (id) => departments.find(d => d.id === id)?.name || "Unassigned";
  const deptColor = (id) => departments.find(d => d.id === id)?.color || "#64748b";
  const unitName = (id) => units.find(u => u.id === id)?.name || "Unknown";
  const filteredUnits = form.department_id ? units.filter(u => u.department_id === form.department_id) : units;

  const toggleUnit = (unitId) => {
    setForm(f => ({
      ...f,
      unit_ids: f.unit_ids.includes(unitId) ? f.unit_ids.filter(id => id !== unitId) : [...f.unit_ids, unitId]
    }));
  };

  const handleSave = async () => {
    try {
      if (editing) { await base44.entities.CADUnitGroup.update(editing.id, form); toast({ title: "Group updated" }); }
      else { await base44.entities.CADUnitGroup.create(form); toast({ title: "Group created" }); }
      setDialogOpen(false); setEditing(null); setForm(emptyForm); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this group?")) return;
    try { await base44.entities.CADUnitGroup.delete(id); toast({ title: "Group deleted" }); load(); }
    catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const openEdit = (g) => { setEditing(g); setForm({ ...emptyForm, ...g, unit_ids: g.unit_ids || [] }); setDialogOpen(true); };
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, department_id: departments[0]?.id || "" }); setDialogOpen(true); };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Preset Unit Groups</h2>
        <Button onClick={openCreate} disabled={departments.length === 0} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" /> Add Group</Button>
      </div>
      {departments.length === 0 ? (
        <div className="text-center py-12 text-slate-500"><p>Create a department first before adding groups.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div key={g.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 rounded-full" style={{ background: deptColor(g.department_id) }} />
                  <div>
                    <h3 className="font-semibold text-white">{g.name}</h3>
                    <p className="text-xs text-slate-500">{deptName(g.department_id)} · {g.unit_ids?.length || 0} units · Seats: {g.min_seats ?? 1}–{g.max_seats ?? 4}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {g.description && <p className="text-sm text-slate-400 mb-2">{g.description}</p>}
              <div className="flex flex-wrap gap-1.5">
                {(g.unit_ids || []).map(uid => <span key={uid} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{unitName(uid)}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
      {groups.length === 0 && departments.length > 0 && !loading && (
        <div className="text-center py-12 text-slate-500"><Layers className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No preset groups yet.</p></div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Group" : "New Preset Group"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-slate-300">Group Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Fire Response Team" /></div>
            <div><Label className="text-slate-300">Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v, unit_ids: [] })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Min Seats</Label><Input type="number" min={0} value={form.min_seats} onChange={e => setForm({ ...form, min_seats: parseInt(e.target.value) || 0 })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div><Label className="text-slate-300">Max Seats</Label><Input type="number" min={1} value={form.max_seats} onChange={e => setForm({ ...form, max_seats: parseInt(e.target.value) || 1 })} className="bg-slate-800 border-slate-700 text-white" /></div>
            </div>
            <div>
              <Label className="text-slate-300 mb-2 block">Select Units</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                {filteredUnits.length === 0 ? <p className="text-sm text-slate-500 text-center py-2">No units in this department</p> :
                  filteredUnits.map(u => (
                    <div key={u.id} className="flex items-center gap-2">
                      <Checkbox checked={form.unit_ids.includes(u.id)} onCheckedChange={() => toggleUnit(u.id)} id={`unit-${u.id}`} />
                      <label htmlFor={`unit-${u.id}`} className="text-sm text-slate-300 cursor-pointer flex-1">{u.name} <span className="text-slate-500">({u.unit_type})</span></label>
                    </div>
                  ))
                }
              </div>
            </div>
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