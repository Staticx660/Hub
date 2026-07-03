import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, ChevronRight } from "lucide-react";

export default function MyRecords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [allReports, myChars] = await Promise.all([
          base44.entities.CADReport.list('-created_date', 500),
          user?.id ? base44.entities.Civilian.filter({ owner_user_id: user.id }) : Promise.resolve([]),
        ]);
        const charIds = new Set(myChars.map(c => c.id));
        const charNames = new Set(myChars.map(c => `${c.first_name} ${c.last_name}`));
        const myReports = allReports.filter(r =>
          r.filed_by_id === user?.id ||
          charIds.has(r.linked_civilian_id) ||
          charNames.has(r.linked_civilian_name) ||
          (r.field_data?.["Civilian Name"] && charNames.has(r.field_data["Civilian Name"]))
        );
        setReports(myReports);
      } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const types = [...new Set(reports.map(r => r.report_type))];
  const filtered = reports.filter(r => {
    if (typeFilter !== "all" && r.report_type !== typeFilter) return false;
    if (search && !r.title?.toLowerCase().includes(search.toLowerCase()) && !r.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileText className="w-6 h-6 text-cyan-400" /> My Records</h1>
        <p className="text-sm text-slate-400 mt-1">Reports you have filed or been involved in</p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-800 border-slate-700 text-white pl-9" placeholder="Search reports..." />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-48"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Types</SelectItem>
            {types.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!selected ? (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-600 bg-slate-900/40 border border-slate-800 rounded-xl">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No records found</p>
            </div>
          ) : (
            filtered.map(r => (
              <button key={r.id} onClick={() => setSelected(r)} className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-3 hover:border-slate-600 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "Draft" ? "text-yellow-400 bg-yellow-500/10" : r.status === "Filed" ? "text-green-400 bg-green-500/10" : "text-blue-400 bg-blue-500/10"}`}>{r.status}</span>
                  <div>
                    <p className="text-white font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-slate-500">{r.report_type} · {r.run_number || "No run #"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{r.filed_by_name || "Unknown"}</p>
                  <p className="text-xs text-slate-600">{r.created_date ? new Date(r.created_date).toLocaleDateString() : ""}</p>
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4">← Back to list</button>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{selected.title}</h2>
              <p className="text-sm text-blue-400 font-mono">{selected.run_number}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full ${selected.status === "Draft" ? "text-yellow-400 bg-yellow-500/10" : "text-green-400 bg-green-500/10"}`}>{selected.status}</span>
          </div>
          <p className="text-sm text-slate-400 mb-2">Type: {selected.report_type}</p>
          {selected.location && <p className="text-sm text-slate-400 mb-2">Location: {selected.location}</p>}
          {selected.linked_civilian_name && <p className="text-sm text-slate-400 mb-2">Linked Civilian: {selected.linked_civilian_name}</p>}
          {selected.linked_vehicle_plate && <p className="text-sm text-slate-400 mb-2">Linked Vehicle: <span className="font-mono">{selected.linked_vehicle_plate}</span></p>}
          <p className="text-sm text-slate-300 whitespace-pre-wrap mt-3">{selected.description}</p>
          {selected.field_data && Object.keys(selected.field_data).length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-2">Additional Fields:</p>
              <div className="space-y-1.5">
                {Object.entries(selected.field_data).map(([key, val]) => (
                  <div key={key} className="text-sm"><span className="text-slate-500">{key}: </span><span className="text-slate-300">{String(val)}</span></div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-4">Filed by: {selected.filed_by_name || "Unknown"}</p>
        </div>
      )}
    </div>
  );
}