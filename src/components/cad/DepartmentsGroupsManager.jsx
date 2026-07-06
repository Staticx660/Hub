import React from "react";
import DepartmentsManager from "@/components/cad/DepartmentsManager";
import UnitGroupsManager from "@/components/cad/UnitGroupsManager";

export default function DepartmentsGroupsManager() {
  return (
    <div className="space-y-8">
      <DepartmentsManager />
      <div className="border-t border-slate-800 pt-8">
        <UnitGroupsManager />
      </div>
    </div>
  );
}