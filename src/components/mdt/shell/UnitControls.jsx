import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Siren, Keyboard, LogOut, UserCog } from "lucide-react";

const STATUSES = ["Available", "Busy", "On Call", "Unavailable"];

/** Unit duty controls docked in the MDT status strip. */
export default function UnitControls({ session, onStatusChange, onPanic, onOpenKeybinds, onClockOut, onEditUnit }) {
  return (
    <div className="flex items-center gap-2">
      <Select value={STATUSES.includes(session.status) ? session.status : undefined} onValueChange={onStatusChange}>
        <SelectTrigger className="h-7 w-[130px] rounded-none border-mdt-line-2 bg-mdt-surface text-mdt-text text-[12.5px] shadow-none">
          <SelectValue placeholder="Set status" />
        </SelectTrigger>
        <SelectContent className="z-[100]">
          {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <button
        onClick={onPanic}
        className={`flex items-center gap-1.5 h-7 px-2 border text-[12.5px] ${session.panic_active ? "bg-red-600 border-red-500 text-white" : "bg-mdt-surface border-mdt-line-2 text-red-400 hover:bg-red-950/50"}`}
      >
        <Siren className="w-3.5 h-3.5" /> {session.panic_active ? "Clear Panic" : "Panic"}
      </button>
      <button onClick={onEditUnit} className="flex items-center gap-1.5 h-7 px-2 border border-mdt-line-2 bg-mdt-surface text-mdt-muted hover:text-mdt-text text-[12.5px]">
        <UserCog className="w-3.5 h-3.5" /> Edit Unit
      </button>
      <button onClick={onOpenKeybinds} className="flex items-center h-7 px-2 border border-mdt-line-2 bg-mdt-surface text-mdt-muted hover:text-mdt-text">
        <Keyboard className="w-3.5 h-3.5" />
      </button>
      <button onClick={onClockOut} className="flex items-center gap-1.5 h-7 px-2 border border-mdt-line-2 bg-mdt-surface text-mdt-muted hover:text-mdt-text text-[12.5px]">
        <LogOut className="w-3.5 h-3.5" /> Clock Out
      </button>
    </div>
  );
}