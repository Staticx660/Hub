import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UnitsManager from "@/components/cad/UnitsManager";
import PersonnelManager from "@/components/cad/PersonnelManager";
import DiscordSettings from "@/components/cad/DiscordSettings";
import ReportBuilder from "@/components/cad/ReportBuilder";
import SimpleListManager from "@/components/cad/customizer/SimpleListManager";
import CommunityInfoManager from "@/components/cad/customizer/CommunityInfoManager";
import AddressesManager from "@/components/cad/customizer/AddressesManager";
import UserRestrictionsManager from "@/components/cad/customizer/UserRestrictionsManager";
import NotificationTonesManager from "@/components/cad/customizer/NotificationTonesManager";
import PenalCodesManager from "@/components/cad/PenalCodesManager";
import DepartmentsGroupsManager from "@/components/cad/DepartmentsGroupsManager";
import { Users, IdCard, Settings, FileText, Building2, MapPin, Gavel, ShieldCheck, Bell, Award, AlertTriangle, MessageCircle, ScrollText } from "lucide-react";

const SECTIONS = [
  { title: "ACCOUNTS", items: [
    { id: "members", label: "Members", icon: Users },
    { id: "identifiers", label: "Identifiers", icon: IdCard },
  ]},
  { title: "CUSTOMIZATION", items: [
    { id: "community", label: "Community Info", icon: Settings },
    { id: "records", label: "Custom Records", icon: FileText },
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "penal", label: "Penal Codes", icon: Gavel },
    { id: "restrictions", label: "User Restrictions", icon: ShieldCheck },
    { id: "tones", label: "Notification Tones", icon: Bell },
    { id: "licenses", label: "Licenses", icon: Award },
    { id: "incidents", label: "Incident Types", icon: AlertTriangle },
  ]},
  { title: "ADVANCED", items: [
    { id: "discord", label: "Discord", icon: MessageCircle },
    { id: "logs", label: "Logs", icon: ScrollText, link: "/system-logs" },
  ]},
];

export default function CADAdmin() {
  const [active, setActive] = useState("community");
  const navigate = useNavigate();

  const renderPanel = () => {
    switch (active) {
      case "members": return <PersonnelManager />;
      case "identifiers": return <UnitsManager />;
      case "community": return <CommunityInfoManager />;
      case "records": return <ReportBuilder />;
      case "departments": return <DepartmentsGroupsManager />;
      case "addresses": return <AddressesManager />;
      case "penal": return <PenalCodesManager />;
      case "restrictions": return <UserRestrictionsManager />;
      case "tones": return <NotificationTonesManager />;
      case "licenses": return <SimpleListManager entityName="CustomLicense" title="Custom Licenses" description="Create custom license types for civilians" fields={[{ name: "name", label: "License Name", type: "text", required: true }, { name: "description", label: "Description", type: "text" }, { name: "icon", label: "Icon (emoji or text)", type: "text" }]} />;
      case "incidents": return <SimpleListManager entityName="IncidentType" title="Incident Types" description="Customize incident types for reports" fields={[{ name: "name", label: "Type Name", type: "text", required: true }, { name: "category", label: "Category", type: "text" }, { name: "description", label: "Description", type: "text" }, { name: "color", label: "Color", type: "text" }]} />;
      case "discord": return <DiscordSettings />;
      default: return null;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">CAD Admin Panel</h1>
      <p className="text-sm text-slate-400 mb-6">Central hub for all CAD management</p>
      <div className="flex gap-6">
        <aside className="w-56 flex-shrink-0 sticky top-6 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-xl py-2">
            {SECTIONS.map(section => (
              <div key={section.title} className="mb-2">
                <p className="px-4 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">{section.title}</p>
                {section.items.map(item => (
                  <button key={item.id} onClick={() => item.link ? navigate(item.link) : setActive(item.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${active === item.id ? "bg-slate-800 text-white border-l-2 border-cyan-500" : "text-slate-400 hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent"}`}>
                    <item.icon className="w-4 h-4 flex-shrink-0" /> {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          {renderPanel()}
        </main>
      </div>
    </div>
  );
}