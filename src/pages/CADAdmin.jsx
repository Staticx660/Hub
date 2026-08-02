import React, { useState } from "react";
import RegisteredUsersManager from "@/components/cad/RegisteredUsersManager";
import DiscordMembersManager from "@/components/cad/DiscordMembersManager";
import DiscordSettings from "@/components/cad/DiscordSettings";
import CommunityInfoManager from "@/components/cad/customizer/CommunityInfoManager";
import AddressesManager from "@/components/cad/customizer/AddressesManager";
import UserRestrictionsManager from "@/components/cad/customizer/UserRestrictionsManager";
import NotificationTonesManager from "@/components/cad/customizer/NotificationTonesManager";
import DangerZoneManager from "@/components/cad/customizer/DangerZoneManager";
import PenalCodesManager from "@/components/cad/PenalCodesManager";
import DepartmentsGroupsManager from "@/components/cad/DepartmentsGroupsManager";
import PermissionsManager from "@/components/cad/PermissionsManager";
import AutoDispatchManager from "@/components/cad/AutoDispatchManager";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import AdminRail from "@/components/cad/admin/AdminRail";
import { Users, IdCard, Settings, Building2, MapPin, Gavel, ShieldCheck, Bell, MessageCircle, ScrollText, KeyRound, Trash2, Bot } from "lucide-react";
import SystemLogs from "@/pages/SystemLogs";
import { APP_VERSION } from "@/lib/version";

// access: "supervisor" = visible to supervisors+, "admin" = visible to CAD/platform admins only
const ALL_SECTIONS = [
  { title: "ACCOUNTS", items: [
    { id: "members", label: "Members", icon: Users, access: "supervisor" },
    { id: "permissions", label: "Role Permissions", icon: KeyRound, access: "admin" },
    { id: "identifiers", label: "Identifiers", icon: IdCard, access: "admin" },
  ]},
  { title: "CUSTOMIZATION", items: [
    { id: "community", label: "Community Info", icon: Settings, access: "admin" },
    { id: "departments", label: "Departments", icon: Building2, access: "supervisor" },
    { id: "addresses", label: "Addresses", icon: MapPin, access: "supervisor" },
    { id: "penal", label: "Penal Codes", icon: Gavel, access: "admin" },
    { id: "restrictions", label: "User Restrictions", icon: ShieldCheck, access: "admin" },
    { id: "tones", label: "Notification Tones", icon: Bell, access: "admin" },
  ]},
  { title: "ADVANCED", items: [
    { id: "autodispatch", label: "Auto Dispatch", icon: Bot, access: "admin" },
    { id: "discord", label: "Discord", icon: MessageCircle, access: "admin" },
    { id: "logs", label: "Logs", icon: ScrollText, access: "admin" },
    { id: "danger", label: "Danger Zone", icon: Trash2, access: "admin" },
  ]},
];

export default function CADAdmin() {
  const { isPlatformAdmin, isCADAdmin, isSupervisor } = useUserPermissions();
  const canSeeAdminSections = isPlatformAdmin || isCADAdmin;
  const [active, setActive] = useState(null);

  const visibleSections = ALL_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.access === "admin") return canSeeAdminSections;
      return canSeeAdminSections || isSupervisor;
    }),
  })).filter((s) => s.items.length > 0);

  // Auto-select first visible item if nothing selected yet or current selection is now hidden
  const allVisibleIds = visibleSections.flatMap((s) => s.items.map((i) => i.id));
  const effectiveActive = active && allVisibleIds.includes(active) ? active : (allVisibleIds[0] || null);

  const renderPanel = () => {
    switch (effectiveActive) {
      case "members": return <RegisteredUsersManager />;
      case "permissions": return <PermissionsManager />;
      case "identifiers": return <DiscordMembersManager />;
      case "community": return <CommunityInfoManager />;
      case "departments": return <DepartmentsGroupsManager />;
      case "addresses": return <AddressesManager />;
      case "penal": return <PenalCodesManager />;
      case "restrictions": return <UserRestrictionsManager />;
      case "tones": return <NotificationTonesManager />;
      case "autodispatch": return <AutoDispatchManager />;
      case "discord": return <DiscordSettings />;
      case "logs": return <SystemLogs />;
      case "danger": return <DangerZoneManager />;
      default: return null;
    }
  };

  const activeLabel = visibleSections.flatMap(s => s.items).find(i => i.id === effectiveActive)?.label || "";

  return (
    <div className="mdt fixed inset-0 flex bg-mdt-bg text-mdt-text">
      <AdminRail
        sections={visibleSections}
        active={effectiveActive}
        onSelect={setActive}
        isPlatformAdmin={isPlatformAdmin}
        isCADAdmin={isCADAdmin}
        isSupervisor={isSupervisor}
      />
      <main className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="flex items-center gap-2 h-11 px-3 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
          <span className="text-[12.5px] font-semibold truncate">{activeLabel}</span>
          <span className="ml-auto text-[11px] font-mono uppercase tracking-wide text-mdt-dim">Admin Console</span>
          <span className="text-[11px] font-mono text-mdt-dim border-l border-mdt-line pl-2">v{APP_VERSION}</span>
        </div>
        <div className="flex-1 min-h-0 overflow-auto mdt-scroll p-3">
          {renderPanel()}
        </div>
      </main>
    </div>
  );
}