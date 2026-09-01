import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Award, Plus, Edit, Trash2, UserPlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Btn, EmptyState } from "@/components/mdt/ui/primitives";
import ConfirmDialog from "@/components/mdt/ui/ConfirmDialog";

const inputCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selContentCls = "bg-mdt-surface-2 border-mdt-line-2 text-mdt-text rounded-sm";
const labelCls = "text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-dim";

export default function Certifications() {
  const [certs, setCerts] = useState([]);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showAssign, setShowAssign] = useState(null);
  const [assignMemberId, setAssignMemberId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", department_id: "", description: "", color: "#3B82F6" });
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const loadData = async () => {
    try {
      const [c, m, d] = await Promise.all([
        base44.entities.Certification.list(),
        base44.entities.RosterMember.list(),
        base44.entities.Department.list(),
      ]);
      setCerts(c);
      setMembers(m);
      setDepartments(d);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await base44.entities.Certification.update(editing.id, form);
        toast({ title: "Certification updated" });
      } else {
        await base44.entities.Certification.create(form);
        toast({ title: "Certification created" });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", department_id: "", description: "", color: "#3B82F6" });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.Certification.delete(id);
    toast({ title: "Deleted" });
    loadData();
  };

  const handleAssign = async () => {
    if (!assignMemberId || !showAssign) return;
    const member = members.find(m => m.id === assignMemberId);
    const existingCerts = member?.certifications || [];
    if (!existingCerts.includes(showAssign.name)) {
      await base44.entities.RosterMember.update(assignMemberId, {
        certifications: [...existingCerts, showAssign.name],
      });
      toast({ title: "Certification assigned" });
      setShowAssign(null);
      setAssignMemberId("");
      loadData();
    } else {
      toast({ title: "Already has this certification" });
    }
  };

  const removeCert = async (memberId, certName) => {
    const member = members.find(m => m.id === memberId);
    await base44.entities.RosterMember.update(memberId, {
      certifications: (member?.certifications || []).filter(c => c !== certName),
    });
    toast({ title: "Certification removed" });
    loadData();
  };

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || "—";

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-mdt-text tracking-tight">Certifications</h1>
          <p className="text-[11.5px] text-mdt-dim">Manage certifications and assignments</p>
        </div>
        {isAdmin && <Btn variant="primary" icon={Plus} onClick={() => { setEditing(null); setForm({ name: "", department_id: "", description: "", color: "#3B82F6" }); setShowForm(true); }}>New Certification</Btn>}
      </div>

      {certs.length === 0 ? (
        <div className="bg-mdt-surface border border-mdt-line py-10">
          <EmptyState icon={Award} title="No certifications yet" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {certs.map((cert) => {
            const certified = members.filter(m => m.certifications?.includes(cert.name));
            return (
              <div key={cert.id} className="bg-mdt-surface border border-mdt-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 flex items-center justify-center border border-mdt-line-2 flex-shrink-0" style={{ backgroundColor: cert.color + "20" }}>
                      <Award className="w-4 h-4" style={{ color: cert.color }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[12.5px] font-semibold text-mdt-text truncate">{cert.name}</h3>
                      <p className="text-[10px] uppercase tracking-[0.08em] text-mdt-dim truncate">{getDeptName(cert.department_id)}</p>
                    </div>
                  </div>
                  <div className={isAdmin ? "flex gap-0.5 flex-shrink-0" : "hidden"}>
                    <button onClick={() => setShowAssign(cert)} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-mdt-surface-3 hover:text-mdt-text"><UserPlus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setEditing(cert); setForm({ name: cert.name, department_id: cert.department_id, description: cert.description || "", color: cert.color || "#3B82F6" }); setShowForm(true); }} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-mdt-surface-3 hover:text-mdt-text"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteTarget(cert)} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-red-500/10 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {cert.description && <p className="text-[11px] text-mdt-muted mt-2">{cert.description}</p>}
                <div className="mt-2.5">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-mdt-dim mb-1">{certified.length} certified member{certified.length !== 1 ? "s" : ""}</p>
                  <div className="flex flex-wrap gap-1">
                    {certified.map(m => (
                      <span key={m.id} className="text-[10.5px] px-1.5 h-[18px] rounded-sm bg-mdt-surface-3 border border-mdt-line-2 text-mdt-muted inline-flex items-center gap-1">
                        {m.name}
                        {isAdmin && <button onClick={() => removeCert(m.id, cert.name)} className="hover:text-red-300"><X className="w-2.5 h-2.5" /></button>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text max-w-md rounded-none sm:rounded-none">
          <DialogHeader><DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.06em]">{editing ? "Edit Certification" : "New Certification"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className={labelCls}>Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="e.g. FTO, SWAT, K9" />
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
            <div>
              <Label className={labelCls}>Color</Label>
              <Input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="h-9 mt-1 w-20 rounded-sm bg-mdt-surface-2 border-mdt-line-2" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSave} disabled={!form.name}>{editing ? "Update" : "Create"}</Btn>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text max-w-sm rounded-none sm:rounded-none">
          <DialogHeader><DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.06em]">Assign: {showAssign?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Select value={assignMemberId} onValueChange={setAssignMemberId}>
              <SelectTrigger className={`${selCls} mt-0`}><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent className={selContentCls}>
                {members.filter(m => !showAssign?.department_id || m.department_id === showAssign.department_id).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="ghost" onClick={() => setShowAssign(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleAssign} disabled={!assignMemberId}>Assign</Btn>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Certification"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => handleDelete(deleteTarget.id)}
      />
    </div>
  );
}