import React from "react";
import { ConsoleField, ConsoleBtn, Tag, ConsoleEmpty, ConsoleSelect, ConsoleLabel } from "@/components/cad/console/ConsoleUI";
import { CheckCircle2, X, Siren, MapPin } from "lucide-react";

export default function CallDetailPane({ call, deptName, unitName, availableUnits, onAssign, onUnassign, onClose }) {
  if (!call) return <ConsoleEmpty icon={Siren} title="No call selected" hint="Select a call from the queue to review and assign units" />;

  const tone = call.priority === "1 - High" ? "crit" : call.priority === "2 - Medium" ? "warn" : "info";

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag tone={tone}>{call.priority}</Tag>
            <h3 className="text-[15px] font-semibold text-cad-text truncate">{call.call_type}</h3>
          </div>
          <p className="text-[12px] text-cad-muted mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {call.location}</p>
        </div>
        <ConsoleBtn icon={CheckCircle2} onClick={() => onClose(call.id)}>Close Call</ConsoleBtn>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ConsoleField label="Department" value={deptName(call.department_id)} />
        <ConsoleField label="Status" value={call.status} />
        <ConsoleField label="Caller" value={call.caller_name} />
        <ConsoleField label="Phone" value={call.caller_phone} />
        <ConsoleField label="Description" value={call.description} className="col-span-2" />
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-cad-dim mb-1.5">Assigned Units</div>
        <div className="flex flex-wrap gap-1.5">
          {(call.assigned_unit_ids || []).map((uid) => (
            <span key={uid} className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full border border-cad-border-light bg-cad-surface-2 text-[11.5px] text-cad-text">
              {unitName(uid)}
              <button onClick={() => onUnassign(call.id, uid)} className="text-cad-dim hover:text-red-400"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {(call.assigned_unit_ids || []).length === 0 && <span className="text-[12px] text-cad-dim">No units assigned</span>}
        </div>
      </div>

      <ConsoleLabel label="Assign Unit" className="max-w-xs">
        <ConsoleSelect
          value=""
          onChange={(e) => e.target.value && onAssign(call.id, e.target.value)}
          placeholder="Select a unit…"
          options={availableUnits.map((u) => ({ value: u.id, label: `${u.name} · ${u.unit_type} (${u.status})` }))}
        />
      </ConsoleLabel>
    </div>
  );
}