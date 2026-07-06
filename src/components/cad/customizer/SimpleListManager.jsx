import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";

export default function SimpleListManager({ entityName, fields, title, description }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities[entityName].list();
      setItems(data);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    const empty = {};
    fields.forEach(f => empty[f.name] = "");
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    const formData = {};
    fields.forEach(f => formData[f.name] = item[f.name] ?? "");
    setForm(formData);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    for (const f of fields.filter(f => f.required)) {
      if (!form[f.name]?.toString().trim()) { toast({ title: `${f.label} is required`, variant: "destructive" }); return; }
    }
    const data = {};
    fields.forEach(f => {
      if (form[f.name] !== "" && form[f.name] !== undefined) {
        data[f.name] = f.type === "number" ? Number(form[f.name]) : form[f.name];
      }
    });
    try {
      if (editing) { await base44.entities[entityName].update(editing.id, data); toast({ title: "Updated" }); }
      else { await base44.entities[entityName].create(data); toast({ title: "Created" }); }
      setDialogOpen(false); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    await base44.entities[entityName].delete(id);
    toast({ title: "Deleted" });
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  const primaryField = fields[0]?.name;
  const secondaryFields = fields.slice(1);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
        <Button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" /> Add</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No {title.toLowerCase()} yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {item.color && <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />}
                  <h3 className="text-white font-medium">{item[primaryField] || "Untitled"}</h3>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {secondaryFields.map(f => item[f.name] ? <span key={f.name}>{f.label}: {item[f.name]}</span> : null)}
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit" : "Add"} {title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.name}>
                <Label className="text-slate-300">{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</Label>
                {f.type === "color" ? (
                  <div className="flex items-center gap-2">
                    <input type="color" value={form[f.name] || "#3b82f6"} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className="w-10 h-9 rounded border border-slate-700 bg-slate-800 cursor-pointer" />
                    <Input value={form[f.name] || ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className="bg-slate-800 border-slate-700 text-white flex-1" />
                  </div>
                ) : f.type === "textarea" ? (
                  <Textarea value={form[f.name] || ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={3} />
                ) : (
                  <Input type={f.type === "number" ? "number" : "text"} value={form[f.name] || ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700">{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}