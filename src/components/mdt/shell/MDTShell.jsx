import React, { useState } from "react";
import MenuStrip from "@/components/mdt/shell/MenuStrip";
import TabBar from "@/components/mdt/shell/TabBar";
import ToolbarNav from "@/components/mdt/shell/ToolbarNav";
import StatusStrip from "@/components/mdt/shell/StatusStrip";
import StatusBar from "@/components/mdt/shell/StatusBar";
import GlobalSearch from "@/components/mdt/shell/GlobalSearch";

/**
 * Windows-style desktop workspace frame: menu strip, record tabs, labeled
 * toolbar, maximized content area, docked status bar. Fills the viewport.
 * `children` is a function of { detailCollapsed }.
 */
export default function MDTShell({ agency, subtitle, unit, status, metrics, navItems, active, onNavigate, tabs, activeTab, onSelectTab, onAddTab, banner, headerRight, statusBarRight, children }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailCollapsed, setDetailCollapsed] = useState(false);

  return (
    <div className="mdt fixed inset-0 flex flex-col bg-mdt-bg text-mdt-text font-body antialiased">
      <MenuStrip onSearch={() => setSearchOpen(true)} />
      {tabs && <TabBar tabs={tabs} activeTab={activeTab} onSelect={onSelectTab} onAdd={onAddTab} />}
      <ToolbarNav items={navItems} active={active} onSelect={onNavigate} />
      <StatusStrip
        agency={agency}
        subtitle={subtitle}
        unit={unit}
        status={status}
        metrics={metrics}
        onSearch={() => setSearchOpen(true)}
        right={headerRight}
      />
      {banner}
      <main className="flex-1 min-h-0 flex flex-col bg-mdt-bg">
        {typeof children === "function" ? children({ detailCollapsed }) : children}
      </main>
      <StatusBar collapsed={detailCollapsed} onToggle={() => setDetailCollapsed((c) => !c)}>
        {statusBarRight}
      </StatusBar>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}