import React from "react";
import { Plus } from "lucide-react";

/** Horizontal record tab bar. Active tab is marked by a teal top edge. */
export default function TabBar({ tabs, activeTab, onSelect, onAdd }) {
  return (
    <div className="flex items-end h-9 px-1.5 bg-mdt-bg border-b border-mdt-line flex-shrink-0">
      {tabs.map((t) => {
        const active = t.key === activeTab;
        return (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            className={`h-8 px-4 text-[13px] border-l border-r border-t ${
              active
                ? "bg-mdt-surface text-mdt-text border-mdt-line border-t-2 border-t-mdt-accent font-medium"
                : "bg-mdt-bg text-mdt-dim border-transparent hover:text-mdt-muted"
            }`}
          >
            {t.label}
          </button>
        );
      })}
      <button onClick={onAdd} className="h-8 w-8 flex items-center justify-center text-mdt-dim hover:text-mdt-text">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}