import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Upload, Search, Gavel, Loader2 } from "lucide-react";
import { MInput } from "@/components/mdt/ui/formFields";
import { Btn, Panel, EmptyState } from "@/components/mdt/ui/primitives";
import PenalCodeDialog from "@/components/cad/penal/PenalCodeDialog";
import TypeListManager from "@/components/cad/penal/TypeListManager";

const emptyForm = { code: "", title: "", category: "", charge_type: "", bond_type: "", description: "", fine_amount: 0, jail_time_months: 0, is_active: true };

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

export default function PenalCodesManager() {
  const [tab, setTab] = useState("penal");
  const [penalCodes, setPenalCodes] = useState([]);
  const [chargeTypes, setChargeTypes] = useState([]);
  const [bondTypes, setBondTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
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

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...emptyForm, ...item, is_active: item.is_active !== false }); setDialogOpen(true); };

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

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  const tabs = [
    { id: "penal", label: `Penal Codes (${penalCodes.length})` },
    { id: "charge", label: `Charge Types (${chargeTypes.length})` },
    { id: "bond", label: `Bond Types (${bondTypes.length})` },
  ];

  return (
    <div className="max-w-4xl space-y-2.5">
      <div className="flex items-center gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`h-7 px-2.5 border text-[11.5px] font-medium ${tab === t.id ? "bg-mdt-accent text-white border-mdt-accent" : "bg-mdt-surface-3 text-mdt-muted border-mdt-line-2 hover:text-mdt-text"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "penal" && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3 h-3 text-mdt-dim absolute left-1.5 top-1/2 -translate-y-1/2" />
              <MInput value={search} onChange={e => setSearch(e.target.value)} className="pl-6" placeholder="Search penal codes…" />
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <label className="cursor-pointer">
                <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
                <span className="inline-flex items-center gap-1.5 h-7 px-2 border border-mdt-line-2 bg-mdt-surface-3 text-[11.5px] text-mdt-text hover:bg-mdt-surface-4">
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Import CSV
                </span>
              </label>
              <Btn variant="primary" icon={Plus} onClick={openCreate}>Add Code</Btn>
            </div>
          </div>

          <Panel title={`Penal Codes — ${filtered.length}`} className="max-h-[62vh]">
            {filtered.length === 0 ? (
              <EmptyState icon={Gavel} title="No penal codes yet" hint="Add manually or import a CSV file" />
            ) : (
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-mdt-surface-2">
                  <tr className="text-left text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim">
                    <th className="px-2.5 h-7">Code</th>
                    <th className="px-2.5 h-7">Title</th>
                    <th className="px-2.5 h-7">Category</th>
                    <th className="px-2.5 h-7 text-right">Fine</th>
                    <th className="px-2.5 h-7 text-right">Jail (mo)</th>
                    <th className="px-2.5 h-7"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(pc => (
                    <tr key={pc.id} className="border-t border-mdt-line hover:bg-mdt-surface-3">
                      <td className="px-2.5 h-7 font-mono text-mdt-accent">{pc.code}</td>
                      <td className="px-2.5 h-7 text-mdt-text">{pc.title}</td>
                      <td className="px-2.5 h-7 text-mdt-muted">{pc.category || "—"}</td>
                      <td className="px-2.5 h-7 text-right font-mono text-mdt-muted">${pc.fine_amount || 0}</td>
                      <td className="px-2.5 h-7 text-right font-mono text-mdt-muted">{pc.jail_time_months || 0}</td>
                      <td className="px-2.5 h-7 text-right whitespace-nowrap">
                        <button onClick={() => openEdit(pc)} className="p-1 text-mdt-dim hover:text-mdt-text"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(pc.id)} className="p-1 text-mdt-dim hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      )}

      {tab === "charge" && (
        <TypeListManager entityName="ChargeType" items={chargeTypes} onLoad={load} title="Charge Types" hint="Misdemeanor, Felony, etc." defaultColor="#ef4444" />
      )}
      {tab === "bond" && (
        <TypeListManager entityName="BondType" items={bondTypes} onLoad={load} title="Bond Types" hint="Cash Bail, Surety, etc." withAmount />
      )}

      <PenalCodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        chargeTypes={chargeTypes}
        bondTypes={bondTypes}
      />
    </div>
  );
}