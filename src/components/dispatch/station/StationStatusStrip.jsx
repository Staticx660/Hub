import React from "react";

/** Bottom status strip — always-on readout for the station. */
export default function StationStatusStrip({ items = [] }) {
  return (
    <div className="flex items-center gap-3 h-6 px-3 border-t border-mdt-line bg-mdt-surface-2 flex-shrink-0">
      {items.map((it, i) => (
        <React.Fragment key={it}>
          {i > 0 && <span className="text-[11px] text-mdt-line-2">|</span>}
          <span className="text-[11px] font-mono uppercase tracking-wide text-mdt-dim whitespace-nowrap">{it}</span>
        </React.Fragment>
      ))}
      <span className="ml-auto text-[11px] font-mono uppercase tracking-wide text-mdt-dim">Station Online</span>
    </div>
  );
}