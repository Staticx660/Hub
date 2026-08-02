import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ScrollText, Search, Info, AlertTriangle, AlertCircle, Zap, Loader2 } from "lucide-react";
import { MInput, MSelect } from "@/components/mdt/ui/formFields";
import { StatusPill, EmptyState } from "@/components/mdt/ui/primitives";

const severityIcons = { Info: Info, Warning: AlertTriangle, Error: AlertCircle, Critical: Zap };
const severityColors = { Info: "text-blue-300", Warning: "text-amber-300", Error: "text-red-300", Critical: "text-red-400" };
const severityTone = { Info: "info", Warning: "warn", Error: "crit", Critical: "crit" };

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

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  return (
    <div className="max-w-4xl space-y-2.5">
      <p className="text-[11.5px] text-mdt-dim">Audit trail of significant actions across the roster and CAD systems.</p>

      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-mdt-dim" />
          <MInput value={search} onChange={e => setSearch(e.target.value)} className="pl-6" placeholder="Search by action or description…" />
        </div>
        <MSelect className="w-36" options={["all", "Roster", "CAD", "Auth", "System", "Discord"]} value={catFilter} onChange={e => setCatFilter(e.target.value)} />
        <MSelect className="w-36" options={["all", "Info", "Warning", "Error", "Critical"]} value={sevFilter} onChange={e => setSevFilter(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-mdt-line bg-mdt-surface h-48"><EmptyState icon={ScrollText} title="No logs found" /></div>
      ) : (
        <div className="border border-mdt-line bg-mdt-surface divide-y divide-mdt-line">
          {filtered.map(log => {
            const SevIcon = severityIcons[log.severity] || Info;
            return (
              <div key={log.id} className="p-2.5 flex items-start gap-2">
                <SevIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${severityColors[log.severity] || "text-mdt-dim"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[12.5px] font-medium text-mdt-text">{log.action}</span>
                    <StatusPill tone="neutral">{log.category}</StatusPill>
                    <StatusPill tone={severityTone[log.severity] || "neutral"}>{log.severity}</StatusPill>
                  </div>
                  <p className="text-[11.5px] text-mdt-muted mt-0.5">{log.description}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-mdt-dim">
                    <span>{log.user_name || "System"}</span>
                    <span className="font-mono">{log.created_date ? new Date(log.created_date).toLocaleString() : ""}</span>
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