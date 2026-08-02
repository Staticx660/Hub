import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { MField, MInput, MTextarea, MSelect } from "@/components/mdt/ui/formFields";
import { Btn, Panel, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";
import MDialog from "@/components/mdt/ui/MDialog";

const categories = ["Police", "Fire", "EMS", "Dispatch", "Civilian", "Private Security", "Other"];
const colorOptions = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#06b6d4", "#f97316"];
const emptyForm = { name: "", category: "Police", description: "", color: "#3b82f6", discord_webhook_url: "", discord_role_id: "", discord_supervisor_role_id: "" };

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

  const openEdit = (d) => { setEditing(d); setForm({ ...emptyForm, ...d }); setDialogOpen(true); };
  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <p className="text-[11.5px] text-mdt-dim flex-1">CAD departments, their Discord role gating and webhooks.</p>
        <Btn variant="primary" icon={Plus} onClick={openCreate}>Add Department</Btn>
      </div>

      <Panel title={`Departments — ${departments.length}`} className="max-h-[50vh]">
        {departments.length === 0 ? (
          <EmptyState icon={Building2} title="No departments yet" hint="Create one to get started" />
        ) : departments.map(d => (
          <div key={d.id} className="flex items-center gap-2 px-2.5 h-9 border-b border-mdt-line last:border-0 hover:bg-mdt-surface-3">
            <span className="w-1.5 h-5 flex-shrink-0" style={{ background: d.color || "#3b82f6" }} />
            <span className="text-[12.5px] text-mdt-text truncate w-48">{d.name}</span>
            <StatusPill tone="neutral">{d.category}</StatusPill>
            {d.discord_role_id ? <StatusPill tone="info">Discord Locked</StatusPill> : <StatusPill tone="neutral">Open Access</StatusPill>}
            {d.discord_supervisor_role_id && <StatusPill tone="ok">Supervisor Role</StatusPill>}
            <span className="text-[11px] text-mdt-dim truncate flex-1 min-w-0">{d.description || ""}</span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={() => openEdit(d)} className="p-1 text-mdt-dim hover:text-mdt-text"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(d.id)} className="p-1 text-mdt-dim hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </Panel>

      <MDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Department" : "New Department"}
        onSubmit={handleSave}
        submitLabel={editing ? "Update" : "Create"}
        submitDisabled={!form.name}
      >
        <div className="space-y-2.5">
          <MField label="Name">
            <MInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Los Santos PD" />
          </MField>
          <MField label="Category">
            <MSelect options={categories} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          </MField>
          <MField label="Color">
            <div className="flex gap-1.5">
              {colorOptions.map(c => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-7 h-7 border ${form.color === c ? "border-mdt-text" : "border-mdt-line-2"}`} style={{ background: c }} />
              ))}
            </div>
          </MField>
          <MField label="Description">
            <MTextarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          </MField>
          <div className="border-t border-mdt-line pt-2.5 space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-accent">Discord Integration</p>
            <MField label="Webhook URL">
              <MInput value={form.discord_webhook_url} onChange={e => setForm({ ...form, discord_webhook_url: e.target.value })} placeholder="https://discord.com/api/webhooks/…" />
            </MField>
            <p className="text-[11px] text-mdt-dim">Guild ID is configured globally in the Discord section. Only set the Role IDs below.</p>
            <MField label="Role ID">
              <MInput value={form.discord_role_id} onChange={e => setForm({ ...form, discord_role_id: e.target.value })} className="font-mono" placeholder="Role ID for member access" />
            </MField>
            <MField label="Supervisor Role ID">
              <MInput value={form.discord_supervisor_role_id} onChange={e => setForm({ ...form, discord_supervisor_role_id: e.target.value })} className="font-mono" placeholder="Role ID for supervisor access" />
            </MField>
          </div>
        </div>
      </MDialog>
    </div>
  );
}