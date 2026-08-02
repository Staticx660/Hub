import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { MField, MInput } from "@/components/mdt/ui/formFields";
import { Btn, Panel, EmptyState } from "@/components/mdt/ui/primitives";
import MDialog from "@/components/mdt/ui/MDialog";

/* Shared manager for ChargeType / BondType records */
export default function TypeListManager({ entityName, items, onLoad, title, hint, defaultColor = "#3b82f6", withAmount = false }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const empty = { name: "", description: "", color: defaultColor, is_active: true, ...(withAmount ? { default_amount: 0 } : {}) };
  const [form, setForm] = useState(empty);
  const { toast } = useToast();

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...empty, name: item.name || "", description: item.description || "", color: item.color || defaultColor, is_active: item.is_active !== false, ...(withAmount ? { default_amount: item.default_amount || 0 } : {}) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    try {
      if (editing) { await base44.entities[entityName].update(editing.id, form); }
      else { await base44.entities[entityName].create(form); }
      toast({ title: "Saved" }); setDialogOpen(false); onLoad();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    await base44.entities[entityName].delete(id);
    toast({ title: "Deleted" }); onLoad();
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <p className="text-[11.5px] text-mdt-dim flex-1">{hint}</p>
        <Btn variant="primary" icon={Plus} onClick={openCreate}>Add</Btn>
      </div>

      <Panel title={title} className="max-h-[60vh]">
        {items.length === 0 ? (
          <EmptyState icon={Tags} title={`No ${title.toLowerCase()} yet`} />
        ) : items.map(item => (
          <div key={item.id} className="flex items-center justify-between px-2.5 h-8 border-b border-mdt-line last:border-0 hover:bg-mdt-surface-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: item.color || defaultColor }} />
              <span className="text-[12px] text-mdt-text truncate">{item.name}</span>
              {withAmount && item.default_amount ? <span className="text-[10.5px] font-mono text-mdt-dim">${item.default_amount}</span> : null}
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => openEdit(item)} className="p-1 text-mdt-dim hover:text-mdt-text"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1 text-mdt-dim hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </Panel>

      <MDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={`${editing ? "Edit" : "Add"} ${title}`}
        onSubmit={handleSave}
        submitLabel={editing ? "Update" : "Create"}
        submitDisabled={!form.name?.trim()}
        width="max-w-md"
      >
        <div className="space-y-2.5">
          <MField label="Name *">
            <MInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </MField>
          <MField label="Description">
            <MInput value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </MField>
          <MField label="Color">
            <div className="flex items-center gap-1.5">
              <input type="color" value={form.color || defaultColor} onChange={e => setForm({ ...form, color: e.target.value })} className="w-9 h-7 border border-mdt-line-2 bg-mdt-surface cursor-pointer" />
              <MInput value={form.color || ""} onChange={e => setForm({ ...form, color: e.target.value })} className="font-mono" />
            </div>
          </MField>
          {withAmount && (
            <MField label="Default Amount ($)">
              <MInput type="number" value={form.default_amount ?? 0} onChange={e => setForm({ ...form, default_amount: Number(e.target.value) })} />
            </MField>
          )}
        </div>
      </MDialog>
    </div>
  );
}