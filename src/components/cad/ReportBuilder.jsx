import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Pencil, FileText, ChevronUp, ChevronDown, Copy, X } from "lucide-react";

import { REPORT_TEMPLATE_CATEGORIES } from "@/lib/reportTypes";

const FIELD_TYPES = [
  { value: "text", label: "Text", group: "Fields" },
  { value: "textarea", label: "Text Area", group: "Fields" },
  { value: "address", label: "Address", group: "Fields" },
  { value: "select", label: "Dropdown", group: "Fields" },
  { value: "checkboxes", label: "Checkboxes", group: "Fields" },
  { value: "date", label: "Date", group: "Fields" },
  { value: "time", label: "Time", group: "Fields" },
  { value: "image", label: "Image", group: "Fields" },
  { value: "number", label: "Number", group: "Fields" },
  { value: "status", label: "Status", group: "Fields" },
  { value: "label", label: "Label", group: "Fields" },
  { value: "id", label: "ID", group: "Identifiers" },
  { value: "random", label: "Random", group: "Identifiers" },
  { value: "UNIT_NUMBER", label: "Unit Number", group: "Identifiers" },
  { value: "UNIT_NAME", label: "Unit Name", group: "Identifiers" },
  { value: "UNIT_RANK", label: "Unit Rank", group: "Identifiers" },
  { value: "UNIT_AGENCY", label: "Unit Agency", group: "Identifiers" },
  { value: "UNIT_DEPARTMENT", label: "Unit Department", group: "Identifiers" },
  { value: "UNIT_SUBDIVISION", label: "Unit Subdivision", group: "Identifiers" },
  { value: "UNIT_AGENCY_LOCATION", label: "Unit Agency Location", group: "Identifiers" },
  { value: "UNIT_AGENCY_ZIP", label: "Unit Agency Zip", group: "Identifiers" },
  { value: "UNIT_LOCATION", label: "Unit Location", group: "Identifiers" },
];

const IDENTIFIER_TYPES = FIELD_TYPES.filter(f => f.group === "Identifiers").map(f => f.value);
const OPTIONS_TYPES = ["select", "checkboxes"];

export default function ReportBuilder() {
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Incident", description: "", is_global: true, department_id: "", fields: [] });
  const { toast } = useToast();

  const load = async () => {
    try {
      const [t, d] = await Promise.all([
        base44.entities.ReportTemplate.list(),
        base44.entities.CADDepartment.filter({ is_active: true }),
      ]);
      setTemplates(t);
      setDepartments(d.filter(dep => dep.category !== "Civilian"));
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visibleTemplates = templates.filter(t => {
    if (!t.department_id) return true;
    const dept = departments.find(d => d.id === t.department_id);
    return dept && dept.category !== "Civilian";
  });

  const deptName = (id) => departments.find(d => d.id === id)?.name || "Unknown";

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", category: "Incident", description: "", is_global: true, department_id: "", fields: [] });
    setDialogOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name || "", category: t.category || "Incident", description: t.description || "", is_global: !t.department_id, department_id: t.department_id || "", fields: t.fields || [] });
    setDialogOpen(true);
  };

  const addField = () => setForm({ ...form, fields: [...form.fields, { label: "", field_type: "text", required: false, options: [] }] });
  const updateField = (idx, key, val) => { const fields = [...form.fields]; fields[idx] = { ...fields[idx], [key]: val }; setForm({ ...form, fields }); };
  const removeField = (idx) => setForm({ ...form, fields: form.fields.filter((_, i) => i !== idx) });
  const moveField = (idx, dir) => { const fields = [...form.fields]; const ni = idx + dir; if (ni < 0 || ni >= fields.length) return; [fields[idx], fields[ni]] = [fields[ni], fields[idx]]; setForm({ ...form, fields }); };

  const addOption = (idx) => { const fields = [...form.fields]; fields[idx].options = [...(fields[idx].options || []), ""]; setForm({ ...form, fields }); };
  const updateOption = (fi, oi, val) => { const fields = [...form.fields]; fields[fi].options[oi] = val; setForm({ ...form, fields }); };
  const removeOption = (fi, oi) => { const fields = [...form.fields]; fields[fi].options = fields[fi].options.filter((_, i) => i !== oi); setForm({ ...form, fields }); };

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Name required", variant: "destructive" }); return; }
    const cleanFields = form.fields.filter(f => f.label?.trim()).map(f => ({
      label: f.label.trim(), field_type: f.field_type, required: f.required,
      ...(OPTIONS_TYPES.includes(f.field_type) ? { options: (f.options || []).filter(o => o?.trim()) } : {})
    }));
    const data = { name: form.name, category: form.category, description: form.description, fields: cleanFields, department_id: form.is_global ? "" : form.department_id };
    try {
      if (editing) { await base44.entities.ReportTemplate.update(editing.id, data); toast({ title: "Template updated" }); }
      else { await base44.entities.ReportTemplate.create(data); toast({ title: "Template created" }); }
      setDialogOpen(false); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (id) => { if (!confirm("Delete this report template?")) return; await base44.entities.ReportTemplate.delete(id); toast({ title: "Template deleted" }); load(); };

  const duplicateTemplate = async (t) => {
    try { await base44.entities.ReportTemplate.create({ name: `${t.name} (Copy)`, category: t.category, description: t.description, fields: t.fields || [], department_id: "" }); toast({ title: "Template duplicated" }); load(); }
    catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Report Templates</h2>
          <p className="text-sm text-slate-400">Create custom report forms for all departments (except civilian)</p>
        </div>
        <Button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" /> New Template</Button>
      </div>

      {visibleTemplates.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No report templates yet.</p>
          <p className="text-xs mt-1">Create a template to let officers fill out structured reports.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTemplates.map((t) => (
            <div key={t.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">{t.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">{t.category}</span>
                    {!t.department_id ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">All Depts</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">{deptName(t.department_id)}</span>}
                  </div>
                  {t.description && <p className="text-sm text-slate-400 mb-2">{t.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {(t.fields || []).map((f, i) => (
                      <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{f.label}<span className="text-slate-600 ml-1">[{f.field_type}]</span>{f.required && <span className="text-red-400 ml-0.5">*</span>}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => duplicateTemplate(t)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Template" : "New Report Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Template Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Traffic Stop Report" /></div>
              <div><Label className="text-slate-300">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{REPORT_TEMPLATE_CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-slate-300">Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="What is this report used for?" /></div>
            <div>
              <Label className="text-slate-300">Available To</Label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="radio" checked={form.is_global} onChange={() => setForm({ ...form, is_global: true })} className="rounded border-slate-600" /> All Departments</label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="radio" checked={!form.is_global} onChange={() => setForm({ ...form, is_global: false })} className="rounded border-slate-600" /> Specific Department</label>
              </div>
              {!form.is_global && (
                <Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-slate-300 font-semibold">Form Fields</Label>
                <Button onClick={addField} size="sm" variant="outline" className="border-slate-700 text-slate-300"><Plus className="w-3.5 h-3.5 mr-1" /> Add Field</Button>
              </div>
              {form.fields.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No fields yet. Add fields to build your report form.</p>
              ) : (
                <div className="space-y-3">
                  {form.fields.map((field, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                          <button onClick={() => moveField(idx, 1)} disabled={idx === form.fields.length - 1} className="text-slate-500 hover:text-white disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                        </div>
                        <Input value={field.label} onChange={e => updateField(idx, "label", e.target.value)} className="bg-slate-800 border-slate-700 text-white flex-1" placeholder="Field label (e.g. Suspect Name)" />
                        <Select value={field.field_type} onValueChange={v => updateField(idx, "field_type", v)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-44"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 max-h-72">
                            <SelectItem value="text" className="text-white font-semibold text-cyan-400" disabled>— Fields —</SelectItem>
                            {FIELD_TYPES.filter(f => f.group === "Fields").map(t => <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>)}
                            <SelectItem value="id" className="text-white font-semibold text-cyan-400" disabled>— Identifiers —</SelectItem>
                            {FIELD_TYPES.filter(f => f.group === "Identifiers").map(t => <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer whitespace-nowrap"><input type="checkbox" checked={field.required || false} onChange={e => updateField(idx, "required", e.target.checked)} className="rounded border-slate-600" /> Req</label>
                        <button onClick={() => removeField(idx)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      {OPTIONS_TYPES.includes(field.field_type) && (
                        <div className="ml-8 space-y-1.5">
                          {(field.options || []).map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <Input value={opt} onChange={e => updateOption(idx, oi, e.target.value)} className="bg-slate-800 border-slate-700 text-white h-8 text-sm" placeholder={`Option ${oi + 1}`} />
                              <button onClick={() => removeOption(idx, oi)} className="p-1 text-slate-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                          <button onClick={() => addOption(idx)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Option</button>
                        </div>
                      )}
                      {IDENTIFIER_TYPES.includes(field.field_type) && (
                        <p className="ml-8 text-xs text-cyan-400/70">Auto-populated from unit/agency data when the report is filled out.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name} className="bg-cyan-600 hover:bg-cyan-700">{editing ? "Update Template" : "Create Template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}