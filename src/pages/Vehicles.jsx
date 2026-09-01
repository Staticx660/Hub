import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Car, Plus, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Btn, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";
import ConfirmDialog from "@/components/mdt/ui/ConfirmDialog";

const vehicleStatuses = ["Available", "Assigned", "Out of Service", "Impounded"];

const statusTones = {
  "Available": "ok",
  "Assigned": "info",
  "Out of Service": "crit",
  "Impounded": "warn",
};

const inputCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selContentCls = "bg-mdt-surface-2 border-mdt-line-2 text-mdt-text rounded-sm";
const labelCls = "text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-dim";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
    await base44.entities.Vehicle.delete(id);
    toast({ title: "Deleted" });
    loadData();
  };

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || "—";

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }

  const filtered = vehicles.filter(v => filterDept === "all" || v.department_id === filterDept);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-mdt-text tracking-tight">Vehicles</h1>
          <p className="text-[11.5px] text-mdt-dim">Fleet management and assignments</p>
        </div>
        {isAdmin && <Btn variant="primary" icon={Plus} onClick={() => { setEditing(null); setForm({ name: "", department_id: "", model: "", plate: "", status: "Available", assigned_to_id: "", category: "", notes: "" }); setShowForm(true); }}>Add Vehicle</Btn>}
      </div>

      <Select value={filterDept} onValueChange={setFilterDept}>
        <SelectTrigger className={`w-48 ${selCls} mt-0`}><SelectValue placeholder="All Departments" /></SelectTrigger>
        <SelectContent className={selContentCls}>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <div className="bg-mdt-surface border border-mdt-line py-10">
          <EmptyState icon={Car} title="No vehicles found" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {filtered.map((v) => (
            <div key={v.id} className="bg-mdt-surface border border-mdt-line p-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[12.5px] font-semibold text-mdt-text truncate">{v.name}</h3>
                  <p className="text-[10.5px] text-mdt-dim truncate">{v.model}{v.plate ? ` · ${v.plate}` : ""}</p>
                </div>
                <div className={`flex gap-0.5 flex-shrink-0 ${isAdmin ? "opacity-0 group-hover:opacity-100 transition-opacity" : "hidden"}`}>
                  <button onClick={() => { setEditing(v); setForm({ name: v.name, department_id: v.department_id, model: v.model || "", plate: v.plate || "", status: v.status || "Available", assigned_to_id: v.assigned_to_id || "", category: v.category || "", notes: v.notes || "" }); setShowForm(true); }} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-mdt-surface-3 hover:text-mdt-text"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteTarget(v)} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-red-500/10 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <StatusPill tone={statusTones[v.status] || "neutral"}>{v.status}</StatusPill>
                {v.assigned_to_name && <span className="text-[10.5px] text-mdt-muted">→ {v.assigned_to_name}</span>}
              </div>
              {v.category && <p className="text-[10.5px] text-mdt-dim mt-1.5">{v.category}</p>}
              <p className="text-[10.5px] text-mdt-dim mt-0.5">{getDeptName(v.department_id)}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text max-w-md rounded-none sm:rounded-none">
          <DialogHeader><DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.06em]">{editing ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className={labelCls}>Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="e.g. Patrol Unit 1" />
            </div>
            <div>
              <Label className={labelCls}>Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm({...form, department_id: v})}>
                <SelectTrigger className={selCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className={selContentCls}>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={labelCls}>Model</Label>
                <Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} className={inputCls} placeholder="e.g. Crown Vic" />
              </div>
              <div>
                <Label className={labelCls}>Plate</Label>
                <Input value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={labelCls}>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className={selCls}><SelectValue /></SelectTrigger>
                  <SelectContent className={selContentCls}>
                    {vehicleStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelCls}>Category</Label>
                <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputCls} placeholder="e.g. Patrol, SWAT" />
              </div>
            </div>
            <div>
              <Label className={labelCls}>Assigned To</Label>
              <Select value={form.assigned_to_id} onValueChange={v => setForm({...form, assigned_to_id: v})}>
                <SelectTrigger className={selCls}><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent className={selContentCls}>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelCls}>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={inputCls} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSave} disabled={!form.name}>{editing ? "Update" : "Add"}</Btn>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Vehicle"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => handleDelete(deleteTarget.id)}
      />
    </div>
  );
}