import React from "react";

/** Labeled icon buttons — the application toolbar, replaces the side rail. */
export default function ToolbarNav({ items, active, onSelect }) {
  return (
    <div className="flex items-stretch gap-2 px-2 py-2 bg-mdt-bg border-b border-mdt-line flex-shrink-0">
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <button
            key={it.key}
            onClick={() => onSelect(it.key)}
            className={`flex flex-col items-center justify-center gap-1 w-[92px] h-[58px] border ${
              isActive
                ? "bg-mdt-accent/15 border-mdt-accent/60 text-mdt-text"
                : "bg-mdt-surface border-mdt-line text-mdt-muted hover:bg-mdt-surface-3 hover:text-mdt-text"
            }`}
          >
            <it.icon className={`w-[18px] h-[18px] ${isActive ? "text-mdt-accent" : ""}`} />
            <span className="text-[12.5px]">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}