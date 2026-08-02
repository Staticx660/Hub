import React, { useState } from "react";
import NavRail from "@/components/mdt/shell/NavRail";
import StatusStrip from "@/components/mdt/shell/StatusStrip";
import GlobalSearch from "@/components/mdt/shell/GlobalSearch";

/**
 * The application frame every department workspace lives inside.
 * Fills the viewport exactly — no page scroll, panels scroll internally.
 */
export default function MDTShell({ agency, subtitle, unit, status, metrics, navGroups, active, onNavigate, navFooter, banner, headerRight, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="mdt fixed inset-0 flex flex-col bg-mdt-bg text-mdt-text font-body antialiased">
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
      <div className="flex flex-1 min-h-0">
        <NavRail
          items={navGroups}
          active={active}
          onSelect={onNavigate}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          footer={navFooter}
        />
        <main className="flex-1 min-w-0 flex flex-col min-h-0 bg-mdt-bg">{children}</main>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}