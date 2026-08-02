import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MDTShell from "@/components/mdt/shell/MDTShell";
import { AlertBanner } from "@/components/mdt/shell/StatusStrip";
import UnitControls from "@/components/mdt/shell/UnitControls";
import CallQueueWorkspace from "@/components/mdt/workspaces/police/CallQueueWorkspace";
import UnitBoardWorkspace from "@/components/mdt/workspaces/police/UnitBoardWorkspace";
import MyCallWorkspace from "@/components/mdt/workspaces/police/MyCallWorkspace";
import ApparatusWorkspace from "@/components/mdt/workspaces/ops/ApparatusWorkspace";
import PCRWorkspace from "@/components/mdt/workspaces/ops/PCRWorkspace";
import RecordsWorkspace from "@/components/mdt/workspaces/police/RecordsWorkspace";
import { Radio as RadioIcon, Users, PhoneCall, Truck, FileText, ClipboardList } from "lucide-react";

const VIEW_LABELS = { incidents: "Incidents", personnel: "Personnel", mycall: "My Call", apparatus: "Apparatus", reports: "Reports", pcr: "PCR" };

/**
 * Shared enterprise workspace shell for Fire & EMS operations boards.
 * Business logic (sessions, status, panic, clock-out) stays in the page.
 */
export default function OpsBoardShell({
  department, session, setSession, subtitle,
  onStatusChange, onPanic, onClockOut, onNewCall,
  selectedCallId, setSelectedCallId,
}) {
  const navigate = useNavigate();
  const [openTabs, setOpenTabs] = useState(["incidents"]);
  const [activeView, setActiveView] = useState("incidents");
  const [newFileRequest, setNewFileRequest] = useState(0);
  const hasPCR = department.category === "EMS";
  const viewLabels = Object.fromEntries(Object.entries(VIEW_LABELS).filter(([k]) => hasPCR || k !== "pcr"));

  const openView = (key) => {
    setOpenTabs((tabs) => (tabs.includes(key) ? tabs : [...tabs, key]));
    setActiveView(key);
  };

  const closeTab = (key) => {
    setOpenTabs((tabs) => {
      if (tabs.length <= 1) return tabs;
      const next = tabs.filter((t) => t !== key);
      if (activeView === key) setActiveView(next[Math.max(0, tabs.indexOf(key) - 1)]);
      return next;
    });
  };

  const buildMenus = ({ openSearch, toggleDetail, detailCollapsed }) => [
    {
      label: "File",
      items: [
        { label: "New Call…", onSelect: () => { openView("mycall"); onNewCall(); } },
        { label: "New Report…", shortcut: "Ctrl+N", onSelect: () => { openView("reports"); setNewFileRequest((n) => n + 1); } },
        ...(hasPCR ? [{ label: "New PCR…", onSelect: () => openView("pcr") }] : []),
        { label: "Global Search…", shortcut: "Ctrl+K", onSelect: openSearch },
        { separator: true },
        { label: "Clock Out & End Shift", onSelect: onClockOut, danger: true },
        { label: "Close Board", onSelect: () => navigate("/cad") },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Copy Callsign", onSelect: () => navigator.clipboard?.writeText(session.callsign || ""), disabled: !session.callsign },
        { separator: true },
        { label: "Set Status: Available", onSelect: () => onStatusChange("Available") },
        { label: "Set Status: Busy", onSelect: () => onStatusChange("Busy") },
        { label: "Set Status: Unavailable", onSelect: () => onStatusChange("Unavailable") },
        { separator: true },
        { label: session.panic_active ? "Clear Panic" : "Activate Panic", onSelect: onPanic, danger: true },
      ],
    },
    {
      label: "View",
      items: [
        ...Object.keys(viewLabels).map((k) => ({ label: viewLabels[k], onSelect: () => openView(k) })),
        { separator: true },
        { label: detailCollapsed ? "Show Status Detail" : "Hide Status Detail", onSelect: toggleDetail },
        { label: "Reload Workspace", onSelect: () => window.location.reload() },
      ],
    },
    {
      label: "Window",
      items: [
        { label: "CAD Home", onSelect: () => navigate("/cad") },
        { label: "My Records", onSelect: () => navigate("/my-records") },
      ],
    },
    {
      label: "Help",
      items: [{ label: "Help Center", onSelect: () => navigate("/help") }],
    },
  ];

  return (
    <MDTShell
      agency={department.name}
      subtitle={subtitle}
      unit={`${session.callsign ? session.callsign + " · " : ""}${session.user_name}${session.rank ? " · " + session.rank : ""}`}
      status={{ label: session.panic_active ? "PANIC" : session.status }}
      navItems={[
        { key: "incidents", label: "Incidents", icon: RadioIcon },
        { key: "personnel", label: "Personnel", icon: Users },
        { key: "mycall", label: "My Call", icon: PhoneCall },
        { key: "apparatus", label: "Apparatus", icon: Truck },
        { key: "reports", label: "Reports", icon: FileText },
        ...(hasPCR ? [{ key: "pcr", label: "PCR", icon: ClipboardList }] : []),
      ]}
      active={activeView}
      onNavigate={openView}
      menus={buildMenus}
      tabs={openTabs.map((k) => ({ key: k, label: viewLabels[k] || VIEW_LABELS[k] }))}
      activeTab={activeView}
      onSelectTab={setActiveView}
      onAddTab={openView}
      onCloseTab={closeTab}
      tabAddOptions={Object.keys(viewLabels).filter((k) => !openTabs.includes(k)).map((k) => ({ key: k, label: viewLabels[k] }))}
      banner={session.panic_active ? <AlertBanner>PANIC ACTIVE — {session.callsign || session.user_name} — ALL UNITS RESPOND</AlertBanner> : null}
      headerRight={
        <UnitControls
          session={session}
          onStatusChange={onStatusChange}
          onPanic={onPanic}
          onOpenKeybinds={() => navigate("/keybinds")}
          onClockOut={onClockOut}
        />
      }
    >
      {({ detailCollapsed }) => (
        activeView === "incidents" ? (
          <CallQueueWorkspace
            department={department}
            session={session}
            setSession={setSession}
            onOpenCall={(id) => { setSelectedCallId(id); openView("mycall"); }}
            detailCollapsed={detailCollapsed}
          />
        ) : activeView === "personnel" ? (
          <UnitBoardWorkspace session={session} setSession={setSession} />
        ) : activeView === "apparatus" ? (
          <ApparatusWorkspace department={department} session={session} />
        ) : activeView === "reports" ? (
          <RecordsWorkspace department={department} session={session} newFileRequest={newFileRequest} />
        ) : activeView === "pcr" && hasPCR ? (
          <PCRWorkspace department={department} session={session} />
        ) : (
          <MyCallWorkspace
            department={department}
            session={session}
            setSession={setSession}
            selectedCallId={selectedCallId}
            setSelectedCallId={setSelectedCallId}
            setActiveView={(v) => openView(v === "dispatch" ? "incidents" : v)}
          />
        )
      )}
    </MDTShell>
  );
}