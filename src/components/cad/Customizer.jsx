import React, { useState } from "react";
import ReportBuilder from "@/components/cad/ReportBuilder";
import SimpleListManager from "@/components/cad/customizer/SimpleListManager";
import CommunitySettings from "@/components/cad/customizer/CommunitySettings";

const TABS = [
  { key: "reports", label: "Reports" },
  { key: "licenses", label: "Licenses" },
  { key: "community", label: "Community" },
  { key: "penal", label: "Penal Codes" },
  { key: "charges", label: "Charge Types" },
  { key: "bonds", label: "Bond Types" },
  { key: "incidents", label: "Incident Types" },
];

export default function Customizer() {
  const [tab, setTab] = useState("reports");

  return (
    <div className="mdt space-y-2.5 text-mdt-text">
      <div className="flex items-center gap-px h-9 px-px border border-mdt-line bg-mdt-surface-2 overflow-x-auto mdt-scroll">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-full px-3 text-[11.5px] font-medium whitespace-nowrap border-b-2 ${tab === t.key ? "border-mdt-accent text-mdt-text bg-mdt-surface" : "border-transparent text-mdt-muted hover:text-mdt-text"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reports" && <ReportBuilder />}
      {tab === "licenses" && <SimpleListManager entityName="CustomLicense" title="Custom Licenses" description="Create custom license types for civilians" fields={[{ name: "name", label: "License Name", type: "text", required: true }, { name: "description", label: "Description", type: "text" }, { name: "icon", label: "Icon (emoji or text)", type: "text" }]} />}
      {tab === "community" && <CommunitySettings />}
      {tab === "penal" && <SimpleListManager entityName="PenalCode" title="Penal Codes" description="Define penal codes with fines and jail time" fields={[{ name: "code", label: "Code", type: "text", required: true }, { name: "title", label: "Title", type: "text", required: true }, { name: "category", label: "Category", type: "text" }, { name: "description", label: "Description", type: "textarea" }, { name: "fine_amount", label: "Fine Amount ($)", type: "number" }, { name: "jail_time_months", label: "Jail Time (months)", type: "number" }]} />}
      {tab === "charges" && <SimpleListManager entityName="ChargeType" title="Charge Types" description="Define charge categories for reports" fields={[{ name: "name", label: "Name", type: "text", required: true }, { name: "description", label: "Description", type: "text" }, { name: "color", label: "Color", type: "color" }]} />}
      {tab === "bonds" && <SimpleListManager entityName="BondType" title="Bond Types" description="Define bond types with default amounts" fields={[{ name: "name", label: "Name", type: "text", required: true }, { name: "description", label: "Description", type: "text" }, { name: "default_amount", label: "Default Amount ($)", type: "number" }]} />}
      {tab === "incidents" && <SimpleListManager entityName="IncidentType" title="Incident Types" description="Customize incident types for reports" fields={[{ name: "name", label: "Type Name", type: "text", required: true }, { name: "category", label: "Category", type: "text" }, { name: "description", label: "Description", type: "text" }, { name: "color", label: "Color", type: "color" }]} />}
    </div>
  );
}