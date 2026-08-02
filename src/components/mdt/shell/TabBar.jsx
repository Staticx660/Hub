import React, { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";

/** Horizontal workspace tab bar (browser-style). Active tab is marked by a teal top edge. */
export default function TabBar({ tabs, activeTab, onSelect, onAdd, onClose, addOptions = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex items-end h-9 px-1.5 bg-mdt-bg border-b border-mdt-line flex-shrink-0">
      {tabs.map((t) => {
        const active = t.key === activeTab;
        return (
          <div
            key={t.key}
            onClick={() => onSelect(t.key)}
            className={`group flex items-center gap-1.5 h-8 pl-3 pr-1.5 text-[13px] border-l border-r border-t cursor-pointer select-none ${
              active
                ? "bg-mdt-surface text-mdt-text border-mdt-line border-t-2 border-t-mdt-accent font-medium"
                : "bg-mdt-bg text-mdt-dim border-transparent hover:text-mdt-muted"
            }`}
          >
            {t.label}
            {onClose && tabs.length > 1 ? (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(t.key); }}
                className="w-4 h-4 flex items-center justify-center rounded-sm text-mdt-dim opacity-0 group-hover:opacity-100 hover:bg-mdt-surface-3 hover:text-mdt-text"
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            ) : <span className="w-4" />}
          </div>
        );
      })}
      <div className="relative" ref={ref}>
        <button
          onClick={() => (addOptions.length ? setMenuOpen((o) => !o) : onAdd && onAdd())}
          disabled={addOptions.length === 0}
          title="New tab"
          className="h-8 w-8 flex items-center justify-center text-mdt-dim hover:text-mdt-text disabled:opacity-30"
        >
          <Plus className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute left-0 top-8 z-50 min-w-[170px] py-1 bg-mdt-surface-2 border border-mdt-line-2 shadow-lg">
            {addOptions.map((o) => (
              <button
                key={o.key}
                onClick={() => { setMenuOpen(false); onAdd(o.key); }}
                className="w-full text-left px-3 py-1 text-[12.5px] text-mdt-text hover:bg-mdt-surface-3"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}