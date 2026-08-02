import React from "react";

/** Bottom status strip — always-on readout for the station. */
export default function StationStatusStrip({ items = [], dispatchers = [] }) {
  const onDuty = dispatchers.length > 0;
  return (
    <div className="flex items-center gap-3 h-6 px-3 border-t border-mdt-line bg-mdt-surface-2 flex-shrink-0">
      {items.map((it, i) => (
        <React.Fragment key={it}>
          {i > 0 && <span className="text-[11px] text-mdt-line-2">|</span>}
          <span className="text-[11px] font-mono uppercase tracking-wide text-mdt-dim whitespace-nowrap">{it}</span>
        </React.Fragment>
      ))}
      <span
        className={`ml-auto flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide whitespace-nowrap ${onDuty ? "text-emerald-300" : "text-red-300"}`}
        title={onDuty ? dispatchers.map(d => `${d.callsign || ""} ${d.user_name}`.trim()).join(", ") : "No dispatcher signed on"}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${onDuty ? "bg-emerald-400" : "bg-red-400 animate-pulse"}`} />
        {onDuty
          ? `Dispatcher On Duty: ${dispatchers.map(d => d.callsign || d.user_name).join(", ")}`
          : "No Dispatcher On Duty"}
      </span>
    </div>
  );
}