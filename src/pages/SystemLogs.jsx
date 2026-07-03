import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search, Info, AlertTriangle, AlertCircle, Zap } from "lucide-react";

const severityIcons = { Info: Info, Warning: AlertTriangle, Error: AlertCircle, Critical: Zap };
const severityColors = { Info: "text-blue-400", Warning: "text-yellow-400", Error: "text-red-400", Critical: "text-red-500" };
const categoryColors = { Roster: "bg-blue-500/10 text-blue-400", CAD: "bg-cyan-500/10 text-cyan-400", Auth: "bg-purple-500/10 text-purple-400", System: "bg-slate-500/10 text-slate-400", Discord: "bg-indigo-500/10 text-indigo-400" };

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    try {
      const l = await base44.entities.SystemLog.list('-created_date', 200);
      setLogs(l);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l => {
    if (catFilter !== "all" && l.category !== catFilter) return false;
    if (sevFilter !== "all" && l.severity !== sevFilter) return false;
    if (search && !l.action?.toLowerCase().includes(search.toLowerCase()) && !l.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ScrollText className="w-6 h-6 text-cyan-400" /> System Logs</h1>
        <p className="text-sm text-slate-400 mt-1">Audit trail of significant actions across the roster and CAD systems</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-800 border-slate-700 text-white pl-9" placeholder="Search by action or description..." />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-40"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Categories</SelectItem>
            {["Roster", "CAD", "Auth", "System", "Discord"].map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sevFilter} onValueChange={setSevFilter}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-40"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Severities</SelectItem>
            {["Info", "Warning", "Error", "Critical"].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-600 bg-slate-900/40 border border-slate-800 rounded-xl">
          <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No logs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => {
            const SevIcon = severityIcons[log.severity] || Info;
            return (
              <div key={log.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex items-start gap-3">
                <SevIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${severityColors[log.severity] || "text-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-white font-medium">{log.action}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColors[log.category] || categoryColors.System}`}>{log.category}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${log.severity === "Critical" ? "bg-red-500/20 text-red-400" : log.severity === "Error" ? "bg-red-500/10 text-red-400" : log.severity === "Warning" ? "bg-yellow-500/10 text-yellow-400" : "bg-blue-500/10 text-blue-400"}`}>{log.severity}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{log.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                    <span>{log.user_name || "System"}</span>
                    <span>{log.created_date ? new Date(log.created_date).toLocaleString() : ""}</span>
                    {log.entity_type && <span>· {log.entity_type}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}