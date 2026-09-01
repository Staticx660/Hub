import React, { useState, useEffect } from "react";
import ShellMenu from "@/components/mdt/shell/ShellMenu";
import GlobalSearch from "@/components/mdt/shell/GlobalSearch";
import { Search } from "lucide-react";

/**
 * Metro layout — vertical navigation rail on the left, a tall unit header
 * across the top, no menu strip or record tabs. Same props/contract as
 * MDTShell; only the arrangement of chrome differs.
 */
export default function MetroShell({ agency, subtitle, unit, status, metrics = [], navItems = [], active, onNavigate, menus, banner, headerRight, children }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailCollapsed, setDetailCollapsed] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const menuItems = typeof menus === "function"
    ? menus({ openSearch: () => setSearchOpen(true), toggleDetail: () => setDetailCollapsed((c) => !c), detailCollapsed })
    : menus || [];

  return (
    <div className="mdt fixed inset-0 flex bg-mdt-bg text-mdt-text font-body antialiased">
      {/* Navigation rail — icon-only on narrow viewports / small iframes */}
      <aside className="w-[52px] lg:w-[168px] flex-shrink-0 flex flex-col bg-mdt-surface border-r border-mdt-line">
        <div className="px-2 lg:px-3 py-3 border-b border-mdt-line">
          <p className="text-[13px] font-semibold leading-tight truncate hidden lg:block">{agency}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-mdt-dim truncate hidden lg:block">{subtitle}</p>
          <p className="text-[12px] font-bold text-center lg:hidden">{(agency || "?").slice(0, 2).toUpperCase()}</p>
        </div>
        <nav className="flex-1 min-h-0 overflow-auto mdt-scroll p-2 space-y-1">
          {navItems.map((it) => {
            const on = it.key === active;
            return (
              <button
                key={it.key}
                onClick={() => onNavigate(it.key)}
                title={it.label}
                className={`w-full flex items-center justify-center lg:justify-start gap-2.5 h-9 px-1.5 lg:px-2.5 rounded-[var(--cad-radius)] text-[12.5px] ${
                  on
                    ? "bg-mdt-accent text-white"
                    : "text-mdt-muted hover:bg-mdt-surface-3 hover:text-mdt-text"
                }`}
              >
                <it.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate hidden lg:inline">{it.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-mdt-line space-y-2">
          {metrics.map((m) => (
            <div key={m.label} title={m.label} className="flex items-baseline justify-center lg:justify-between">
              <span className="text-[10px] uppercase tracking-[0.08em] text-mdt-dim hidden lg:inline">{m.label}</span>
              <span className={`text-[13px] tabular-nums ${m.alert ? "text-red-400" : "text-mdt-text"}`}>{m.value}</span>
            </div>
          ))}
          <div className="text-[11px] text-mdt-dim tabular-nums text-center pt-1 hidden lg:block">{clock}</div>
        </div>
      </aside>

      {/* Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 bg-mdt-surface-2 border-b border-mdt-line flex-shrink-0 overflow-x-auto mdt-scroll">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-mdt-text truncate">{unit || agency}</p>
            {status && (
              <span className="inline-flex items-center h-[18px] px-1.5 mt-0.5 rounded-[var(--cad-radius)] bg-mdt-accent/20 text-mdt-accent text-[10.5px] font-semibold uppercase tracking-wide">
                {status.label}
              </span>
            )}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 h-7 px-2.5 xl:w-[200px] border border-mdt-line-2 bg-mdt-surface text-mdt-dim hover:text-mdt-muted rounded-[var(--cad-radius)] flex-shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[12.5px] hidden xl:inline">Search everything</span>
          </button>
          {headerRight}
          <ShellMenu menus={menuItems} />
        </header>
        {banner}
        <main className="flex-1 min-h-0 flex flex-col bg-mdt-bg">
          {typeof children === "function" ? children({ detailCollapsed }) : children}
        </main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}