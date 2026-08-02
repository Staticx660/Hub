import React from "react";
import { Panel, StatusPill } from "@/components/mdt/ui/primitives";

const TONE = { "Available": "ok", "On Call": "crit", "Transporting": "warn", "Out of Service": "neutral", "Off Duty": "neutral" };

export default function UnitsRosterPanel({ departments, units, groups, activeCalls, deptName, onDispatchGroup }) {
  return (
    <div className="flex flex-col min-h-0 gap-2 h-full">
      <Panel title="Units" className="flex-1">
        {departments.map((dept) => {
          const deptUnits = units.filter((u) => u.department_id === dept.id);
          if (deptUnits.length === 0) return null;
          return (
            <div key={dept.id} className="border-b border-mdt-line last:border-b-0">
              <div className="flex items-center gap-2 h-7 px-2.5 bg-mdt-surface-2">
                <span className="w-2 h-2" style={{ background: dept.color }} />
                <span className="text-[11.5px] font-medium text-mdt-text truncate">{dept.name}</span>
                <span className="text-[11px] text-mdt-dim ml-auto">{deptUnits.filter((u) => u.status === "Available").length}/{deptUnits.length}</span>
              </div>
              {deptUnits.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-2 h-7 px-2.5 border-t border-mdt-line/60">
                  <span className="text-[12px] text-mdt-text truncate">{u.name}</span>
                  <StatusPill tone={TONE[u.status] || "neutral"}>{u.status}</StatusPill>
                </div>
              ))}
            </div>
          );
        })}
      </Panel>

      {groups.length > 0 && (
        <Panel title="Preset Groups" className="flex-1">
          {groups.map((g) => (
            <div key={g.id} className="p-2.5 border-b border-mdt-line last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] text-mdt-text truncate">{g.name}</span>
                <span className="text-[11px] text-mdt-dim">{g.unit_ids?.length || 0} units</span>
              </div>
              <p className="text-[11px] text-mdt-dim mb-1.5">{deptName(g.department_id)}</p>
              <select
                value=""
                onChange={(e) => e.target.value && onDispatchGroup(g.id, e.target.value)}
                className="h-7 px-1.5 w-full bg-mdt-surface border border-mdt-line-2 text-[12px] text-mdt-text focus:outline-none focus:border-mdt-accent"
              >
                <option value="">Dispatch to call…</option>
                {activeCalls.map((c) => <option key={c.id} value={c.id}>{c.call_type} · {c.location}</option>)}
              </select>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}