import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Btn } from "@/components/mdt/ui/primitives";
import AddressSearch from "@/components/cad/mdt/AddressSearch";
import { Radio } from "lucide-react";

const input = "h-7 w-full px-2 bg-mdt-bg border border-mdt-line-2 text-[12px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";
const cap = "block text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1";
const PRIORITIES = ["1 - High", "2 - Medium", "3 - Low"];
const EMPTY = {
  call_type: "", priority: "2 - Medium", location: "", cross_streets: "", postal: "",
  description: "", caller_name: "", caller_phone: "", cad_notes: "",
};

/** Unit-initiated call creation — details are entered before the call is filed. */
export default function NewCallDialog({ open, onOpenChange, onCreate, creating }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { if (open) setForm(EMPTY); }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mdt p-0 gap-0 max-w-xl bg-mdt-surface border border-mdt-line text-mdt-text rounded-none">
        <div className="h-9 px-2.5 flex items-center gap-1.5 border-b border-mdt-line bg-mdt-surface-2">
          <Radio className="w-3.5 h-3.5 text-mdt-accent" />
          <span className="text-[12.5px] font-semibold">New Call — Unit Initiated</span>
        </div>

        <div className="p-2.5 grid grid-cols-2 gap-2.5">
          <div>
            <label className={cap}>Call Type *</label>
            <input value={form.call_type} onChange={(e) => set("call_type", e.target.value)} className={input} placeholder="e.g. Traffic Stop" />
          </div>
          <div>
            <label className={cap}>Priority</label>
            <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={input}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={cap}>Location *</label>
            <AddressSearch value={form.location} onChange={(v) => set("location", v)} className={`${input} pl-7`} placeholder="Search or type address..." />
          </div>
          <div>
            <label className={cap}>Cross Streets</label>
            <input value={form.cross_streets} onChange={(e) => set("cross_streets", e.target.value)} className={input} placeholder="Vinewood Blvd & Alta St" />
          </div>
          <div>
            <label className={cap}>Postal</label>
            <input value={form.postal} onChange={(e) => set("postal", e.target.value)} className={`${input} font-mono`} placeholder="1234" />
          </div>
          <div className="col-span-2">
            <label className={cap}>Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={`${input} h-auto py-1.5 resize-none`} placeholder="What is happening..." />
          </div>
          <div>
            <label className={cap}>Caller Name</label>
            <input value={form.caller_name} onChange={(e) => set("caller_name", e.target.value)} className={input} />
          </div>
          <div>
            <label className={cap}>Caller Phone</label>
            <input value={form.caller_phone} onChange={(e) => set("caller_phone", e.target.value)} className={input} />
          </div>
          <div className="col-span-2">
            <label className={cap}>CAD Notes</label>
            <textarea value={form.cad_notes} onChange={(e) => set("cad_notes", e.target.value)} rows={2} className={`${input} h-auto py-1.5 resize-none`} placeholder="Initial notes for this call..." />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 h-10 px-2.5 border-t border-mdt-line bg-mdt-surface-2">
          <Btn onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" disabled={!form.call_type.trim() || !form.location.trim() || creating} onClick={() => onCreate(form)}>
            {creating ? "Creating…" : "Create & Attach"}
          </Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}