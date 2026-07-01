import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Shirt, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const uniformStatuses = ["Available", "Assigned", "Retired"];

export default function Uniforms() {
  const [uniforms, setUniforms] = useState([]);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterDept, setFilterDept] = useState("all");
  const [form, setForm] = useState({ name: "", department_id: "", description: "", rank_requirement: "", status: "Available", assigned_to_id: "" });
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const loadData = async () => {
    try {
      const [u, m, d] = await Promise.all([
        base44.entities.Uniform.list(),
        base44.entities.RosterMember.list(),
        base44.entities.Department.list(),
      ]);
      setUniforms(u);
      setMembers(m);
      setDepartments(d);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    try {
      const member = members.find(m => m.id === form.assigned_to_id);
      const data = { ...form, assigned_to_name: member?.name || "" };
      if (editing) {
        await base44.entities.Uniform.update(editing.id, data);
        toast({ title: "Uniform updated" });
      } else {
        await base44.entities.Uniform.create(data);
        toast({ title: "Uniform added" });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", department_id: "", description: "", rank_requirement: "", status: "Available", assigned_to_id: "" });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this uniform?")) return;
    await base44.entities.Uniform.delete(id);
    toast({ title: "Deleted" });
    loadData();
  };

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || "—";

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const filtered = uniforms.filter(u => filterDept === "all" || u.department_id === filterDept);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Uniforms</h1>
          <p className="text-sm text-slate-400 mt-1">Manage uniform assignments</p>
        </div>
        {isAdmin && <Button onClick={() => { setEditing(null); setForm({ name: "", department_id: "", description: "", rank_requirement: "", status: "Available", assigned_to_id: "" }); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Uniform
        </Button>}
      </div>

      <Select value={filterDept} onValueChange={setFilterDept}>
        <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white"><SelectValue placeholder="All Departments" /></SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          <SelectItem value="all" className="text-white">All Departments</SelectItem>
          {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 text-center">
          <Shirt className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No uniforms found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <div key={u.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{u.name}</h3>
                  <p className="text-xs text-slate-500">{getDeptName(u.department_id)}</p>
                </div>
                <div className={`flex gap-1 ${isAdmin ? "opacity-0 group-hover:opacity-100 transition-opacity" : "hidden"}`}>
                  <button onClick={() => { setEditing(u); setForm({ name: u.name, department_id: u.department_id, description: u.description || "", rank_requirement: u.rank_requirement || "", status: u.status || "Available", assigned_to_id: u.assigned_to_id || "" }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {u.description && <p className="text-xs text-slate-400 mt-2">{u.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  u.status === "Available" ? "bg-emerald-500/10 text-emerald-400" :
                  u.status === "Assigned" ? "bg-blue-500/10 text-blue-400" :
                  "bg-slate-500/10 text-slate-400"
                }`}>{u.status}</span>
                {u.assigned_to_name && <span className="text-xs text-slate-400">→ {u.assigned_to_name}</span>}
              </div>
              {u.rank_requirement && <p className="text-xs text-slate-500 mt-2">Requires: {u.rank_requirement}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Uniform" : "Add Uniform"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="e.g. Class A Dress" />
            </div>
            <div>
              <Label className="text-slate-300">Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm({...form, department_id: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {uniformStatuses.map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Rank Required</Label>
                <Input value={form.rank_requirement} onChange={e => setForm({...form, rank_requirement: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="e.g. Sergeant+" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Assigned To</Label>
              <Select value={form.assigned_to_id} onValueChange={v => setForm({...form, assigned_to_id: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {members.filter(m => !form.department_id || m.department_id === form.department_id).map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-white">{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name} className="bg-blue-600 hover:bg-blue-700">{editing ? "Update" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}