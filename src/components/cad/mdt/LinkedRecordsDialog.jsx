import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Search, FileText, Gavel, Eye, X, Link2, Unlink } from "lucide-react";

export default function LinkedRecordsDialog({ open, onOpenChange, department, linkedRecords = [], onLink }) {
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState([]);
  const [warrants, setWarrants] = useState([]);
  const [bolos, setBolos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const [r, w, b] = await Promise.all([
          base44.entities.CADReport.filter({ department_id: department.id }),
          base44.entities.Warrant.filter({ department_id: department.id }),
          base44.entities.BOLO.filter({ department_id: department.id }),
        ]);
        setReports(r); setWarrants(w); setBolos(b);
      } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
      setLoading(false);
    };
    load();
  }, [open, department.id]);

  const alreadyLinked = (id) => linkedRecords.some(l => l.id === id);

  const filterItems = (items, labelFn) => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(i => labelFn(i).toLowerCase().includes(q));
  };

  const reportItems = filterItems(reports, r => `${r.title} ${r.run_number} ${r.report_type}`);
  const warrantItems = filterItems(warrants, w => `${w.person_name} ${w.reason}`);
  const boloItems = filterItems(bolos, b => `${b.title} ${b.description} ${b.person_name}`);

  const handleLink = (item, type) => {
    const entry = {
      id: item.id,
      type,
      title: type === "warrant" ? `Warrant: ${item.person_name}` : type === "bolo" ? item.title : item.title,
      number: type === "warrant" ? "" : type === "bolo" ? "" : item.run_number || "",
      status: item.status || "",
    };
    onLink(entry);
  };

  const inputCls = "bg-[#0f1115] border-none text-white text-sm h-9 rounded-md focus-visible:ring-1 focus-visible:ring-slate-600 placeholder:text-slate-600";

  const renderRow = (item, type, label, sub, icon) => (
    <div key={item.id} className="flex items-center justify-between bg-[#1a1d21] rounded-lg p-2.5">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <div className="min-w-0">
          <p className="text-sm text-white truncate">{label}</p>
          {sub && <p className="text-xs text-slate-500 truncate">{sub}</p>}
        </div>
      </div>
      {alreadyLinked(item.id) ? (
        <span className="text-xs text-teal-400 flex items-center gap-1 flex-shrink-0"><Link2 className="w-3 h-3" /> Linked</span>
      ) : (
        <Button size="sm" onClick={() => handleLink(item, type)} className="bg-teal-600 hover:bg-teal-700 text-white h-7 text-xs gap-1 flex-shrink-0"><Link2 className="w-3 h-3" /> Link</Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1d21] border-[#2c2f36] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2"><Link2 className="w-5 h-5 text-teal-400" /> Link Existing Record</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={query} onChange={e => setQuery(e.target.value)} className={inputCls} placeholder="Search reports, warrants, BOLOs..." />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {loading ? <p className="text-slate-500 text-center py-4 text-sm">Loading...</p> : (
              <>
                {reportItems.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Reports ({reportItems.length})</p>
                    <div className="space-y-1.5">
                      {reportItems.map(r => renderRow(r, "report", r.title, `${r.report_type} · ${r.run_number || "No #"}`, <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />))}
                    </div>
                  </div>
                )}
                {warrantItems.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Warrants ({warrantItems.length})</p>
                    <div className="space-y-1.5">
                      {warrantItems.map(w => renderRow(w, "warrant", `Warrant: ${w.person_name}`, w.reason, <Gavel className="w-4 h-4 text-red-400 flex-shrink-0" />))}
                    </div>
                  </div>
                )}
                {boloItems.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">BOLOs ({boloItems.length})</p>
                    <div className="space-y-1.5">
                      {boloItems.map(b => renderRow(b, "bolo", b.title, b.description, <Eye className="w-4 h-4 text-yellow-400 flex-shrink-0" />))}
                    </div>
                  </div>
                )}
                {reportItems.length === 0 && warrantItems.length === 0 && boloItems.length === 0 && (
                  <p className="text-slate-500 text-center py-6 text-sm">No records found</p>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}