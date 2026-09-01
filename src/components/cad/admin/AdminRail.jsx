import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crown, ShieldCheck } from "lucide-react";
import { StatusPill } from "@/components/mdt/ui/primitives";

/** Flat operational rail for the admin console — no glass, no rounded cards. */
export default function AdminRail({ sections, active, onSelect, isPlatformAdmin, isCADAdmin, isSupervisor, communityName }) {
  return (
    <aside className="w-[180px] xl:w-[228px] flex-shrink-0 border-r border-mdt-line bg-mdt-surface flex flex-col min-h-0">
      <div className="h-11 px-3 flex items-center border-b border-mdt-line bg-mdt-surface-2">
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold leading-tight truncate">Administration</div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-mdt-dim truncate">{communityName || "CAD · Roster · System"}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-2 py-1.5 border-b border-mdt-line">
        {isPlatformAdmin && <StatusPill tone="info"><Crown className="w-2.5 h-2.5" /> Platform</StatusPill>}
        {isCADAdmin && <StatusPill tone="info"><ShieldCheck className="w-2.5 h-2.5" /> CAD Admin</StatusPill>}
        {isSupervisor && <StatusPill tone="ok"><ShieldCheck className="w-2.5 h-2.5" /> Supervisor</StatusPill>}
      </div>

      <nav className="flex-1 min-h-0 overflow-auto mdt-scroll">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="h-6 px-2.5 flex items-center text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim bg-mdt-surface-3">{section.title}</p>
            {section.items.map((item) => {
              const on = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`w-full flex items-center gap-2 px-2.5 h-7 text-[12px] border-b border-mdt-line/60 ${on ? "bg-mdt-accent/15 text-mdt-text" : "text-mdt-muted hover:bg-mdt-surface-3/60 hover:text-mdt-text"}`}
                  style={{ boxShadow: on ? "inset 2px 0 0 hsl(var(--mdt-accent))" : undefined }}
                >
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <Link to="/cad" className="h-8 px-2.5 flex items-center gap-1.5 border-t border-mdt-line text-[11.5px] text-mdt-muted hover:text-mdt-text hover:bg-mdt-surface-3/60">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to CAD
      </Link>
    </aside>
  );
}