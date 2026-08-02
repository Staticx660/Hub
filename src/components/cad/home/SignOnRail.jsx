import React from "react";
import { Lock, Shield, Flame, HeartPulse, Radio, User, Building2 } from "lucide-react";

const CAT_ICON = { Police: Shield, Fire: Flame, EMS: HeartPulse, Dispatch: Radio, Civilian: User };
const ORDER = ["Dispatch", "Police", "Fire", "EMS", "Private Security", "Civilian", "Other"];

/** Left sign-on rail: every terminal the operator can board, grouped by service. */
export default function SignOnRail({ departments, selectedId, onSelect, unitCount, availableCount }) {
  const groups = ORDER.filter((cat) => departments.some((d) => (d.category || "Other") === cat));

  return (
    <div className="w-[268px] flex-shrink-0 border-r border-mdt-line bg-mdt-surface overflow-auto mdt-scroll">
      <div className="h-8 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2 sticky top-0 z-10">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">Terminal Sign-On</span>
        <span className="ml-auto text-[10px] text-mdt-dim">{departments.length}</span>
      </div>

      {groups.map((cat) => {
        const Icon = CAT_ICON[cat] || Building2;
        return (
          <div key={cat}>
            <div className="h-6 px-2.5 flex items-center gap-1.5 bg-mdt-surface-3">
              <Icon className="w-3 h-3 text-mdt-dim" />
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-mdt-muted">{cat}</span>
            </div>
            {departments.filter((d) => (d.category || "Other") === cat).map((d) => {
              const locked = d.hasAccess === false;
              const active = selectedId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  className={`w-full flex items-center gap-2 px-2.5 h-9 text-left border-b border-mdt-line/60 ${active ? "bg-mdt-accent/15" : "hover:bg-mdt-surface-3/60"}`}
                  style={{ boxShadow: active ? `inset 2px 0 0 ${d.color || "#14b8a6"}` : undefined }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: locked ? "#475569" : d.color || "#14b8a6" }} />
                  <span className={`text-[12.5px] truncate ${locked ? "text-mdt-dim" : "text-mdt-text"}`}>{d.name}</span>
                  {locked ? (
                    <Lock className="w-3 h-3 text-mdt-dim ml-auto flex-shrink-0" />
                  ) : (
                    <span className="ml-auto text-[10.5px] font-mono text-mdt-dim flex-shrink-0">
                      {availableCount(d.id)}/{unitCount(d.id)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}