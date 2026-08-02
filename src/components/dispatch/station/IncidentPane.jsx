import React, { useState } from "react";
import { Panel, Btn, Field, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";
import { ClipboardList, UserPlus, X, CheckCircle2 } from "lucide-react";

export default function IncidentPane({ call, deptName, unitName, availableUnits, onAssign, onUnassign, onCloseCall }) {
  const [unitId, setUnitId] = useState("");

  if (!call) {
    return (
      <Panel title="Incident">
        <EmptyState icon={ClipboardList} title="No incident selected" hint="Select a call from the queue" />
      </Panel>
    );
  }

  const assigned = call.assigned_unit_ids || [];
  const tone = call.priority?.startsWith("1") ? "crit" : call.priority?.startsWith("2") ? "warn" : "info";

  return (
    <Panel
      title={`Incident · ${call.run_number || call.id.slice(-6).toUpperCase()}`}
      actions={<Btn variant="danger" icon={CheckCircle2} onClick={() => onCloseCall(call.id)}>Close Call</Btn>}
    >
      <div className="p-2.5 space-y-3">
        <div className="flex items-center gap-2">
          <StatusPill tone={tone}>{call.priority}</StatusPill>
          <StatusPill tone={call.status === "Pending" ? "warn" : "ok"}>{call.status}</StatusPill>
          <span className="text-[13px] font-semibold text-mdt-text truncate">{call.call_type}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Location" value={call.location} />
          <Field label="Cross Streets" value={call.cross_streets} />
          <Field label="Postal" value={call.postal} />
          <Field label="Agency" value={deptName(call.department_id)} />
          <Field label="Caller" value={call.caller_name} />
          <Field label="Caller Phone" value={call.caller_phone} />
        </div>

        <div>
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1">Narrative</div>
          <div className="border border-mdt-line bg-mdt-bg p-2 text-[12.5px] text-mdt-text whitespace-pre-wrap min-h-[54px]">
            {call.description || "—"}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="h-7 px-1.5 flex-1 bg-mdt-surface-3 border border-mdt-line-2 text-[11.5px] text-mdt-text focus:outline-none"
            >
              <option value="">Select unit to attach…</option>
              {availableUnits.map((u) => <option key={u.id} value={u.id}>{u.name} · {deptName(u.department_id)}</option>)}
            </select>
            <Btn icon={UserPlus} disabled={!unitId} onClick={() => { onAssign(call.id, unitId); setUnitId(""); }}>Attach</Btn>
          </div>
          {assigned.length === 0 ? (
            <p className="text-[11.5px] text-mdt-dim">No units attached.</p>
          ) : (
            <div className="border border-mdt-line divide-y divide-mdt-line">
              {assigned.map((id) => (
                <div key={id} className="flex items-center justify-between gap-2 px-2 h-7 bg-mdt-surface-2">
                  <span className="text-[12px] text-mdt-text truncate">{unitName(id)}</span>
                  <button onClick={() => onUnassign(call.id, id)} className="text-mdt-dim hover:text-red-300"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}