import React from "react";
import DepartmentsManager from "@/components/cad/DepartmentsManager";
import UnitGroupsManager from "@/components/cad/UnitGroupsManager";

export default function DepartmentsGroupsManager() {
  return (
    <div className="max-w-4xl space-y-4">
      <DepartmentsManager />
      <div className="border-t border-mdt-line pt-4">
        <UnitGroupsManager />
      </div>
    </div>
  );
}