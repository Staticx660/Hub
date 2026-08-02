import React from "react";
import { Field, Btn, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";
import { MField } from "@/components/mdt/ui/formFields";
import { CheckCircle2, X, Siren } from "lucide-react";

export default function CallDetailPane({ call, deptName, unitName, availableUnits, onAssign, onUnassign, onClose }) {
  if (!call) return <EmptyState icon={Siren} title="No call selected" hint="Select a call from the queue" />;

  const tone = call.priority === "1 - High" ? "crit" : call.priority === "2 - Medium" ? "warn" : "info";

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusPill tone={tone}>{call.priority}</StatusPill>
            <h3 className="text-[13.5px] font-semibold text-mdt-text truncate">{call.call_type}</h3>
          </div>
          <p className="text-[12px] text-mdt-muted mt-0.5 truncate">{call.location}</p>
        </div>
        <Btn icon={CheckCircle2} onClick={() => onClose(call.id)}>Close Call</Btn>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Department" value={deptName(call.department_id)} />
        <Field label="Status" value={call.status} />
        <Field label="Caller" value={call.caller_name} />
        <Field label="Phone" value={call.caller_phone} />
        <Field label="Description" value={call.description} className="col-span-2" />
      </div>

      <div>
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1.5">Assigned Units</div>
        <div className="flex flex-wrap gap-1.5">
          {(call.assigned_unit_ids || []).map((uid) => (
            <span key={uid} className="inline-flex items-center gap-1 h-[20px] px-1.5 border border-mdt-line-2 bg-mdt-surface-3 text-[11.5px] text-mdt-text">
              {unitName(uid)}
              <button onClick={() => onUnassign(call.id, uid)} className="text-mdt-dim hover:text-red-400"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {(call.assigned_unit_ids || []).length === 0 && <span className="text-[12px] text-mdt-dim">No units assigned</span>}
        </div>
      </div>

      <MField label="Assign Unit">
        <select
          value=""
          onChange={(e) => e.target.value && onAssign(call.id, e.target.value)}
          className="h-7 px-1.5 w-full max-w-xs bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text focus:outline-none focus:border-mdt-accent"
        >
          <option value="">Select a unit…</option>
          {availableUnits.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.unit_type} ({u.status})</option>)}
        </select>
      </MField>
    </div>
  );
}