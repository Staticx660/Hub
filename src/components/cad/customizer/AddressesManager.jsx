import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download, Trash2, Search, MapPin, AlertCircle } from "lucide-react";

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

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Addresses</h2>
          <p className="text-sm text-slate-400">Import and manage street addresses for your city</p>
        </div>
        <div className="flex gap-2">
          <label>
            <input type="file" accept=".csv,.json" className="hidden" onChange={handleImport} disabled={importing} />
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm cursor-pointer disabled:opacity-50">
              <Upload className="w-4 h-4" /> Import
            </span>
          </label>
          <Button onClick={handleExport} variant="destructive" size="sm" className="gap-1.5"><Download className="w-4 h-4" /> Export</Button>
          {addresses.length > 0 && <Button onClick={handleClearAll} variant="outline" size="sm" className="border-slate-700 text-slate-400 gap-1.5"><Trash2 className="w-4 h-4" /> Clear All</Button>}
        </div>
      </div>

      {importing && <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4 flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /><span className="text-sm text-blue-400">Importing addresses...</span></div>}

      {addresses.length > 0 && (
        <div className="mb-4 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-800 border-slate-700 text-white pl-9" placeholder="Search addresses..." />
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No addresses imported yet</p>
          <p className="text-xs text-slate-600 mt-1">Click Import to upload a CSV file</p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto">
            {filtered.map(a => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2 border-b border-slate-800 last:border-0 hover:bg-slate-800/30">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-sm text-slate-300">{a.street_name}</span>
                </div>
                <button onClick={() => handleDelete(a.id)} className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-slate-800 text-xs text-slate-500">
            {filtered.length} of {addresses.length} addresses
          </div>
        </div>
      )}
    </div>
  );
}