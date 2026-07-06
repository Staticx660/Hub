import React from "react";
import { Link } from "react-router-dom";
import RetroFrame from "./RetroFrame";

export default function RetroDepartmentList({ departments, units, personnel, community }) {
  const unitCount = (deptId) => units.filter(u => u.department_id === deptId).length;
  const personnelCount = (deptId) => personnel.filter(p => p.department_id === deptId).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-cad-text tracking-tight retro-cursor inline-block">
          {community?.community_name ? `${community.community_name.toUpperCase()}_CAD` : "CAD_SYSTEM"}
        </h1>
        <p className="text-xs text-cad-dim mt-1">&gt; SELECT DEPARTMENT TO INITIALIZE SESSION</p>
      </div>

      <RetroFrame title="DEPARTMENTS">
        {departments.length === 0 ? (
          <p className="text-cad-dim text-sm">&gt; NO DEPARTMENTS FOUND. CREATE IN ADMIN PANEL.</p>
        ) : (
          <div className="divide-y divide-cad-border/30">
            {departments.map((d, idx) => {
              const locked = !d.hasAccess;
              const path = d.category === "Civilian"
                ? `/cad/civilian/${d.id}`
                : ["Dispatch", "Fire", "EMS"].includes(d.category)
                  ? `/cad/board/${d.id}`
                  : `/cad/mdt/${d.id}`;
              const content = (
                <>
                  <span className="text-cad-dim tabular-nums w-6 text-center">{String(idx + 1).padStart(2, "0")}</span>
                  <span className={`font-bold ${locked ? "text-cad-dim" : "text-cad-text"}`}>{d.name}</span>
                  <span className="text-cad-muted">[{d.category === "Dispatch" ? "DISPATCH" : d.category.toUpperCase()}]</span>
                  {locked ? (
                    <span className="text-cad-dim ml-auto">[LOCKED]</span>
                  ) : (
                    <span className="text-cad-muted ml-auto">U:{unitCount(d.id)} P:{personnelCount(d.id)}</span>
                  )}
                  {!locked && <span className="text-cad-accent">&gt;</span>}
                </>
              );
              return locked ? (
                <div key={d.id} className="flex items-center gap-3 px-2 py-2.5 text-sm opacity-50">{content}</div>
              ) : (
                <Link key={d.id} to={path} className="flex items-center gap-3 px-2 py-2.5 text-sm hover:bg-cad-surface-2/40 transition-colors">{content}</Link>
              );
            })}
          </div>
        )}
      </RetroFrame>
    </div>
  );
}