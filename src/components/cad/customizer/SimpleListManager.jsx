import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, FileText, Loader2 } from "lucide-react";
import { Btn, EmptyState } from "@/components/mdt/ui/primitives";

const inputCls = "h-7 px-2 w-full bg-mdt-bg border border-mdt-line-2 text-[12px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";
const cap = "text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim";

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

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  const primaryField = fields[0]?.name;
  const secondaryFields = fields.slice(1);

  return (
    <div className="mdt border border-mdt-line bg-mdt-surface text-mdt-text">
      <div className="flex items-center gap-2 h-9 px-2.5 border-b border-mdt-line bg-mdt-surface-2">
        <span className="text-[12.5px] font-semibold">{title}</span>
        {description && <span className="text-[11px] text-mdt-dim truncate">{description}</span>}
        <Btn variant="primary" icon={Plus} className="ml-auto" onClick={openCreate}>Add</Btn>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={FileText} title={`No ${title.toLowerCase()} yet`} />
      ) : (
        <div className="divide-y divide-mdt-line/60">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 px-2.5 py-1.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {item.color && <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: item.color }} />}
                  <span className="text-[12px] font-medium truncate">{item[primaryField] || "Untitled"}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[10.5px] text-mdt-dim">
                  {secondaryFields.map(f => item[f.name] ? <span key={f.name}>{f.label}: {item[f.name]}</span> : null)}
                </div>
              </div>
              <button onClick={() => openEdit(item)} className="p-1 text-mdt-dim hover:text-mdt-text"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1 text-mdt-dim hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="mdt p-0 gap-0 max-w-lg bg-mdt-surface border border-mdt-line text-mdt-text rounded-none">
          <div className="h-9 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
            <span className="text-[12.5px] font-semibold">{editing ? "Edit" : "Add"} — {title}</span>
          </div>
          <div className="p-2.5 space-y-2.5 max-h-[70vh] overflow-auto mdt-scroll">
            {fields.map((f) => (
              <div key={f.name}>
                <label className={`${cap} block mb-1`}>{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</label>
                {f.type === "color" ? (
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={form[f.name] || "#3b82f6"} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className="w-9 h-7 bg-mdt-bg border border-mdt-line-2 cursor-pointer" />
                    <input value={form[f.name] || ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className={inputCls} />
                  </div>
                ) : f.type === "textarea" ? (
                  <textarea value={form[f.name] || ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })} rows={3} className={`${inputCls} h-auto py-1.5 resize-y`} />
                ) : (
                  <input type={f.type === "number" ? "number" : "text"} value={form[f.name] || ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className={inputCls} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-1.5 h-10 px-2.5 border-t border-mdt-line bg-mdt-surface-2">
            <Btn onClick={() => setDialogOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSave}>{editing ? "Update" : "Create"}</Btn>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}