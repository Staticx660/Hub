import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, FileText, Upload, Search, Gavel } from "lucide-react";

export default function PenalCodesManager() {
  const [tab, setTab] = useState("penal");
  const [penalCodes, setPenalCodes] = useState([]);
  const [chargeTypes, setChargeTypes] = useState([]);
  const [bondTypes, setBondTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", title: "", category: "", charge_type: "", bond_type: "", description: "", fine_amount: 0, jail_time_months: 0, is_active: true });
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [pc, ct, bt] = await Promise.all([
        base44.entities.PenalCode.list().catch(() => []),
        base44.entities.ChargeType.list().catch(() => []),
        base44.entities.BondType.list().catch(() => []),
      ]);
      setPenalCodes(pc); setChargeTypes(ct); setBondTypes(bt);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ code: "", title: "", category: "", charge_type: "", bond_type: "", description: "", fine_amount: 0, jail_time_months: 0, is_active: true }); setDialogOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ code: item.code || "", title: item.title || "", category: item.category || "", charge_type: item.charge_type || "", bond_type: item.bond_type || "", description: item.description || "", fine_amount: item.fine_amount || 0, jail_time_months: item.jail_time_months || 0, is_active: item.is_active !== false }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.code?.trim() || !form.title?.trim()) { toast({ title: "Code and Title are required", variant: "destructive" }); return; }
    try {
      if (editing) { await base44.entities.PenalCode.update(editing.id, form); toast({ title: "Penal code updated" }); }
      else { await base44.entities.PenalCode.create(form); toast({ title: "Penal code created" }); }
      setDialogOpen(false); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (id) => { if (!confirm("Delete this penal code?")) return; await base44.entities.PenalCode.delete(id); toast({ title: "Deleted" }); load(); };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      if (lines.length < 2) { toast({ title: "CSV must have a header row and at least one data row", variant: "destructive" }); setImporting(false); e.target.value = ""; return; }
      const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => { row[h] = (cols[idx] || "").trim(); });
        const code = row["code #"] || row["code"] || row["code#"] || "";
        const title = row["title"] || row["name"] || "";
        if (!code && !title) continue;
        records.push({
          code,
          title,
          category: row["category"] || "",
          charge_type: row["charge type"] || row["charge_type"] || "",
          bond_type: row["bond type"] || row["bond_type"] || "",
          description: row["description"] || "",
          fine_amount: parseFloat(row["fine amount ($)"] || row["fine amount"] || row["fine"] || "0") || 0,
          jail_time_months: parseFloat(row["jail time (months)"] || row["jail time"] || row["jail"] || "0") || 0,
          is_active: true,
        });
      }
      if (records.length === 0) { toast({ title: "No valid rows found in CSV", variant: "destructive" }); setImporting(false); e.target.value = ""; return; }
      for (let i = 0; i < records.length; i += 500) {
        await base44.entities.PenalCode.bulkCreate(records.slice(i, i + 500));
      }
      toast({ title: "Import complete", description: `${records.length} penal codes imported` });
      load();
    } catch (err) { toast({ title: "Import error", description: err.message, variant: "destructive" }); }
    setImporting(false);
    e.target.value = "";
  };

  const filtered = penalCodes.filter(pc => {
    const q = search.toLowerCase();
    return !q || pc.code?.toLowerCase().includes(q) || pc.title?.toLowerCase().includes(q) || pc.category?.toLowerCase().includes(q);
  });

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-1">Penal Codes & Charges</h2>
      <p className="text-sm text-slate-400 mb-4">Manage penal codes, charge types, and bond types</p>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("penal")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "penal" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>Penal Codes ({penalCodes.length})</button>
        <button onClick={() => setTab("charge")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "charge" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>Charge Types ({chargeTypes.length})</button>
        <button onClick={() => setTab("bond")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "bond" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>Bond Types ({bondTypes.length})</button>
      </div>

      {tab === "penal" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-800 border-slate-700 text-white pl-9" placeholder="Search penal codes..." />
            </div>
            <div className="flex gap-2">
              <label>
                <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm cursor-pointer disabled:opacity-50">
                  <Upload className="w-4 h-4" /> {importing ? "Importing..." : "Import CSV"}
                </span>
              </label>
              <Button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" /> Add Code</Button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No penal codes yet.</p>
              <p className="text-xs mt-1">Add manually or import a CSV file.</p>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/80 sticky top-0">
                    <tr className="text-left text-slate-400">
                      <th className="px-4 py-2 font-medium">Code</th>
                      <th className="px-4 py-2 font-medium">Title</th>
                      <th className="px-4 py-2 font-medium">Category</th>
                      <th className="px-4 py-2 font-medium text-right">Fine</th>
                      <th className="px-4 py-2 font-medium text-right">Jail (mo)</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(pc => (
                      <tr key={pc.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                        <td className="px-4 py-2 text-cyan-400 font-mono">{pc.code}</td>
                        <td className="px-4 py-2 text-white">{pc.title}</td>
                        <td className="px-4 py-2 text-slate-400">{pc.category || "—"}</td>
                        <td className="px-4 py-2 text-slate-400 text-right">${pc.fine_amount || 0}</td>
                        <td className="px-4 py-2 text-slate-400 text-right">{pc.jail_time_months || 0}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => openEdit(pc)} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white mr-1"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(pc.id)} className="p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "charge" && <ChargeTypeManager chargeTypes={chargeTypes} onLoad={load} />}
      {tab === "bond" && <BondTypeManager bondTypes={bondTypes} onLoad={load} />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Penal Code" : "New Penal Code"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Code *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="bg-slate-800 border-slate-700 text-white font-mono" placeholder="e.g. A0.0.0.1" /></div>
              <div><Label className="text-slate-300">Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Felony" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Charge Type</Label>
                <Select value={form.charge_type || "_none"} onValueChange={v => setForm({ ...form, charge_type: v === "_none" ? "" : v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="_none" className="text-white">— None —</SelectItem>
                    {chargeTypes.map(ct => <SelectItem key={ct.id} value={ct.name} className="text-white">{ct.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-slate-300">Bond Type</Label>
                <Select value={form.bond_type || "_none"} onValueChange={v => setForm({ ...form, bond_type: v === "_none" ? "" : v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="_none" className="text-white">— None —</SelectItem>
                    {bondTypes.map(bt => <SelectItem key={bt.id} value={bt.name} className="text-white">{bt.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-slate-300">Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Murder" /></div>
            <div><Label className="text-slate-300">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Fine Amount ($)</Label><Input type="number" value={form.fine_amount} onChange={e => setForm({ ...form, fine_amount: Number(e.target.value) })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div><Label className="text-slate-300">Jail Time (months)</Label><Input type="number" value={form.jail_time_months} onChange={e => setForm({ ...form, jail_time_months: Number(e.target.value) })} className="bg-slate-800 border-slate-700 text-white" /></div>
            </div>
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

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current); current = ""; }
    else { current += char; }
  }
  result.push(current);
  return result;
}

function ChargeTypeManager({ chargeTypes, onLoad }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#ef4444", is_active: true });
  const { toast } = useToast();

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "", color: "#ef4444", is_active: true }); setDialogOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name || "", description: item.description || "", color: item.color || "#ef4444", is_active: item.is_active !== false }); setDialogOpen(true); };
  const handleSave = async () => {
    if (!form.name?.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    try { if (editing) { await base44.entities.ChargeType.update(editing.id, form); } else { await base44.entities.ChargeType.create(form); } toast({ title: "Saved" }); setDialogOpen(false); onLoad(); }
    catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await base44.entities.ChargeType.delete(id); toast({ title: "Deleted" }); onLoad(); };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">Misdemeanor, Felony, etc.</p>
        <Button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" /> Add</Button>
      </div>
      <div className="space-y-2">
        {chargeTypes.map(ct => (
          <div key={ct.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: ct.color }} /><span className="text-white font-medium">{ct.name}</span></div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(ct)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(ct.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {chargeTypes.length === 0 && <p className="text-center text-slate-500 py-8">No charge types yet.</p>}
      </div>
      <SimpleDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} form={form} setForm={setForm} onSave={handleSave} title="Charge Type" fields={[
        { name: "name", label: "Name", required: true },
        { name: "description", label: "Description" },
        { name: "color", label: "Color", type: "color" },
      ]} />
    </div>
  );
}

function BondTypeManager({ bondTypes, onLoad }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#3b82f6", default_amount: 0, is_active: true });
  const { toast } = useToast();

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "", color: "#3b82f6", default_amount: 0, is_active: true }); setDialogOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name || "", description: item.description || "", color: item.color || "#3b82f6", default_amount: item.default_amount || 0, is_active: item.is_active !== false }); setDialogOpen(true); };
  const handleSave = async () => {
    if (!form.name?.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    try { if (editing) { await base44.entities.BondType.update(editing.id, form); } else { await base44.entities.BondType.create(form); } toast({ title: "Saved" }); setDialogOpen(false); onLoad(); }
    catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await base44.entities.BondType.delete(id); toast({ title: "Deleted" }); onLoad(); };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">Cash Bail, Surety, etc.</p>
        <Button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" /> Add</Button>
      </div>
      <div className="space-y-2">
        {bondTypes.map(bt => (
          <div key={bt.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: bt.color || "#3b82f6" }} /><span className="text-white font-medium">{bt.name}</span>{bt.default_amount ? <span className="text-xs text-slate-500 ml-2">${bt.default_amount}</span> : null}</div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(bt)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(bt.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {bondTypes.length === 0 && <p className="text-center text-slate-500 py-8">No bond types yet.</p>}
      </div>
      <SimpleDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} form={form} setForm={setForm} onSave={handleSave} title="Bond Type" fields={[
        { name: "name", label: "Name", required: true },
        { name: "description", label: "Description" },
        { name: "color", label: "Color", type: "color" },
        { name: "default_amount", label: "Default Amount ($)", type: "number" },
      ]} />
    </div>
  );
}

function SimpleDialog({ open, onOpenChange, editing, form, setForm, onSave, title, fields }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader><DialogTitle className="text-white">{editing ? "Edit" : "Add"} {title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.name}>
              <Label className="text-slate-300">{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</Label>
              {f.type === "color" ? (
                <div className="flex items-center gap-2">
                  <input type="color" value={form[f.name] || "#3b82f6"} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className="w-10 h-9 rounded border border-slate-700 bg-slate-800 cursor-pointer" />
                  <Input value={form[f.name] || ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className="bg-slate-800 border-slate-700 text-white flex-1" />
                </div>
              ) : (
                <Input type={f.type === "number" ? "number" : "text"} value={form[f.name] ?? ""} onChange={e => setForm({ ...form, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300">Cancel</Button>
          <Button onClick={onSave} className="bg-cyan-600 hover:bg-cyan-700">{editing ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}