import React, { useEffect, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { StatusPill } from "@/components/mdt/ui/primitives";

/**
 * Persistent top strip: identity on the left, live operational state in the
 * middle, global search on the right. Always visible, never scrolls away.
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
    <header className="flex items-center gap-3 h-10 px-2.5 bg-mdt-surface-2 border-b border-mdt-line flex-shrink-0">
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold text-mdt-text leading-tight truncate">{agency}</div>
        <div className="text-[10px] uppercase tracking-[0.1em] text-mdt-dim leading-tight truncate">{subtitle}</div>
      </div>

      <div className="h-5 w-px bg-mdt-line-2" />

      <div className="flex items-center gap-2 min-w-0">
        {unit && <span className="font-mono text-[12px] text-mdt-text">{unit}</span>}
        {status && <StatusPill tone={status.tone}>{status.label}</StatusPill>}
      </div>

      <div className="hidden lg:flex items-center gap-3 ml-2">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.08em] text-mdt-dim">{m.label}</span>
            <span className={`font-mono text-[12.5px] ${m.alert ? "text-red-300" : "text-mdt-text"}`}>{m.value}</span>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      {onSearch && (
        <button
          onClick={onSearch}
          className="flex items-center gap-2 h-7 px-2 w-[190px] rounded-sm border border-mdt-line-2 bg-mdt-surface text-mdt-dim hover:text-mdt-muted"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[11.5px]">Search everything</span>
          <kbd className="ml-auto font-mono text-[10px] text-mdt-dim">⌘K</kbd>
        </button>
      )}

      {right}

      <span className="font-mono text-[12px] text-mdt-muted tabular-nums">{clock}</span>
    </header>
  );
}

export function AlertBanner({ children }) {
  return (
    <div className="flex items-center gap-2 h-7 px-2.5 bg-red-950/60 border-b border-red-500/40 text-[12px] text-red-200 flex-shrink-0">
      <AlertTriangle className="w-3.5 h-3.5" /> {children}
    </div>
  );
}