import { Activity, CheckCircle2, Timer, CalendarDays, Send, SkipForward } from "lucide-react";
import { MSection } from "@/components/mdt/ui/formFields";

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="border border-mdt-line bg-mdt-surface p-2.5">
      <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim">
        <Icon className="w-3 h-3 text-mdt-accent" /> {label}
      </div>
      <p className="text-[19px] font-semibold text-mdt-text mt-1 leading-none">{value}</p>
      {sub && <p className="text-[10.5px] text-mdt-dim mt-1">{sub}</p>}
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
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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

      <MSection title="Last 7 Days">
        <div className="flex items-end gap-2 h-24">
          {last7.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-mdt-dim">{d.count || ""}</span>
              <div className="w-full bg-mdt-accent/70 min-h-[2px]" style={{ height: `${(d.count / peak) * 100}%` }} />
              <span className="text-[10px] text-mdt-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </MSection>
    </div>
  );
}