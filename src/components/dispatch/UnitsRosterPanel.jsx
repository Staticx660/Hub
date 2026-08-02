import React from "react";
import { ConsolePanel, Tag, ConsoleSelect } from "@/components/cad/console/ConsoleUI";

const TONE = { "Available": "ok", "On Call": "crit", "Transporting": "warn", "Out of Service": "neutral", "Off Duty": "neutral" };

export default function UnitsRosterPanel({ departments, units, groups, activeCalls, deptName, onDispatchGroup }) {
  return (
    <div className="flex flex-col gap-3 min-h-0">
      <ConsolePanel title="Units" subtitle={`${units.filter((u) => u.status === "Available").length} available`} bodyClassName="max-h-[50vh]">
        {departments.map((dept) => {
          const deptUnits = units.filter((u) => u.department_id === dept.id);
          if (deptUnits.length === 0) return null;
          return (
            <div key={dept.id} className="border-b border-cad-border/50 last:border-b-0">
              <div className="flex items-center gap-2 h-8 px-2.5 bg-cad-surface-2/40">
                <span className="w-2 h-2 rounded-full" style={{ background: dept.color }} />
                <span className="text-[12px] font-medium text-cad-text truncate">{dept.name}</span>
                <span className="text-[11px] text-cad-dim ml-auto">{deptUnits.filter((u) => u.status === "Available").length}/{deptUnits.length}</span>
              </div>
              {deptUnits.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-2 h-8 px-2.5 border-t border-cad-border/30">
                  <span className="text-[12.5px] text-cad-text truncate">{u.name}</span>
                  <Tag tone={TONE[u.status] || "neutral"}>{u.status}</Tag>
                </div>
              ))}
            </div>
          );
        })}
      </ConsolePanel>

      {groups.length > 0 && (
        <ConsolePanel title="Preset Groups" bodyClassName="max-h-[40vh]">
          {groups.map((g) => (
            <div key={g.id} className="p-2.5 border-b border-cad-border/50 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-medium text-cad-text truncate">{g.name}</span>
                <span className="text-[11px] text-cad-dim">{g.unit_ids?.length || 0} units</span>
              </div>
              <p className="text-[11px] text-cad-dim mb-1.5">{deptName(g.department_id)}</p>
              <ConsoleSelect
                value=""
                onChange={(e) => e.target.value && onDispatchGroup(g.id, e.target.value)}
                placeholder="Dispatch to call…"
                options={activeCalls.map((c) => ({ value: c.id, label: `${c.call_type} · ${c.location}` }))}
              />
            </div>
          ))}
        </ConsolePanel>
      )}
    </div>
  );
}