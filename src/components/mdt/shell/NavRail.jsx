import React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

/**
 * Adaptive navigation rail. Each department supplies its own items, so Police
 * never shows Fire tools and Dispatch never shows patrol shortcuts.
 * Collapses to a 44px icon rail to give the workspace the full screen.
 */
export default function NavRail({ items, active, onSelect, collapsed, onToggle, footer }) {
  return (
    <nav className={`flex flex-col flex-shrink-0 bg-mdt-surface border-r border-mdt-line ${collapsed ? "w-11" : "w-[188px]"}`}>
      <div className="flex-1 min-h-0 overflow-auto mdt-scroll py-1">
        {items.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <div className="px-2.5 pt-2 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">{group.label}</div>
            )}
            {group.items.map((it) => {
              const isActive = active === it.key;
              return (
                <button
                  key={it.key}
                  onClick={() => onSelect(it.key)}
                  title={collapsed ? it.label : undefined}
                  className={`w-full flex items-center gap-2 h-7 px-2.5 text-[12px] font-medium transition-colors ${
                    isActive
                      ? "bg-mdt-accent/15 text-mdt-text shadow-[inset_2px_0_0_hsl(var(--mdt-accent))]"
                      : "text-mdt-muted hover:bg-mdt-surface-3 hover:text-mdt-text"
                  }`}
                >
                  <it.icon className="w-[15px] h-[15px] flex-shrink-0" />
                  {!collapsed && <span className="truncate">{it.label}</span>}
                  {!collapsed && it.count > 0 && (
                    <span className="ml-auto text-[10px] font-semibold text-mdt-dim">{it.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {footer && !collapsed && <div className="border-t border-mdt-line p-1.5">{footer}</div>}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 h-7 px-2.5 border-t border-mdt-line text-[11px] text-mdt-dim hover:text-mdt-text hover:bg-mdt-surface-3"
      >
        {collapsed ? <PanelLeftOpen className="w-[15px] h-[15px]" /> : <><PanelLeftClose className="w-[15px] h-[15px]" /> Collapse</>}
      </button>
    </nav>
  );
}