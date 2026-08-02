import React, { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

/** Collapsible multi-select in the enterprise language — flat rows, square chips. */
export default function MOptionSelect({ label, icon: Icon, options, selected = [], onChange }) {
  const [open, setOpen] = useState(false);
  const toggle = (o) => onChange(selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o]);

  return (
    <div className="border border-mdt-line bg-mdt-surface">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full h-7 px-2.5 bg-mdt-surface-2 border-b border-mdt-line text-[10.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim hover:text-mdt-text"
      >
        {Icon && <Icon className="w-3 h-3" />}
        <span className="truncate">{label}</span>
        <span className="ml-auto font-mono text-[10px]">{selected.length}</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <div className="p-2 space-y-2">
        {open && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
            {options.map((o) => (
              <label key={o} className="flex items-center gap-1.5 text-[11.5px] text-mdt-muted cursor-pointer hover:text-mdt-text">
                <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} className="accent-teal-500" />
                <span className="truncate">{o}</span>
              </label>
            ))}
          </div>
        )}
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 h-[20px] px-1.5 border border-mdt-line-2 bg-mdt-surface-3 text-[11.5px] text-mdt-text">
                {s}
                <button type="button" onClick={() => toggle(s)} className="text-mdt-dim hover:text-red-400"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        ) : (
          !open && <p className="text-[11.5px] text-mdt-dim">None on file</p>
        )}
      </div>
    </div>
  );
}