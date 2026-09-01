import React from "react";

/** Persona picker column for the civilian device (layout-agnostic). */
export default function PersonaList({ characters, selectedChar, onSelect }) {
  return (
    <div className="w-[190px] lg:w-[236px] flex-shrink-0 border-r border-mdt-line bg-mdt-surface flex flex-col min-h-0">
      <div className="h-8 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">Personas</span>
        <span className="ml-auto text-[10px] text-mdt-dim">{characters.length}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
        {characters.map((c) => {
          const active = selectedChar?.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full text-left px-2.5 py-1.5 border-b border-mdt-line/60 ${active ? "bg-mdt-accent/15" : "hover:bg-mdt-surface-3/60"}`}
              style={{ boxShadow: active ? "inset 2px 0 0 hsl(var(--mdt-accent))" : undefined }}
            >
              <div className="text-[12.5px] text-mdt-text truncate">{c.first_name} {c.last_name}</div>
              <div className="text-[10.5px] font-mono text-mdt-dim truncate">{c.dob || "—"} · {c.drivers_license_status || "No DL"}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}