import React, { useState, useEffect, useRef } from "react";

/**
 * Classic desktop menu strip with working dropdown menus.
 * `menus`: [{ label, items: [{ label, shortcut, onSelect, disabled, danger, separator }] }]
 */
export default function MenuStrip({ menus = [], onSearch }) {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(null); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-1 h-9 px-2 bg-mdt-bg border-b border-mdt-line flex-shrink-0">
      {menus.map((m) => (
        <div key={m.label} className="relative">
          <button
            onClick={() => setOpen(open === m.label ? null : m.label)}
            onMouseEnter={() => open && setOpen(m.label)}
            className={`h-6 px-2.5 text-[13px] ${open === m.label ? "bg-mdt-surface-4 text-mdt-text" : "text-mdt-text hover:bg-mdt-surface-3"}`}
          >
            {m.label}
          </button>
          {open === m.label && (
            <div className="absolute left-0 top-6 z-[60] min-w-[230px] border border-mdt-line-2 bg-mdt-surface shadow-2xl py-1">
              {m.items.map((it, i) =>
                it.separator ? (
                  <div key={i} className="my-1 h-px bg-mdt-line" />
                ) : (
                  <button
                    key={i}
                    disabled={it.disabled}
                    onClick={() => { setOpen(null); it.onSelect?.(); }}
                    className={`w-full flex items-center gap-6 px-3 py-1.5 text-left text-[12.5px] ${
                      it.disabled ? "text-mdt-dim cursor-not-allowed" : it.danger ? "text-red-300 hover:bg-red-500/15" : "text-mdt-text hover:bg-mdt-surface-3"
                    }`}
                  >
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.shortcut && <span className="text-[11px] text-mdt-dim font-mono">{it.shortcut}</span>}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
      <button onClick={onSearch} className="h-6 px-2.5 text-[13px] text-mdt-text bg-mdt-surface-3 hover:bg-mdt-surface-4">
        Search
      </button>
    </div>
  );
}