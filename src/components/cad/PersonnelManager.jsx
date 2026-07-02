import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const statusColors = { "Available": "bg-green-500/15 text-green-400", "On Duty": "bg-blue-500/15 text-blue-400", "Off Duty": "bg-slate-700 text-slate-400" };
const emptyForm = { name: "", department_id: "", rank: "", badge_number: "", callsign: "", status: "Off Duty" };

export default function PersonnelManager() {
  const [personnel, setPersonnel] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterDept, setFilterDept] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    try {
      const [p, d] = await Promise.all([base44.entities.CADPersonnel.list(), base44.entities.CADDepartment.list()]);
      setPersonnel(p); setDepartments(d);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deptName = (id) => departments.find(d => d.id === id)?.name || "Unassigned";
  const deptColor = (id) => departments.find(d => d.id === id)?.color || "#64748b";
  const filtered = filterDept === "all" ? personnel : personnel.filter(p => p.department_id === filterDept);

  const handleSave = async () => {
    try {
      if (editing) { await base44.entities.CADPersonnel.update(editing.id, form); toast({ title: "Personnel updated" }); }
      else { await base44.entities.CADPersonnel.create(form); toast({ title: "Personnel added" }); }
      setDialogOpen(false); setEditing(null); setForm(emptyForm); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this personnel record?")) return;
    try { await base44.entities.CADPersonnel.delete(id); toast({ title: "Personnel removed" }); load(); }
    catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const openEdit = (p) => { setEditing(p); setForm({ ...emptyForm, ...p }); setDialogOpen(true); };
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, department_id: departments[0]?.id || "" }); setDialogOpen(true); };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Personnel</h2>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white h-8"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} disabled={departments.length === 0} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" /> Add Personnel</Button>
      </div>
      {departments.length === 0 ? (
        <div className="text-center py-12 text-slate-500"><p>Create a department first before adding personnel.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b border-slate-800">
              <th className="pb-2 pr-4">Name</th><th className="pb-2 pr-4">Department</th><th className="pb-2 pr-4">Rank</th><th className="pb-2 pr-4">Badge</th><th className="pb-2 pr-4">Callsign</th><th className="pb-2 pr-4">Status</th><th className="pb-2"></th>
            </tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/50">
                  <td className="py-2.5 pr-4 text-white font-medium">{p.name}</td>
                  <td className="py-2.5 pr-4"><span className="inline-flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full" style={{ background: deptColor(p.department_id) }} />{deptName(p.department_id)}</span></td>
                  <td className="py-2.5 pr-4 text-slate-400">{p.rank || "—"}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{p.badge_number || "—"}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{p.callsign || "—"}</td>
                  <td className="py-2.5 pr-4"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[p.status] || statusColors["Off Duty"]}`}>{p.status}</span></td>
                  <td className="py-2.5"><div className="flex gap-1"><button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length === 0 && departments.length > 0 && !loading && (
        <div className="text-center py-12 text-slate-500"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No personnel yet.</p></div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Personnel" : "Add Personnel"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-slate-300">Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Ofc. John Smith" /></div>
            <div><Label className="text-slate-300">Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Rank</Label><Input value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Officer" /></div>
              <div><Label className="text-slate-300">Badge #</Label><Input value={form.badge_number} onChange={e => setForm({ ...form, badge_number: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Callsign</Label><Input value={form.callsign} onChange={e => setForm({ ...form, callsign: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div><Label className="text-slate-300">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{Object.keys(statusColors).map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.department_id} className="bg-cyan-600 hover:bg-cyan-700">{editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}