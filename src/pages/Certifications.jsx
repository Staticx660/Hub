import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Award, Plus, Edit, Trash2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function Certifications() {
  const [certs, setCerts] = useState([]);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showAssign, setShowAssign] = useState(null);
  const [assignMemberId, setAssignMemberId] = useState("");
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
    if (!confirm("Delete this certification?")) return;
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
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Certifications</h1>
          <p className="text-sm text-slate-400 mt-1">Manage certifications and assignments</p>
        </div>
        {isAdmin && <Button onClick={() => { setEditing(null); setForm({ name: "", department_id: "", description: "", color: "#3B82F6" }); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New Certification
        </Button>}
      </div>

      {certs.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 text-center">
          <Award className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No certifications yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {certs.map((cert) => {
            const certified = members.filter(m => m.certifications?.includes(cert.name));
            return (
              <div key={cert.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cert.color + "20" }}>
                      <Award className="w-4 h-4" style={{ color: cert.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{cert.name}</h3>
                      <p className="text-xs text-slate-500">{getDeptName(cert.department_id)}</p>
                    </div>
                  </div>
                  <div className={isAdmin ? "flex gap-1" : "hidden"}>
                    <button onClick={() => setShowAssign(cert)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><UserPlus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setEditing(cert); setForm({ name: cert.name, department_id: cert.department_id, description: cert.description || "", color: cert.color || "#3B82F6" }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(cert.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {cert.description && <p className="text-xs text-slate-400 mt-2">{cert.description}</p>}
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-1.5">{certified.length} certified member{certified.length !== 1 ? "s" : ""}</p>
                  <div className="flex flex-wrap gap-1">
                    {certified.map(m => (
                      <span key={m.id} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 flex items-center gap-1">
                        {m.name}
                        {isAdmin && <button onClick={() => removeCert(m.id, cert.name)} className="hover:text-red-400"><X className="w-2.5 h-2.5" /></button>}
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
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Certification" : "New Certification"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="e.g. FTO, SWAT, K9" />
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
            <div>
              <Label className="text-slate-300">Color</Label>
              <Input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="bg-slate-800 border-slate-700 h-10 mt-1 w-20" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name} className="bg-blue-600 hover:bg-blue-700">{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle>Assign: {showAssign?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Select value={assignMemberId} onValueChange={setAssignMemberId}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {members.filter(m => !showAssign?.department_id || m.department_id === showAssign.department_id).map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-white">{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowAssign(null)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleAssign} disabled={!assignMemberId} className="bg-blue-600 hover:bg-blue-700">Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}