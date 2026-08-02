import React from "react";
import StreetCombo from "@/components/dispatch/station/StreetCombo";
import { Panel, Btn } from "@/components/mdt/ui/primitives";
import { X } from "lucide-react";

const CALL_TYPES = ["Traffic Stop", "Traffic Accident", "Medical Emergency", "Structure Fire", "Burglary", "Robbery", "Assault", "Theft", "Suspicious Person", "Welfare Check", "Shots Fired", "Other"];
const PRIORITIES = ["1 - High", "2 - Medium", "3 - Low"];
const ORIGINS = ["911 Call", "Officer Initiated", "Non-Emergency Line", "Radio", "Walk-In", "Alarm Company", "Other Agency"];
const STATUSES = ["Pending", "Active"];

function Row({ label, children, span }) {
  return (
    <label className={`block ${span === 2 ? "col-span-2" : span === 3 ? "col-span-3" : ""}`}>
      <span className="block text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "h-7 px-1.5 w-full bg-mdt-bg border border-mdt-line-2 text-[12px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";
const sectionCap = "h-7 px-2.5 flex items-center border-y border-mdt-line bg-mdt-surface-2 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim";

export default function NewCallModal({ open, onClose, form, setForm, departments, streets = [], onCreate }) {
  if (!open) return null;
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 mdt">
      <Panel
        title="New Call Entry"
        className="w-full max-w-3xl max-h-[92vh]"
        actions={<button onClick={onClose} className="text-mdt-dim hover:text-mdt-text"><X className="w-4 h-4" /></button>}
      >
        <div className={sectionCap}>Incident</div>
        <div className="p-2.5 grid grid-cols-3 gap-2.5">
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
          <Row label="Initial Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Row>
          <Row label="Call Origin">
            <select value={form.call_origin} onChange={(e) => set("call_origin", e.target.value)} className={inputCls}>
              <option value="">—</option>
              {ORIGINS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Row>
          <Row label="Run Number">
            <input value={form.run_number} onChange={(e) => set("run_number", e.target.value)} className={`${inputCls} font-mono`} placeholder="Auto / manual" />
          </Row>
          <Row label="Agency">
            <select value={form.department_id} onChange={(e) => set("department_id", e.target.value)} className={inputCls}>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Row>
        </div>

        <div className={sectionCap}>Location</div>
        <div className="p-2.5 grid grid-cols-3 gap-2.5">
          <Row label="Location *" span={2}>
            <StreetCombo value={form.location} onChange={(v) => set("location", v)} streets={streets} placeholder="Street or landmark" />
          </Row>
          <Row label="Postal">
            <input value={form.postal} onChange={(e) => set("postal", e.target.value)} className={`${inputCls} font-mono`} placeholder="e.g. 1234" />
          </Row>
          <Row label="Cross Streets" span={2}>
            <StreetCombo value={form.cross_streets} onChange={(v) => set("cross_streets", v)} streets={streets} placeholder="Nearest intersection" />
          </Row>
          <Row label="Block / Apt">
            <input value={form.block} onChange={(e) => set("block", e.target.value)} className={inputCls} />
          </Row>
        </div>

        <div className={sectionCap}>Caller</div>
        <div className="p-2.5 grid grid-cols-3 gap-2.5">
          <Row label="Caller Name">
            <input value={form.caller_name} onChange={(e) => set("caller_name", e.target.value)} className={inputCls} />
          </Row>
          <Row label="Caller Phone">
            <input value={form.caller_phone} onChange={(e) => set("caller_phone", e.target.value)} className={`${inputCls} font-mono`} />
          </Row>
          <Row label="Callback / Notes">
            <input value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} placeholder="Caller notes" />
          </Row>
        </div>

        <div className={sectionCap}>Narrative</div>
        <div className="p-2.5 grid grid-cols-2 gap-2.5">
          <Row label="Call Description">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} className={`${inputCls} h-auto py-1.5 resize-y`} placeholder="What is happening, suspect/vehicle info, weapons, injuries…" />
          </Row>
          <Row label="Dispatcher (CAD) Notes">
            <textarea value={form.cad_notes} onChange={(e) => set("cad_notes", e.target.value)} rows={5} className={`${inputCls} h-auto py-1.5 resize-y`} placeholder="Internal notes for responding units" />
          </Row>
        </div>

        <div className="flex justify-end gap-2 p-2.5 border-t border-mdt-line bg-mdt-surface-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" disabled={!form.call_type || !form.location} onClick={onCreate}>Create Call</Btn>
        </div>
      </Panel>
    </div>
  );
}