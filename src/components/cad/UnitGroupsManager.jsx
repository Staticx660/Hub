import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Layers, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { MField, MInput, MTextarea } from "@/components/mdt/ui/formFields";
import { Btn, Panel, EmptyState } from "@/components/mdt/ui/primitives";
import MDialog from "@/components/mdt/ui/MDialog";

const emptyForm = { name: "", department_id: "", description: "", unit_ids: [], min_seats: 1, max_seats: 4 };
const selectCls = "h-7 px-1.5 w-full bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text focus:outline-none focus:border-mdt-accent";

export default function UnitGroupsManager() {
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [g, d, u] = await Promise.all([base44.entities.CADUnitGroup.list(), base44.entities.CADDepartment.list(), base44.entities.CADUnit.list()]);
      setGroups(g); setDepartments(d); setUnits(u);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deptName = (id) => departments.find(d => d.id === id)?.name || "Unassigned";
  const deptColor = (id) => departments.find(d => d.id === id)?.color || "#64748b";
  const unitName = (id) => units.find(u => u.id === id)?.name || "Unknown";
  const filteredUnits = form.department_id ? units.filter(u => u.department_id === form.department_id) : units;

  const toggleUnit = (unitId) => {
    setForm(f => ({
      ...f,
      unit_ids: f.unit_ids.includes(unitId) ? f.unit_ids.filter(id => id !== unitId) : [...f.unit_ids, unitId]
    }));
  };

  const handleSave = async () => {
    try {
      if (editing) { await base44.entities.CADUnitGroup.update(editing.id, form); toast({ title: "Group updated" }); }
      else { await base44.entities.CADUnitGroup.create(form); toast({ title: "Group created" }); }
      setDialogOpen(false); setEditing(null); setForm(emptyForm); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this group?")) return;
    try { await base44.entities.CADUnitGroup.delete(id); toast({ title: "Group deleted" }); load(); }
    catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const openEdit = (g) => { setEditing(g); setForm({ ...emptyForm, ...g, unit_ids: g.unit_ids || [] }); setDialogOpen(true); };
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, department_id: departments[0]?.id || "" }); setDialogOpen(true); };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <p className="text-[11.5px] text-mdt-dim flex-1">Preset unit groups and apparatus crews per department.</p>
        <Btn variant="primary" icon={Plus} disabled={departments.length === 0} onClick={openCreate}>Add Group</Btn>
      </div>

      <Panel title={`Preset Unit Groups — ${groups.length}`} className="max-h-[50vh]">
        {departments.length === 0 ? (
          <EmptyState icon={Layers} title="No departments yet" hint="Create a department before adding groups" />
        ) : groups.length === 0 ? (
          <EmptyState icon={Layers} title="No preset groups yet" />
        ) : groups.map(g => (
          <div key={g.id} className="px-2.5 py-2 border-b border-mdt-line last:border-0 hover:bg-mdt-surface-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 flex-shrink-0" style={{ background: deptColor(g.department_id) }} />
              <span className="text-[12.5px] text-mdt-text truncate">{g.name}</span>
              <span className="text-[11px] text-mdt-dim truncate">{deptName(g.department_id)} · {g.unit_ids?.length || 0} units · Seats {g.min_seats ?? 1}–{g.max_seats ?? 4}</span>
              <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
                <button onClick={() => openEdit(g)} className="p-1 text-mdt-dim hover:text-mdt-text"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(g.id)} className="p-1 text-mdt-dim hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            {g.description && <p className="text-[11px] text-mdt-muted mt-0.5">{g.description}</p>}
            {(g.unit_ids || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {(g.unit_ids || []).map(uid => (
                  <span key={uid} className="px-1.5 h-[18px] inline-flex items-center border border-mdt-line-2 bg-mdt-surface-3 text-[10.5px] text-mdt-muted">{unitName(uid)}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </Panel>

      <MDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Group" : "New Preset Group"}
        onSubmit={handleSave}
        submitLabel={editing ? "Update" : "Create"}
        submitDisabled={!form.name || !form.department_id}
      >
        <div className="space-y-2.5">
          <MField label="Group Name">
            <MInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fire Response Team" />
          </MField>
          <MField label="Department">
            <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value, unit_ids: [] })} className={selectCls}>
              <option value="">Select…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </MField>
          <MField label="Description">
            <MTextarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          </MField>
          <div className="grid grid-cols-2 gap-2.5">
            <MField label="Min Seats">
              <MInput type="number" min={0} value={form.min_seats} onChange={e => setForm({ ...form, min_seats: parseInt(e.target.value) || 0 })} />
            </MField>
            <MField label="Max Seats">
              <MInput type="number" min={1} value={form.max_seats} onChange={e => setForm({ ...form, max_seats: parseInt(e.target.value) || 1 })} />
            </MField>
          </div>
          <MField label="Select Units">
            <div className="max-h-44 overflow-auto mdt-scroll border border-mdt-line-2 bg-mdt-bg/40 p-2 space-y-1.5">
              {filteredUnits.length === 0 ? (
                <p className="text-[11.5px] text-mdt-dim text-center py-2">No units in this department</p>
              ) : filteredUnits.map(u => (
                <div key={u.id} className="flex items-center gap-2">
                  <Checkbox checked={form.unit_ids.includes(u.id)} onCheckedChange={() => toggleUnit(u.id)} id={`unit-${u.id}`} />
                  <label htmlFor={`unit-${u.id}`} className="text-[12px] text-mdt-text cursor-pointer flex-1">
                    {u.name} <span className="text-mdt-dim">({u.unit_type})</span>
                  </label>
                </div>
              ))}
            </div>
          </MField>
        </div>
      </MDialog>
    </div>
  );
}