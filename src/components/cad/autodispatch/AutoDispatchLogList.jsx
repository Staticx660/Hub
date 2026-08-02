import { Radio, UserCheck, PauseCircle, AlertTriangle } from "lucide-react";

const OUTCOME_STYLE = {
  "Auto-Dispatched": { icon: Radio, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  "Skipped - Dispatcher Online": { icon: UserCheck, cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  "Skipped - Disabled": { icon: PauseCircle, cls: "text-cad-dim bg-cad-surface-2/40 border-cad-border/40" },
  Failed: { icon: AlertTriangle, cls: "text-red-400 bg-red-500/10 border-red-500/20" },
};

export default function AutoDispatchLogList({ logs }) {
  if (logs.length === 0) {
    return <p className="text-sm text-cad-dim text-center py-10">No automated dispatches yet. New 911 calls will appear here.</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const style = OUTCOME_STYLE[log.outcome] || OUTCOME_STYLE.Failed;
        const Icon = style.icon;
        return (
          <div key={log.id} className="p-3 rounded-lg bg-cad-surface-2/30 border border-cad-border/40">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded border ${style.cls}`}>
                <Icon className="w-3 h-3" /> {log.outcome}
              </span>
              <span className="text-sm font-medium text-cad-text">{log.call_type || "Unknown call"}</span>
              {log.priority && <span className="text-xs text-cad-muted">{log.priority}</span>}
              <span className="text-xs text-cad-dim ml-auto">{new Date(log.created_date).toLocaleString()}</span>
            </div>
            <p className="text-xs text-cad-muted mt-1.5">
              {log.location || "No location"}{log.postal ? ` (${log.postal})` : ""}
              {log.category ? ` — ${log.category}` : ""}
            </p>
            {log.department_names?.length > 0 && (
              <p className="text-xs text-cad-accent mt-1">Responding: {log.department_names.join(", ")}</p>
            )}
            {log.recommended_units?.length > 0 && (
              <p className="text-xs text-cad-muted mt-1">
                Units: {log.recommended_units.map((u) => `${u.callsign || u.unit_name}${u.distance != null ? ` (~${u.distance}m)` : ""}${u.assigned ? " ✓" : ""}`).join(", ")}
              </p>
            )}
            {log.reasoning && <p className="text-xs text-cad-dim mt-1 italic">{log.reasoning}</p>}
            {log.narrative && <p className="text-xs text-cad-muted mt-1.5 leading-relaxed">{log.narrative}</p>}
            {log.error && <p className="text-xs text-red-400 mt-1">{log.error}</p>}
          </div>
        );
      })}
    </div>
  );
}