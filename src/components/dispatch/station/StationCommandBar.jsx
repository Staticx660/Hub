import React, { useEffect, useState } from "react";
import { Radio, Plus, RotateCw, XCircle, PanelBottom, Home, Shield, Search, LogOut } from "lucide-react";
import { Btn } from "@/components/mdt/ui/primitives";

/** Permanent command bar for the dispatch station — fixed actions, no menus, no tabs. */
export default function StationCommandBar({ onNewCall, onRefresh, onCloseCall, canClose, logCollapsed, onToggleLog, onLookups, session, onSignOff }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2 h-11 px-3 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
      <Radio className="w-4 h-4 text-mdt-accent flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold leading-tight">Dispatch Command Station</div>
        <div className="text-[10px] uppercase tracking-[0.1em] text-mdt-dim truncate">
          {session ? `${session.callsign ? session.callsign + " · " : ""}${session.user_name} · On Duty` : "Primary Channel"}
        </div>
      </div>

      <div className="ml-3 flex items-center gap-1.5">
        <Btn variant="primary" icon={Plus} onClick={onNewCall}>New Call</Btn>
        <Btn icon={RotateCw} onClick={onRefresh}>Refresh</Btn>
        <Btn variant="danger" icon={XCircle} disabled={!canClose} onClick={onCloseCall}>Close Call</Btn>
        <Btn icon={Search} onClick={onLookups}>Lookups</Btn>
        <Btn icon={PanelBottom} onClick={onToggleLog}>{logCollapsed ? "Show Log" : "Hide Log"}</Btn>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="font-mono text-[13px] text-mdt-text tabular-nums">{now.toLocaleTimeString([], { hour12: false })}</span>
        {onSignOff && <Btn variant="danger" icon={LogOut} onClick={onSignOff}>Sign Off</Btn>}
        <Btn icon={Home} onClick={() => { window.location.href = "/cad"; }}>Home</Btn>
        <Btn icon={Shield} onClick={() => { window.location.href = "/cad/admin"; }}>Admin</Btn>
      </div>
    </div>
  );
}