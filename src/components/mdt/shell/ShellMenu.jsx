import React, { useState, useEffect, useRef } from "react";
import { Menu as MenuIcon } from "lucide-react";

/**
 * Single consolidated command menu — used by layouts that don't show a
 * desktop-style menu strip. Accepts the same `menus` shape as MenuStrip.
 */
export default function ShellMenu({ menus = [], label = "Menu", className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-7 px-2 border border-mdt-line-2 bg-mdt-surface text-mdt-muted hover:text-mdt-text text-[12.5px] rounded-[var(--cad-radius)]"
      >
        <MenuIcon className="w-3.5 h-3.5" /> {label}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-[60] w-[min(250px,calc(100vw-1.5rem))] max-h-[60vh] overflow-auto mdt-scroll border border-mdt-line-2 bg-mdt-surface shadow-2xl py-1">
          {menus.map((m) => (
            <div key={m.label}>
              <p className="px-3 h-6 flex items-center text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim bg-mdt-surface-3">{m.label}</p>
              {m.items.map((it, i) =>
                it.separator ? (
                  <div key={i} className="my-1 h-px bg-mdt-line" />
                ) : (
                  <button
                    key={i}
                    disabled={it.disabled}
                    onClick={() => { setOpen(false); it.onSelect?.(); }}
                    className={`w-full flex items-center gap-4 px-3 py-1.5 text-left text-[12.5px] ${
                      it.disabled ? "text-mdt-dim cursor-not-allowed" : it.danger ? "text-red-300 hover:bg-red-500/15" : "text-mdt-text hover:bg-mdt-surface-3"
                    }`}
                  >
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.shortcut && <span className="text-[11px] text-mdt-dim font-mono">{it.shortcut}</span>}
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}