import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Shirt, Plus, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Btn, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";
import ConfirmDialog from "@/components/mdt/ui/ConfirmDialog";

const uniformStatuses = ["Available", "Assigned", "Retired"];

const inputCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selContentCls = "bg-mdt-surface-2 border-mdt-line-2 text-mdt-text rounded-sm";
const labelCls = "text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-dim";

export default function Uniforms() {
  const [uniforms, setUniforms] = useState([]);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterDept, setFilterDept] = useState("all");
  const [form, setForm] = useState({ name: "", department_id: "", description: "", rank_requirement: "", status: "Available", assigned_to_id: "", vmenu_codes: [] });
  const [newCode, setNewCode] = useState({ label: "", code: "" });
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
      setForm({ name: "", department_id: "", description: "", rank_requirement: "", status: "Available", assigned_to_id: "", vmenu_codes: [] });
      setNewCode({ label: "", code: "" });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.Uniform.delete(id);
    toast({ title: "Deleted" });
    loadData();
  };

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || "—";

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }

  const filtered = uniforms.filter(u => filterDept === "all" || u.department_id === filterDept);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-mdt-text tracking-tight">Uniforms</h1>
          <p className="text-[11.5px] text-mdt-dim">Manage uniform assignments</p>
        </div>
        {isAdmin && <Btn variant="primary" icon={Plus} onClick={() => { setEditing(null); setForm({ name: "", department_id: "", description: "", rank_requirement: "", status: "Available", assigned_to_id: "", vmenu_codes: [] }); setNewCode({ label: "", code: "" }); setShowForm(true); }}>Add Uniform</Btn>}
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
          <EmptyState icon={Shirt} title="No uniforms found" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {filtered.map((u) => (
            <div key={u.id} className="bg-mdt-surface border border-mdt-line p-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[12.5px] font-semibold text-mdt-text truncate">{u.name}</h3>
                  <p className="text-[10.5px] text-mdt-dim truncate">{getDeptName(u.department_id)}</p>
                </div>
                <div className={`flex gap-0.5 flex-shrink-0 ${isAdmin ? "opacity-0 group-hover:opacity-100 transition-opacity" : "hidden"}`}>
                  <button onClick={() => { setEditing(u); setForm({ name: u.name, department_id: u.department_id, description: u.description || "", rank_requirement: u.rank_requirement || "", status: u.status || "Available", assigned_to_id: u.assigned_to_id || "", vmenu_codes: u.vmenu_codes || [] }); setNewCode({ label: "", code: "" }); setShowForm(true); }} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-mdt-surface-3 hover:text-mdt-text"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteTarget(u)} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-red-500/10 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {u.description && <p className="text-[11px] text-mdt-muted mt-2">{u.description}</p>}
              <div className="mt-2.5 flex items-center justify-between">
                <StatusPill tone={u.status === "Available" ? "ok" : u.status === "Assigned" ? "info" : "neutral"}>{u.status}</StatusPill>
                {u.assigned_to_name && <span className="text-[10.5px] text-mdt-muted">→ {u.assigned_to_name}</span>}
              </div>
              {u.rank_requirement && <p className="text-[10.5px] text-mdt-dim mt-1.5">Requires: {u.rank_requirement}</p>}
              {u.vmenu_codes && u.vmenu_codes.length > 0 && (
                <div className="text-[10.5px] text-mdt-dim mt-1.5 space-y-0.5 font-mono">
                  {u.vmenu_codes.map((c, i) => <div key={i}>{c.label}: {c.code}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text max-w-md max-h-[90vh] overflow-y-auto mdt-scroll rounded-none sm:rounded-none">
          <DialogHeader><DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.06em]">{editing ? "Edit Uniform" : "Add Uniform"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className={labelCls}>Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="e.g. Class A Dress" />
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
            <div>
              <Label className={labelCls}>Description</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={labelCls}>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className={selCls}><SelectValue /></SelectTrigger>
                  <SelectContent className={selContentCls}>
                    {uniformStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelCls}>Rank Required</Label>
                <Input value={form.rank_requirement} onChange={e => setForm({...form, rank_requirement: e.target.value})} className={inputCls} placeholder="e.g. Sergeant+" />
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
              <Label className={labelCls}>vMenu Codes</Label>
              <div className="space-y-1.5 mt-1.5">
                {form.vmenu_codes.length > 0 && form.vmenu_codes.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center bg-mdt-surface-2 border border-mdt-line px-2 py-1.5">
                    <span className="flex-1 text-[11.5px] text-mdt-muted font-mono">{c.label}: {c.code}</span>
                    <button type="button" onClick={() => setForm({...form, vmenu_codes: form.vmenu_codes.filter((_, idx) => idx !== i)})} className="text-[10.5px] text-red-300 hover:text-red-200">Remove</button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <Input value={newCode.label} onChange={e => setNewCode({...newCode, label: e.target.value})} className={`${inputCls} mt-0`} placeholder="Label (e.g. Hand)" />
                <Input value={newCode.code} onChange={e => setNewCode({...newCode, code: e.target.value})} className={`${inputCls} mt-0`} placeholder="Code" />
              </div>
              <Btn className="w-full mt-1.5 justify-center" onClick={() => { if (newCode.label && newCode.code) { setForm({...form, vmenu_codes: [...form.vmenu_codes, newCode]}); setNewCode({label: "", code: ""}); } }} disabled={!newCode.label || !newCode.code}>Add Code</Btn>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-mdt-line">
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSave} disabled={!form.name || !form.department_id}>{editing ? "Update" : "Add"}</Btn>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Uniform"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => handleDelete(deleteTarget.id)}
      />
    </div>
  );
}