import { Activity, CheckCircle2, Timer, CalendarDays, Send, SkipForward } from "lucide-react";

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="cad-card p-4">
      <div className="flex items-center gap-2 text-cad-muted text-xs font-semibold uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5 text-cad-accent" /> {label}
      </div>
      <p className="text-2xl font-bold text-cad-text mt-1.5">{value}</p>
      {sub && <p className="text-xs text-cad-dim mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AutoDispatchStats({ logs, closedCallIds }) {
  const dispatched = logs.filter((l) => l.outcome === "Auto-Dispatched");
  const skipped = logs.filter((l) => l.outcome?.startsWith("Skipped"));
  const failed = logs.filter((l) => l.outcome === "Failed");
  const cleared = dispatched.filter((l) => l.call_id && closedCallIds.has(l.call_id));

  const timed = dispatched.filter((l) => typeof l.dispatch_seconds === "number");
  const avgSeconds = timed.length
    ? Math.round(timed.reduce((s, l) => s + l.dispatch_seconds, 0) / timed.length)
    : null;

  const dayKeys = new Set(logs.map((l) => new Date(l.created_date).toDateString()));
  const perDay = dayKeys.size ? (logs.length / dayKeys.size).toFixed(1) : "0";

  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      count: logs.filter((l) => new Date(l.created_date).toDateString() === key).length,
    };
  });
  const peak = Math.max(1, ...last7.map((d) => d.count));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat icon={Activity} label="Calls Logged" value={logs.length} sub={`${failed.length} failed`} />
        <Stat icon={Send} label="Auto-Dispatched" value={dispatched.length} sub={logs.length ? `${Math.round((dispatched.length / logs.length) * 100)}% of all calls` : ""} />
        <Stat icon={CheckCircle2} label="Cleared" value={cleared.length} sub={dispatched.length ? `${Math.round((cleared.length / dispatched.length) * 100)}% of dispatches closed` : ""} />
        <Stat
          icon={Timer}
          label="Avg to Dispatch"
          value={avgSeconds === null ? "—" : avgSeconds < 60 ? `${avgSeconds}s` : `${Math.floor(avgSeconds / 60)}m ${avgSeconds % 60}s`}
          sub={`across ${timed.length} dispatch${timed.length === 1 ? "" : "es"}`}
        />
        <Stat icon={CalendarDays} label="Calls Per Day" value={perDay} sub={`over ${dayKeys.size || 0} active day${dayKeys.size === 1 ? "" : "s"}`} />
        <Stat icon={SkipForward} label="Handled by Dispatchers" value={skipped.length} sub="automation stood down" />
      </div>

      <div className="cad-card p-4">
        <p className="text-cad-muted text-xs font-semibold uppercase tracking-wider mb-3">Last 7 Days</p>
        <div className="flex items-end gap-2 h-24">
          {last7.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-cad-dim">{d.count || ""}</span>
              <div
                className="w-full rounded-t bg-cad-accent/70 min-h-[2px]"
                style={{ height: `${(d.count / peak) * 100}%` }}
              />
              <span className="text-[10px] text-cad-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}