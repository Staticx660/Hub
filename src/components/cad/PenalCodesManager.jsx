import React from "react";
import SimpleListManager from "@/components/cad/customizer/SimpleListManager";

export default function PenalCodesManager() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-1">Penal Codes & Charges</h2>
      <p className="text-sm text-slate-400 mb-4">Manage penal codes, charge types, and bond types in one place</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <SimpleListManager entityName="ChargeType" title="Charge Types" description="Misdemeanor, Felony, etc." fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "text" },
            { name: "color", label: "Color (hex)", type: "text" },
          ]} />
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <SimpleListManager entityName="BondType" title="Bond Types" description="Cash Bail, Surety, etc." fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "text" },
            { name: "default_amount", label: "Default Amount ($)", type: "number" },
          ]} />
        </div>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <SimpleListManager entityName="PenalCode" title="Penal Codes" description="Full list of penal codes with fines and jail time" fields={[
          { name: "code", label: "Code", type: "text", required: true },
          { name: "title", label: "Title", type: "text", required: true },
          { name: "category", label: "Category", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "fine_amount", label: "Fine Amount ($)", type: "number" },
          { name: "jail_time_months", label: "Jail Time (months)", type: "number" },
        ]} />
      </div>
    </div>
  );
}