import React from "react";
import { UserPlus, IdCard, Car, FileText, PhoneCall, Pencil } from "lucide-react";
import { Btn } from "@/components/mdt/ui/primitives";

const ACTIONS = [
  { key: "identity", label: "Identity", icon: IdCard },
  { key: "dmv", label: "DMV", icon: Car },
  { key: "records", label: "Records", icon: FileText },
];

/** Left rail of the civilian device: persona picker on top, action rail below. */
export default function CharacterRail({ characters, selectedChar, onSelect, panel, setPanel, onNew, onEdit, on911 }) {
  return (
    <div className="w-[236px] flex-shrink-0 border-r border-mdt-line bg-mdt-surface flex flex-col">
      <div className="h-8 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
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

      <div className="border-t border-mdt-line p-1.5 space-y-1">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            disabled={!selectedChar}
            onClick={() => setPanel(a.key === "identity" ? null : a.key)}
            className={`w-full flex items-center gap-2 h-7 px-2 text-[12px] rounded-sm disabled:opacity-40 ${
              (a.key === "identity" ? !panel : panel === a.key) ? "bg-mdt-surface-4 text-mdt-text" : "text-mdt-muted hover:bg-mdt-surface-3"
            }`}
          >
            <a.icon className="w-3.5 h-3.5" /> {a.label}
          </button>
        ))}
        <div className="pt-1 space-y-1">
          <Btn icon={UserPlus} onClick={onNew} className="w-full justify-start">New Persona</Btn>
          <Btn icon={Pencil} disabled={!selectedChar} onClick={onEdit} className="w-full justify-start">Edit Persona</Btn>
          <Btn variant="danger" icon={PhoneCall} disabled={!selectedChar} onClick={on911} className="w-full justify-start">Call 911</Btn>
        </div>
      </div>
    </div>
  );
}