import React from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DepartmentsManager from "@/components/cad/DepartmentsManager";
import UnitsManager from "@/components/cad/UnitsManager";
import PersonnelManager from "@/components/cad/PersonnelManager";
import UnitGroupsManager from "@/components/cad/UnitGroupsManager";
import DiscordSettings from "@/components/cad/DiscordSettings";
import Customizer from "@/components/cad/Customizer";
import { ScrollText, Archive } from "lucide-react";

const adminTools = [
  { label: "System Logs", path: "/system-logs", icon: ScrollText, desc: "Audit trail of system actions" },
  { label: "Department Archive", path: "/department-archive", icon: Archive, desc: "Browse closed calls and past records" },
];

export default function CADAdmin() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">CAD Admin Panel</h1>
      <p className="text-sm text-slate-400 mb-6">Manage departments, units, personnel, and preset groups</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {adminTools.map(tool => (
          <Link key={tool.path} to={tool.path} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors group">
            <tool.icon className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-sm font-medium text-white">{tool.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{tool.desc}</p>
          </Link>
        ))}
      </div>

      <Tabs defaultValue="departments">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="departments" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Departments</TabsTrigger>
          <TabsTrigger value="units" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Units</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Members</TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Preset Groups</TabsTrigger>
          <TabsTrigger value="discord" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Discord</TabsTrigger>
          <TabsTrigger value="customizer" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Customizer</TabsTrigger>
        </TabsList>
        <TabsContent value="departments" className="mt-6"><DepartmentsManager /></TabsContent>
        <TabsContent value="units" className="mt-6"><UnitsManager /></TabsContent>
        <TabsContent value="members" className="mt-6"><PersonnelManager /></TabsContent>
        <TabsContent value="groups" className="mt-6"><UnitGroupsManager /></TabsContent>
        <TabsContent value="discord" className="mt-6"><DiscordSettings /></TabsContent>
        <TabsContent value="customizer" className="mt-6"><Customizer /></TabsContent>
      </Tabs>
    </div>
  );
}