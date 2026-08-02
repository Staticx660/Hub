import React from "react";
import { PanelBottomClose, PanelBottomOpen } from "lucide-react";

/** Docked bottom status bar. */
export default function StatusBar({ collapsed, onToggle, children }) {
  return (
    <div className="flex items-center gap-2 h-7 px-2 bg-mdt-bg border-t border-mdt-line flex-shrink-0">
      <button onClick={onToggle} className="flex items-center gap-1.5 h-5 px-1 text-[12px] text-mdt-muted hover:text-mdt-text">
        {collapsed ? <PanelBottomOpen className="w-3.5 h-3.5" /> : <PanelBottomClose className="w-3.5 h-3.5" />}
        {collapsed ? "Expand" : "Collapse"}
      </button>
      <div className="flex-1" />
      {children}
    </div>
  );
}