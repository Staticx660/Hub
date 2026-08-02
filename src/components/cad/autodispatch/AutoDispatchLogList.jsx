import { Radio, UserCheck, PauseCircle, AlertTriangle } from "lucide-react";
import { StatusPill, EmptyState } from "@/components/mdt/ui/primitives";

const OUTCOME_STYLE = {
  "Auto-Dispatched": { icon: Radio, tone: "ok" },
  "Skipped - Dispatcher Online": { icon: UserCheck, tone: "info" },
  "Skipped - Disabled": { icon: PauseCircle, tone: "neutral" },
  Failed: { icon: AlertTriangle, tone: "crit" },
};

export default function AutoDispatchLogList({ logs }) {
  if (logs.length === 0) {
    return <div className="border border-mdt-line bg-mdt-surface h-40"><EmptyState icon={Radio} title="No automated dispatches yet" hint="New 911 calls will appear here" /></div>;
  }

  return (
    <div className="border border-mdt-line bg-mdt-surface divide-y divide-mdt-line">
      {logs.map((log) => {
        const style = OUTCOME_STYLE[log.outcome] || OUTCOME_STYLE.Failed;
        const Icon = style.icon;
        return (
          <div key={log.id} className="p-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusPill tone={style.tone}><Icon className="w-3 h-3" /> {log.outcome}</StatusPill>
              <span className="text-[12.5px] text-mdt-text">{log.call_type || "Unknown call"}</span>
              {log.priority && <span className="text-[11px] text-mdt-muted">{log.priority}</span>}
              <span className="text-[10.5px] font-mono text-mdt-dim ml-auto">{new Date(log.created_date).toLocaleString()}</span>
            </div>
            <p className="text-[11.5px] text-mdt-muted mt-1">
              {log.location || "No location"}{log.postal ? ` (${log.postal})` : ""}
              {log.category ? ` — ${log.category}` : ""}
            </p>
            {log.department_names?.length > 0 && (
              <p className="text-[11.5px] text-mdt-accent mt-0.5">Responding: {log.department_names.join(", ")}</p>
            )}
            {log.recommended_units?.length > 0 && (
              <p className="text-[11.5px] text-mdt-muted mt-0.5">
                Units: {log.recommended_units.map((u) => `${u.callsign || u.unit_name}${u.distance != null ? ` (~${u.distance}m)` : ""}${u.assigned ? " ✓" : ""}`).join(", ")}
              </p>
            )}
            {log.reasoning && <p className="text-[11px] text-mdt-dim mt-0.5 italic">{log.reasoning}</p>}
            {log.narrative && <p className="text-[11.5px] text-mdt-muted mt-1 leading-relaxed">{log.narrative}</p>}
            {log.error && <p className="text-[11.5px] text-red-300 mt-0.5">{log.error}</p>}
          </div>
        );
      })}
    </div>
  );
}