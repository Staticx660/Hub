import React, { useState, useEffect } from "react";
import ShellMenu from "@/components/mdt/shell/ShellMenu";
import GlobalSearch from "@/components/mdt/shell/GlobalSearch";
import { Search } from "lucide-react";

/**
 * Keystone layout — a wide station banner, full-width segmented navigation,
 * and the unit duty controls docked to a bottom command bar. Same props and
 * contract as MDTShell; only the arrangement of chrome differs.
 */
export default function KeystoneShell({ agency, subtitle, unit, status, metrics = [], navItems = [], active, onNavigate, tabs, activeTab, onSelectTab, onAddTab, onCloseTab, tabAddOptions, menus, banner, headerRight, children }) {
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
    <div className="mdt fixed inset-0 flex flex-col bg-mdt-bg text-mdt-text font-body antialiased">
      {/* Station banner */}
      <header className="flex items-center gap-2 sm:gap-4 h-14 px-2 sm:px-4 bg-mdt-surface border-b-2 border-mdt-accent flex-shrink-0 overflow-x-auto mdt-scroll">
        <div className="min-w-0">
          <p className="text-[15px] font-bold uppercase tracking-[0.06em] text-mdt-text truncate">{agency}</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-mdt-dim truncate">{subtitle}</p>
        </div>
        <div className="h-8 w-px bg-mdt-line-2 hidden sm:block" />
        <div className="min-w-0 hidden sm:block">
          <p className="text-[13px] text-mdt-text truncate">{unit || "—"}</p>
          {status && (
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-mdt-accent">{status.label}</p>
          )}
        </div>
        <div className="hidden lg:flex items-center gap-5 ml-4">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <p className={`text-[16px] font-bold tabular-nums leading-none ${m.alert ? "text-red-400" : "text-mdt-text"}`}>{m.value}</p>
              <p className="text-[9.5px] uppercase tracking-[0.1em] text-mdt-dim mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 h-7 px-2.5 border border-mdt-line-2 bg-mdt-surface-2 text-mdt-dim hover:text-mdt-muted flex-shrink-0">
          <Search className="w-3.5 h-3.5" /> <span className="text-[12.5px] hidden md:inline">Search</span>
        </button>
        <ShellMenu menus={menuItems} label="Commands" className="flex-shrink-0" />
        <span className="text-[15px] font-bold text-mdt-text tabular-nums hidden md:inline flex-shrink-0">{clock}</span>
      </header>

      {/* Segmented navigation */}
      <nav className="flex items-stretch bg-mdt-surface-2 border-b border-mdt-line flex-shrink-0">
        {navItems.map((it) => {
          const on = it.key === active;
          return (
            <button
              key={it.key}
              onClick={() => onNavigate(it.key)}
              className={`flex-1 min-w-[64px] flex items-center justify-center gap-2 h-10 text-[11.5px] lg:text-[12.5px] font-semibold uppercase tracking-[0.07em] border-r border-mdt-line last:border-r-0 ${
                on ? "bg-mdt-accent/20 text-mdt-text border-b-2 border-b-mdt-accent" : "text-mdt-muted hover:bg-mdt-surface-3 hover:text-mdt-text"
              }`}
            >
              <it.icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">{it.label}</span>
            </button>
          );
        })}
      </nav>

      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-1 h-8 px-2 bg-mdt-bg border-b border-mdt-line flex-shrink-0">
          {tabs.map((t) => {
            const on = t.key === activeTab;
            return (
              <div
                key={t.key}
                onClick={() => onSelectTab(t.key)}
                className={`group flex items-center gap-1.5 h-6 px-2.5 text-[12px] cursor-pointer select-none border ${
                  on ? "bg-mdt-surface-3 text-mdt-text border-mdt-line-2" : "bg-transparent text-mdt-dim border-transparent hover:text-mdt-muted"
                }`}
              >
                {t.label}
                {onCloseTab && tabs.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onCloseTab(t.key); }}
                    className="text-mdt-dim opacity-0 group-hover:opacity-100 hover:text-mdt-text"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          {onAddTab && (tabAddOptions || []).length > 0 && (
            <button onClick={() => onAddTab()} className="h-6 w-6 text-mdt-dim hover:text-mdt-text">+</button>
          )}
        </div>
      )}

      {banner}

      <main className="flex-1 min-h-0 flex flex-col bg-mdt-bg">
        {typeof children === "function" ? children({ detailCollapsed }) : children}
      </main>

      {/* Docked command bar */}
      <div className="flex items-center gap-3 min-h-[44px] px-2 sm:px-3 bg-mdt-surface border-t border-mdt-line flex-shrink-0 overflow-x-auto mdt-scroll">
        <button onClick={() => setDetailCollapsed((c) => !c)} className="text-[11.5px] text-mdt-muted hover:text-mdt-text whitespace-nowrap flex-shrink-0">
          {detailCollapsed ? "Expand Detail" : "Collapse Detail"}
        </button>
        <div className="flex-1" />
        {headerRight}
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}