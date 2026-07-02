import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DepartmentsManager from "@/components/cad/DepartmentsManager";
import UnitsManager from "@/components/cad/UnitsManager";
import PersonnelManager from "@/components/cad/PersonnelManager";
import UnitGroupsManager from "@/components/cad/UnitGroupsManager";
import DiscordSettings from "@/components/cad/DiscordSettings";

export default function CADAdmin() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">CAD Admin Panel</h1>
      <p className="text-sm text-slate-400 mb-6">Manage departments, units, personnel, and preset groups</p>
      <Tabs defaultValue="departments">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="departments" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Departments</TabsTrigger>
          <TabsTrigger value="units" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Units</TabsTrigger>
          <TabsTrigger value="personnel" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Personnel</TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Preset Groups</TabsTrigger>
          <TabsTrigger value="discord" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Discord</TabsTrigger>
        </TabsList>
        <TabsContent value="departments" className="mt-6"><DepartmentsManager /></TabsContent>
        <TabsContent value="units" className="mt-6"><UnitsManager /></TabsContent>
        <TabsContent value="personnel" className="mt-6"><PersonnelManager /></TabsContent>
        <TabsContent value="groups" className="mt-6"><UnitGroupsManager /></TabsContent>
        <TabsContent value="discord" className="mt-6"><DiscordSettings /></TabsContent>
      </Tabs>
    </div>
  );
}