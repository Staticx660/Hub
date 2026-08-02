import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download, Trash2, Search, MapPin, Loader2 } from "lucide-react";
import { MInput } from "@/components/mdt/ui/formFields";
import { Panel, Btn, EmptyState } from "@/components/mdt/ui/primitives";

export default function AddressesManager() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.Address.list('-created_date', 10000);
      setAddresses(data);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      const records = lines.map(line => {
        const name = line.replace(/^"|"$/g, '').split(',')[0].trim();
        return { street_name: name };
      }).filter(r => r.street_name);

      for (let i = 0; i < records.length; i += 500) {
        await base44.entities.Address.bulkCreate(records.slice(i, i + 500));
      }
      toast({ title: "Import complete", description: `${records.length} addresses imported` });
      load();
    } catch (err) { toast({ title: "Import error", description: err.message, variant: "destructive" }); }
    setImporting(false);
    e.target.value = "";
  };

  const handleExport = () => {
    const csv = addresses.map(a => a.street_name).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'addresses.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export complete", description: `${addresses.length} addresses exported` });
  };

  const handleDelete = async (id) => {
    await base44.entities.Address.delete(id);
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const handleClearAll = async () => {
    if (!confirm(`Delete all ${addresses.length} addresses?`)) return;
    await base44.entities.Address.deleteMany({});
    toast({ title: "All addresses cleared" });
    load();
  };

  const filtered = addresses.filter(a => a.street_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  return (
    <div className="max-w-2xl space-y-2.5">
      <div className="flex items-center gap-1.5">
        <p className="text-[11.5px] text-mdt-dim flex-1">Import and manage street names for your city.</p>
        <label className="cursor-pointer">
          <input type="file" accept=".csv,.json" className="hidden" onChange={handleImport} disabled={importing} />
          <span className="inline-flex items-center gap-1.5 h-7 px-2 border border-mdt-accent bg-mdt-accent text-[11.5px] font-medium text-white hover:brightness-110">
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Import
          </span>
        </label>
        <Btn icon={Download} onClick={handleExport}>Export</Btn>
        {addresses.length > 0 && <Btn icon={Trash2} onClick={handleClearAll}>Clear All</Btn>}
      </div>

      {addresses.length === 0 ? (
        <Panel title="Addresses" className="h-64"><EmptyState icon={MapPin} title="No addresses imported yet" hint="Import a CSV of street names" /></Panel>
      ) : (
        <Panel title={`Addresses — ${filtered.length} of ${addresses.length}`} className="max-h-[65vh]"
          actions={
            <div className="relative">
              <Search className="w-3 h-3 text-mdt-dim absolute left-1.5 top-1/2 -translate-y-1/2" />
              <MInput value={search} onChange={e => setSearch(e.target.value)} className="w-48 pl-6" placeholder="Search…" />
            </div>
          }
        >
          {filtered.map(a => (
            <div key={a.id} className="flex items-center justify-between px-2.5 h-8 border-b border-mdt-line last:border-0 hover:bg-mdt-surface-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3 h-3 text-mdt-dim flex-shrink-0" />
                <span className="text-[12px] text-mdt-text truncate">{a.street_name}</span>
              </div>
              <button onClick={() => handleDelete(a.id)} className="p-1 text-mdt-dim hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}