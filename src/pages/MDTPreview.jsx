import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import MDTShell from "@/components/mdt/shell/MDTShell";
import { AlertBanner } from "@/components/mdt/shell/StatusStrip";
import CallsWorkspace from "@/components/mdt/workspaces/CallsWorkspace";
import UnitsWorkspace from "@/components/mdt/workspaces/UnitsWorkspace";
import { EmptyState } from "@/components/mdt/ui/primitives";
import { Radio, Users, Search, FileText, Gavel, Eye, Car, Boxes, Loader2, LayoutGrid } from "lucide-react";

/**
 * Design-language preview: the Windows-style MDT workspace running against
 * live CAD data. Department-specific workflows build on this frame.
 */
export default function MDTPreview() {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("calls");

  useEffect(() => {
    let live = true;
    const load = async () => {
      const [c, s] = await Promise.all([
        base44.entities.ActiveCall.list("-created_date", 200),
        base44.entities.CADSession.filter({ is_active: true }),
      ]);
      if (!live) return;
      setCalls(c);
      setSessions(s);
      setLoading(false);
    };
    load();
    const id = setInterval(load, 15000);
    return () => { live = false; clearInterval(id); };
  }, []);

  const pending = calls.filter((c) => c.status === "Pending").length;
  const active = calls.filter((c) => c.status === "Active").length;
  const panic = sessions.filter((s) => s.panic_active);

  const navItems = [
    { key: "calls", label: "Calls", icon: Radio },
    { key: "units", label: "Units", icon: Users },
    { key: "people", label: "People", icon: Search },
    { key: "vehicles", label: "Vehicles", icon: Car },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "warrants", label: "Warrants", icon: Gavel },
    { key: "bolos", label: "BOLOs", icon: Eye },
    { key: "evidence", label: "Evidence", icon: Boxes },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-mdt-bg">
        <Loader2 className="w-5 h-5 text-mdt-dim animate-spin" />
      </div>
    );
  }

  return (
    <MDTShell
      agency="OCRP Hub"
      subtitle="MDT Design Preview"
      unit={user?.full_name}
      status={{ label: "Preview" }}
      metrics={[
        { label: "Pending", value: pending, alert: pending > 0 },
        { label: "Active", value: active },
        { label: "On Duty", value: sessions.length },
      ]}
      navItems={navItems}
      active={view}
      onNavigate={setView}
      tabs={[{ key: "active-calls", label: "Active Calls" }]}
      activeTab="active-calls"
      onSelectTab={() => {}}
      banner={panic.length > 0 ? <AlertBanner>PANIC — {panic.map((p) => p.callsign || p.user_name).join(", ")}</AlertBanner> : null}
    >
      {({ detailCollapsed }) =>
        view === "calls" ? (
          <CallsWorkspace calls={calls} sessions={sessions} deptName="All departments" detailCollapsed={detailCollapsed} />
        ) : view === "units" ? (
          <UnitsWorkspace sessions={sessions} calls={calls} />
        ) : (
          <EmptyState icon={LayoutGrid} title="Workspace not built yet" hint="Approve this design language and I'll build each department's workflow on it." />
        )
      }
    </MDTShell>
  );
}