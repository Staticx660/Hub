import React from "react";
import { Panel } from "@/components/mdt/ui/primitives";

/** Rolling activity log built from call assignment logs. */
export default function ActivityPane({ calls, deptName }) {
  const entries = calls
    .flatMap((c) => (c.assignment_log || []).map((l) => ({ ...l, call: c })))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 60);

  return (
    <Panel title="Activity Log" className="h-full">
      {entries.length === 0 ? (
        <div className="py-4 text-center text-[11.5px] text-mdt-dim">No activity recorded</div>
      ) : (
        <div className="font-mono text-[11.5px] divide-y divide-mdt-line/50">
          {entries.map((e, i) => (
            <div key={i} className="flex items-center gap-3 px-2 h-6 whitespace-nowrap">
              <span className="text-mdt-dim">{e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour12: false }) : "--:--:--"}</span>
              <span className="text-mdt-accent w-[92px] truncate">{e.call.run_number || e.call.id.slice(-6).toUpperCase()}</span>
              <span className="text-mdt-muted w-[130px] truncate">{e.unit_name || "SYSTEM"}</span>
              <span className="text-mdt-text truncate">{e.message || e.action}</span>
              <span className="text-mdt-dim ml-auto truncate">{deptName(e.call.department_id)}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}