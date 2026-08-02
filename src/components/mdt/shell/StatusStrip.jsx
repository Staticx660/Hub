import React, { useEffect, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";

/**
 * Application info strip: identity, live counters, global search, clock.
 */
export default function StatusStrip({ agency, subtitle, unit, status, metrics = [], onSearch, right }) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-4 h-9 px-3 bg-mdt-bg border-b border-mdt-line flex-shrink-0">
      <span className="text-[13.5px] text-mdt-text truncate">{unit || agency}</span>
      {status && (
        <span className="px-1.5 h-[18px] flex items-center border border-mdt-accent/50 bg-mdt-accent/15 text-mdt-accent text-[10.5px] font-semibold uppercase tracking-wide">
          {status.label}
        </span>
      )}
      <div className="flex items-center gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-baseline gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.06em] text-mdt-dim">{m.label}</span>
            <span className={`text-[13px] tabular-nums ${m.alert ? "text-red-400" : "text-mdt-text"}`}>{m.value}</span>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      {onSearch && (
        <button
          onClick={onSearch}
          className="flex items-center gap-2 h-7 px-2 w-[220px] border border-mdt-line-2 bg-mdt-surface text-mdt-dim hover:text-mdt-muted"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[12.5px]">Search everything</span>
          <kbd className="ml-auto text-[11px] text-mdt-dim">⌘K</kbd>
        </button>
      )}

      {right}

      <span className="text-[13px] text-mdt-text tabular-nums">{clock}</span>
    </div>
  );
}

export function AlertBanner({ children }) {
  return (
    <div className="flex items-center gap-2 h-7 px-2.5 bg-red-950/60 border-b border-red-500/40 text-[12px] text-red-200 flex-shrink-0">
      <AlertTriangle className="w-3.5 h-3.5" /> {children}
    </div>
  );
}