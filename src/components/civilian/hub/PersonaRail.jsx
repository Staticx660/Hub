import React from "react";
import { UserPlus, AlertTriangle } from "lucide-react";
import { Btn } from "@/components/mdt/ui/primitives";

/** Stationary roster of the user's personas. */
export default function PersonaRail({ characters, selectedId, onSelect, warrantsFor, onNew }) {
  return (
    <div className="w-[248px] flex-shrink-0 border-r border-mdt-line bg-mdt-surface flex flex-col">
      <div className="h-8 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">Identities</span>
        <span className="ml-auto text-[10px] font-mono text-mdt-dim">{characters.length}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
        {characters.length === 0 && <p className="p-2.5 text-[11.5px] text-mdt-dim">No identities on file.</p>}
        {characters.map((c) => {
          const active = selectedId === c.id;
          const flagged = warrantsFor(c).length;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left border-b border-mdt-line/60 ${active ? "bg-mdt-accent/15" : "hover:bg-mdt-surface-3/60"}`}
              style={{ boxShadow: active ? "inset 2px 0 0 hsl(var(--mdt-accent))" : undefined }}
            >
              {c.photo_url ? (
                <img src={c.photo_url} alt="" className="w-7 h-7 object-cover border border-mdt-line-2 flex-shrink-0" />
              ) : (
                <span className="w-7 h-7 flex items-center justify-center border border-mdt-line-2 bg-mdt-surface-3 text-[11px] font-bold text-mdt-dim flex-shrink-0">
                  {c.first_name?.[0]}{c.last_name?.[0]}
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-[12.5px] text-mdt-text truncate">{c.first_name} {c.last_name}</span>
                <span className="block text-[10.5px] font-mono text-mdt-dim truncate">{c.dob || "—"}</span>
              </span>
              {flagged > 0 && <AlertTriangle className="w-3.5 h-3.5 text-red-400 ml-auto flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="border-t border-mdt-line p-1.5">
        <Btn variant="primary" icon={UserPlus} onClick={onNew} className="w-full justify-start">New Identity</Btn>
      </div>
    </div>
  );
}