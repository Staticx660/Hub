import React from "react";
import { ChevronLeft, Clock } from "lucide-react";
import { Btn } from "@/components/mdt/ui/primitives";

/** Enterprise sign-on screen for operational boards (Fire / EMS / Police). */
export default function StationSignOn({ department, subtitle, icon: Icon, onBack, onClockIn }) {
  return (
    <div className="mdt fixed inset-0 flex flex-col bg-mdt-bg text-mdt-text">
      <div className="flex items-center gap-2 h-11 px-3 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
        {Icon && <Icon className="w-4 h-4 text-mdt-accent" />}
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold leading-tight truncate">{department.name}</div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-mdt-dim truncate">{subtitle}</div>
        </div>
        <div className="ml-auto"><Btn icon={ChevronLeft} onClick={onBack}>Exit</Btn></div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-mdt-line bg-mdt-surface">
          <header className="h-7 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">Terminal Sign-On</h2>
          </header>
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-mdt-dim uppercase tracking-wide text-[10px]">Duty Status</span>
              <span className="font-mono text-amber-300">OFF DUTY</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-mdt-dim uppercase tracking-wide text-[10px]">Station</span>
              <span className="font-mono truncate">{department.name}</span>
            </div>
            <p className="text-[11.5px] text-mdt-muted pt-1">Sign on to receive assignments and appear on the dispatch board.</p>
            <Btn variant="primary" icon={Clock} onClick={onClockIn} className="w-full justify-center">Clock In</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}