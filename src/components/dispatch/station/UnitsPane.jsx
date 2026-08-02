import React from "react";
import { Panel, StatusPill, Btn, EmptyState } from "@/components/mdt/ui/primitives";
import { Siren, Send } from "lucide-react";

const STATUS_TONE = { Available: "ok", "On Call": "crit", Busy: "warn", Unavailable: "neutral", "Off Duty": "neutral" };

export default function UnitsPane({ departments, units, groups, deptName, selectedCallId, onDispatchGroup }) {
  if (units.length === 0) {
    return <Panel title="Units"><EmptyState icon={Siren} title="No units configured" hint="Add units in the Admin Panel" /></Panel>;
  }

  return (
    <Panel title="Units & Apparatus">
      <div className="divide-y divide-mdt-line">
        {departments.map((d) => {
          const deptUnits = units.filter((u) => u.department_id === d.id);
          if (deptUnits.length === 0) return null;
          const deptGroups = groups.filter((g) => g.department_id === d.id);
          return (
            <div key={d.id}>
              <div className="flex items-center gap-2 h-6 px-2 bg-mdt-surface-3">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color || "#64748b" }} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-muted truncate">{d.name}</span>
                <span className="text-[10px] text-mdt-dim ml-auto">{deptUnits.filter((u) => u.status === "Available").length}/{deptUnits.length}</span>
              </div>
              {deptUnits.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-2 px-2 h-7 hover:bg-mdt-surface-3/50">
                  <span className="text-[12px] text-mdt-text truncate">{u.name}</span>
                  <StatusPill tone={STATUS_TONE[u.status] || "neutral"}>{u.status}</StatusPill>
                </div>
              ))}
              {deptGroups.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-2 px-2 h-7 bg-mdt-bg/40">
                  <span className="text-[11.5px] text-mdt-muted truncate">{g.name} · {(g.unit_ids || []).length} units</span>
                  <Btn variant="ghost" icon={Send} disabled={!selectedCallId} onClick={() => onDispatchGroup(g.id, selectedCallId)}>Dispatch</Btn>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}