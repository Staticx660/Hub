import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportBuilder from "@/components/cad/ReportBuilder";
import SimpleListManager from "@/components/cad/customizer/SimpleListManager";
import CommunitySettings from "@/components/cad/customizer/CommunitySettings";

export default function Customizer() {
  return (
    <Tabs defaultValue="reports">
      <TabsList className="bg-slate-900 border border-slate-800 flex-wrap h-auto">
        <TabsTrigger value="reports" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Reports</TabsTrigger>
        <TabsTrigger value="licenses" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Licenses</TabsTrigger>
        <TabsTrigger value="community" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Community</TabsTrigger>
        <TabsTrigger value="penal" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Penal Codes</TabsTrigger>
        <TabsTrigger value="charges" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Charge Types</TabsTrigger>
        <TabsTrigger value="bonds" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Bond Types</TabsTrigger>
        <TabsTrigger value="incidents" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">Incident Types</TabsTrigger>
      </TabsList>
      <TabsContent value="reports" className="mt-6"><ReportBuilder /></TabsContent>
      <TabsContent value="licenses" className="mt-6"><SimpleListManager entityName="CustomLicense" title="Custom Licenses" description="Create custom license types for civilians" fields={[{ name: "name", label: "License Name", type: "text", required: true }, { name: "description", label: "Description", type: "text" }, { name: "icon", label: "Icon (emoji or text)", type: "text" }]} /></TabsContent>
      <TabsContent value="community" className="mt-6"><CommunitySettings /></TabsContent>
      <TabsContent value="penal" className="mt-6"><SimpleListManager entityName="PenalCode" title="Penal Codes" description="Define penal codes with fines and jail time" fields={[{ name: "code", label: "Code", type: "text", required: true }, { name: "title", label: "Title", type: "text", required: true }, { name: "category", label: "Category", type: "text" }, { name: "description", label: "Description", type: "textarea" }, { name: "fine_amount", label: "Fine Amount ($)", type: "number" }, { name: "jail_time_months", label: "Jail Time (months)", type: "number" }]} /></TabsContent>
      <TabsContent value="charges" className="mt-6"><SimpleListManager entityName="ChargeType" title="Charge Types" description="Define charge categories for reports" fields={[{ name: "name", label: "Name", type: "text", required: true }, { name: "description", label: "Description", type: "text" }, { name: "color", label: "Color", type: "text" }]} /></TabsContent>
      <TabsContent value="bonds" className="mt-6"><SimpleListManager entityName="BondType" title="Bond Types" description="Define bond types with default amounts" fields={[{ name: "name", label: "Name", type: "text", required: true }, { name: "description", label: "Description", type: "text" }, { name: "default_amount", label: "Default Amount ($)", type: "number" }]} /></TabsContent>
      <TabsContent value="incidents" className="mt-6"><SimpleListManager entityName="IncidentType" title="Incident Types" description="Customize incident types for reports" fields={[{ name: "name", label: "Type Name", type: "text", required: true }, { name: "category", label: "Category", type: "text" }, { name: "description", label: "Description", type: "text" }, { name: "color", label: "Color", type: "text" }]} /></TabsContent>
    </Tabs>
  );
}