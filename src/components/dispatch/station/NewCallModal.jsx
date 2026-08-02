import React from "react";
import { Panel, Btn } from "@/components/mdt/ui/primitives";
import { X } from "lucide-react";

const CALL_TYPES = ["Traffic Stop", "Traffic Accident", "Medical Emergency", "Structure Fire", "Burglary", "Robbery", "Assault", "Theft", "Suspicious Person", "Welfare Check", "Shots Fired", "Other"];
const PRIORITIES = ["1 - High", "2 - Medium", "3 - Low"];

function Row({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "h-7 px-1.5 w-full bg-mdt-bg border border-mdt-line-2 text-[12px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";

export default function NewCallModal({ open, onClose, form, setForm, departments, onCreate }) {
  if (!open) return null;
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 mdt">
      <Panel
        title="New Call Entry"
        className="w-full max-w-2xl max-h-[90vh]"
        actions={<button onClick={onClose} className="text-mdt-dim hover:text-mdt-text"><X className="w-4 h-4" /></button>}
      >
        <div className="p-3 grid grid-cols-2 gap-2.5">
          <Row label="Call Type *">
            <select value={form.call_type} onChange={(e) => set("call_type", e.target.value)} className={inputCls}>
              <option value="">Select type…</option>
              {CALL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Row>
          <Row label="Priority">
            <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputCls}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Row>
          <Row label="Location *">
            <input value={form.location} onChange={(e) => set("location", e.target.value)} className={inputCls} placeholder="Street or landmark" />
          </Row>
          <Row label="Agency">
            <select value={form.department_id} onChange={(e) => set("department_id", e.target.value)} className={inputCls}>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Row>
          <Row label="Caller Name">
            <input value={form.caller_name} onChange={(e) => set("caller_name", e.target.value)} className={inputCls} />
          </Row>
          <Row label="Caller Phone">
            <input value={form.caller_phone} onChange={(e) => set("caller_phone", e.target.value)} className={inputCls} />
          </Row>
          <div className="col-span-2">
            <Row label="Narrative">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className={`${inputCls} h-auto py-1.5 resize-y`} />
            </Row>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-2.5 border-t border-mdt-line bg-mdt-surface-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" disabled={!form.call_type || !form.location} onClick={onCreate}>Create Call</Btn>
        </div>
      </Panel>
    </div>
  );
}