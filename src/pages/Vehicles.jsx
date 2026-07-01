import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Car, Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const vehicleStatuses = ["Available", "Assigned", "Out of Service", "Impounded"];

const statusColors = {
  "Available": "bg-emerald-500/10 text-emerald-400",
  "Assigned": "bg-blue-500/10 text-blue-400",
  "Out of Service": "bg-red-500/10 text-red-400",
  "Impounded": "bg-amber-500/10 text-amber-400",
};

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterDept, setFilterDept] = useState("all");
  const [form, setForm] = useState({ name: "", department_id: "", model: "", plate: "", status: "Available", assigned_to_id: "", category: "", notes: "" });
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const loadData = async () => {
    try {
      const [v, m, d] = await Promise.all([
        base44.entities.Vehicle.list(),
        base44.entities.RosterMember.list(),
        base44.entities.Department.list(),
      ]);
      setVehicles(v);
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
        await base44.entities.Vehicle.update(editing.id, data);
        toast({ title: "Vehicle updated" });
      } else {
        await base44.entities.Vehicle.create(data);
        toast({ title: "Vehicle added" });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", department_id: "", model: "", plate: "", status: "Available", assigned_to_id: "", category: "", notes: "" });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this vehicle?")) return;
    await base44.entities.Vehicle.delete(id);
    toast({ title: "Deleted" });
    loadData();
  };

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || "—";

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const filtered = vehicles.filter(v => filterDept === "all" || v.department_id === filterDept);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicles</h1>
          <p className="text-sm text-slate-400 mt-1">Fleet management and assignments</p>
        </div>
        {isAdmin && <Button onClick={() => { setEditing(null); setForm({ name: "", department_id: "", model: "", plate: "", status: "Available", assigned_to_id: "", category: "", notes: "" }); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Vehicle
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
          <Car className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No vehicles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div key={v.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{v.name}</h3>
                  <p className="text-xs text-slate-500">{v.model}{v.plate ? ` · ${v.plate}` : ""}</p>
                </div>
                <div className={`flex gap-1 ${isAdmin ? "opacity-0 group-hover:opacity-100 transition-opacity" : "hidden"}`}>
                  <button onClick={() => { setEditing(v); setForm({ name: v.name, department_id: v.department_id, model: v.model || "", plate: v.plate || "", status: v.status || "Available", assigned_to_id: v.assigned_to_id || "", category: v.category || "", notes: v.notes || "" }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[v.status] || "bg-slate-500/10 text-slate-400"}`}>{v.status}</span>
                {v.assigned_to_name && <span className="text-xs text-slate-400">→ {v.assigned_to_name}</span>}
              </div>
              {v.category && <p className="text-xs text-slate-500 mt-2">{v.category}</p>}
              <p className="text-xs text-slate-500 mt-1">{getDeptName(v.department_id)}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="e.g. Patrol Unit 1" />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Model</Label>
                <Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="e.g. Crown Vic" />
              </div>
              <div>
                <Label className="text-slate-300">Plate</Label>
                <Input value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {vehicleStatuses.map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Category</Label>
                <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="e.g. Patrol, SWAT" />
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
            <div>
              <Label className="text-slate-300">Notes</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
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