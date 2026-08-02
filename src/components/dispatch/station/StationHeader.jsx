import React, { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { StatusPill } from "@/components/mdt/ui/primitives";

function Metric({ label, value, tone }) {
  return (
    <div className="px-3 border-l border-mdt-line first:border-l-0">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">{label}</div>
      <div className={`text-[15px] font-bold leading-tight ${tone || "text-mdt-text"}`}>{value}</div>
    </div>
  );
}

export default function StationHeader({ pending, active, available, onDuty, unitsTotal }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-3 h-12 px-3 bg-mdt-surface-2 border-b border-mdt-line flex-shrink-0">
      <div className="flex items-center gap-2 pr-3 border-r border-mdt-line">
        <Radio className="w-4 h-4 text-mdt-accent" />
        <div>
          <div className="text-[12.5px] font-semibold text-mdt-text leading-tight">Dispatch Workstation</div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-mdt-dim">Communications Center</div>
        </div>
      </div>

      <div className="flex items-center">
        <Metric label="Pending" value={pending} tone={pending > 0 ? "text-amber-300" : undefined} />
        <Metric label="Active" value={active} />
        <Metric label="Available" value={`${available}/${unitsTotal}`} tone={available === 0 ? "text-red-300" : "text-emerald-300"} />
        <Metric label="On Duty" value={onDuty} />
      </div>

      <div className="flex-1" />
      {pending > 0 && <StatusPill tone="warn">{pending} awaiting dispatch</StatusPill>}
      <div className="text-right pl-2">
        <div className="font-mono text-[15px] text-mdt-text leading-tight">{now.toLocaleTimeString([], { hour12: false })}</div>
        <div className="text-[10px] text-mdt-dim">{now.toLocaleDateString()}</div>
      </div>
    </div>
  );
}