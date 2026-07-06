import React, { useState } from "react";
import { Link } from "react-router-dom";
import UnitsManager from "@/components/cad/UnitsManager";
import PersonnelManager from "@/components/cad/PersonnelManager";
import DiscordSettings from "@/components/cad/DiscordSettings";
import SimpleListManager from "@/components/cad/customizer/SimpleListManager";
import CommunityInfoManager from "@/components/cad/customizer/CommunityInfoManager";
import AddressesManager from "@/components/cad/customizer/AddressesManager";
import UserRestrictionsManager from "@/components/cad/customizer/UserRestrictionsManager";
import NotificationTonesManager from "@/components/cad/customizer/NotificationTonesManager";
import PenalCodesManager from "@/components/cad/PenalCodesManager";
import DepartmentsGroupsManager from "@/components/cad/DepartmentsGroupsManager";
import PermissionsManager from "@/components/cad/PermissionsManager";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Users, IdCard, Settings, Building2, MapPin, Gavel, ShieldCheck, Bell, Award, AlertTriangle, MessageCircle, ScrollText, ArrowLeft, KeyRound, Crown } from "lucide-react";
import SystemLogs from "@/pages/SystemLogs";

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
    { id: "licenses", label: "Licenses", icon: Award, access: "admin" },
    { id: "incidents", label: "Incident Types", icon: AlertTriangle, access: "supervisor" },
  ]},
  { title: "ADVANCED", items: [
    { id: "discord", label: "Discord", icon: MessageCircle, access: "admin" },
    { id: "logs", label: "Logs", icon: ScrollText, access: "admin" },
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
      case "members": return <PersonnelManager />;
      case "permissions": return <PermissionsManager />;
      case "identifiers": return <UnitsManager />;
      case "community": return <CommunityInfoManager />;
      case "departments": return <DepartmentsGroupsManager />;
      case "addresses": return <AddressesManager />;
      case "penal": return <PenalCodesManager />;
      case "restrictions": return <UserRestrictionsManager />;
      case "tones": return <NotificationTonesManager />;
      case "licenses": return <SimpleListManager entityName="CustomLicense" title="Custom Licenses" description="Create custom license types for civilians" fields={[{ name: "name", label: "License Name", type: "text", required: true }, { name: "description", label: "Description", type: "text" }, { name: "icon", label: "Icon (emoji or text)", type: "text" }]} />;
      case "incidents": return <SimpleListManager entityName="IncidentType" title="Incident Types" description="Customize incident types for reports" fields={[{ name: "name", label: "Type Name", type: "text", required: true }, { name: "category", label: "Category", type: "text" }, { name: "description", label: "Description", type: "text" }, { name: "color", label: "Color", type: "color" }]} />;
      case "discord": return <DiscordSettings />;
      case "logs": return <SystemLogs />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden cad-gradient-bg cad-font">
      <aside className="w-60 flex-shrink-0 h-full cad-glass border-r border-cad-border/50 flex flex-col">
        <div className="p-4 border-b border-cad-border/50">
          <Link to="/cad" className="flex items-center gap-2 text-sm text-cad-muted hover:text-cad-text transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to CAD
          </Link>
          <h1 className="font-bold text-cad-text text-lg">CAD Admin</h1>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {isPlatformAdmin && <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20"><Crown className="w-2.5 h-2.5" /> Platform Admin</span>}
            {isCADAdmin && <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20"><ShieldCheck className="w-2.5 h-2.5" /> CAD Admin</span>}
            {isSupervisor && <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"><ShieldCheck className="w-2.5 h-2.5" /> Supervisor</span>}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto cad-scroll py-2">
          {visibleSections.map(section => (
            <div key={section.title} className="mb-2">
              <p className="px-4 py-1.5 text-[10px] font-bold text-cad-dim uppercase tracking-wider">{section.title}</p>
              {section.items.map(item => (
                <button key={item.id} onClick={() => setActive(item.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors border-l-2 ${effectiveActive === item.id ? "bg-cad-accent/10 text-cad-accent border-cad-accent" : "text-cad-muted hover:bg-cad-surface-2/50 hover:text-cad-text border-transparent"}`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" /> {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto cad-scroll p-4 lg:p-8">
        {renderPanel()}
      </main>
    </div>
  );
}