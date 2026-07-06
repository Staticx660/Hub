import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, ChevronLeft } from "lucide-react";
import ClockInDialog from "@/components/cad/mdt/ClockInDialog";
import RetroFrame from "@/components/cad/retro/RetroFrame";

export default function RetroClockInScreen({ department, user, onClockIn, clockInOpen, setClockInOpen, icon: Icon, accentColor, subtitle, clockInLabel, onBack }) {
  const accent = accentColor || "#3b82f6";
  return (
    <div className="flex flex-col items-center justify-center h-screen cad-gradient-bg cad-font retro-shell gap-6 px-4">
      <RetroFrame title={department.name.toUpperCase()} className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4 py-4">
          {Icon && (
            <div className="w-16 h-16 flex items-center justify-center border border-cad-border-light" style={{ background: accent + "15" }}>
              <Icon className="w-8 h-8" style={{ color: accent }} />
            </div>
          )}
          <div className="text-center">
            <p className="text-cad-accent text-xs uppercase tracking-widest font-bold">{subtitle || "OPERATIONS BOARD"}</p>
            <p className="text-cad-dim text-xs mt-2 retro-cursor">&gt; STATUS: OFF_DUTTY</p>
            <p className="text-cad-dim text-xs mt-1">&gt; AWAITING SESSION INITIALIZATION</p>
          </div>
          <div className="flex gap-3 mt-2 w-full justify-center">
            <Button onClick={onBack} variant="outline" className="border-cad-border-light text-cad-muted hover:bg-cad-surface-2/50 hover:text-cad-text gap-2 px-6 rounded-none font-bold uppercase tracking-wider text-xs"><ChevronLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={() => setClockInOpen(true)} style={{ backgroundColor: accent }} className="gap-2 px-8 rounded-none font-bold uppercase tracking-wider text-xs"><Clock className="w-4 h-4" /> {clockInLabel || "Clock In"}</Button>
          </div>
        </div>
      </RetroFrame>
      <ClockInDialog open={clockInOpen} onOpenChange={setClockInOpen} department={department} user={user} onClockIn={onClockIn} />
    </div>
  );
}