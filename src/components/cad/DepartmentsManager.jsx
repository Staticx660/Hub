import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const categories = ["Police", "Fire", "EMS", "Dispatch", "Civilian", "Private Security", "Other"];
const colorOptions = [
  { name: "Blue", value: "#3b82f6" }, { name: "Red", value: "#ef4444" },
  { name: "Green", value: "#22c55e" }, { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" }, { name: "Cyan", value: "#06b6d4" },
  { name: "Orange", value: "#f97316" },
];
const emptyForm = { name: "", category: "Police", description: "", color: "#3b82f6", discord_webhook_url: "", discord_server_id: "", discord_role_id: "" };

export default function DepartmentsManager() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const load = async () => {
    try {
      setDepartments(await base44.entities.CADDepartment.list());
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editing) { await base44.entities.CADDepartment.update(editing.id, form); toast({ title: "Department updated" }); }
      else { await base44.entities.CADDepartment.create(form); toast({ title: "Department created" }); }
      setDialogOpen(false); setEditing(null); setForm(emptyForm); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this department?")) return;
    try { await base44.entities.CADDepartment.delete(id); toast({ title: "Department deleted" }); load(); }
    catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const openEdit = (d) => { setEditing(d); setForm({ name: d.name, category: d.category, description: d.description || "", color: d.color || "#3b82f6", discord_webhook_url: d.discord_webhook_url || "", discord_server_id: d.discord_server_id || "", discord_role_id: d.discord_role_id || "" }); setDialogOpen(true); };
  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Departments</h2>
        <Button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" /> Add Department</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: d.color || "#3b82f6" }} />
                <h3 className="font-semibold text-white">{d.name}</h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 mb-2">{d.category}</span>
            {d.description && <p className="text-sm text-slate-400">{d.description}</p>}
          </div>
        ))}
      </div>
      {departments.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-500"><Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No departments yet. Create one to get started.</p></div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Department" : "New Department"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-slate-300">Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Los Santos PD" /></div>
            <div><Label className="text-slate-300">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{categories.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map(c => <button key={c.value} onClick={() => setForm({ ...form, color: c.value })} className={`w-8 h-8 rounded-lg border-2 ${form.color === c.value ? "border-white" : "border-transparent"}`} style={{ background: c.value }} title={c.name} />)}
              </div>
            </div>
            <div><Label className="text-slate-300">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={2} /></div>
            <div className="pt-3 border-t border-slate-700/50">
              <p className="text-sm font-semibold text-cyan-400 mb-3">Discord Integration</p>
              <div className="space-y-3">
                <div><Label className="text-slate-300">Webhook URL</Label><Input value={form.discord_webhook_url} onChange={e => setForm({ ...form, discord_webhook_url: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="https://discord.com/api/webhooks/..." /></div>
                <div><Label className="text-slate-300">Server ID</Label><Input value={form.discord_server_id} onChange={e => setForm({ ...form, discord_server_id: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="Guild ID" /></div>
                <div><Label className="text-slate-300">Role ID</Label><Input value={form.discord_role_id} onChange={e => setForm({ ...form, discord_role_id: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="Role ID for pings" /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name} className="bg-cyan-600 hover:bg-cyan-700">{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}