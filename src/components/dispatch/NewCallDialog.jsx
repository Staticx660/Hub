import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MField, MInput, MTextarea, MSelect } from "@/components/mdt/ui/formFields";
import { Btn } from "@/components/mdt/ui/primitives";

const PRIORITIES = ["1 - High", "2 - Medium", "3 - Low"];

export default function NewCallDialog({ open, onOpenChange, form, setForm, departments, onCreate }) {
  const set = (k, v) => setForm({ ...form, [k]: v });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mdt bg-mdt-surface border-mdt-line-2 text-mdt-text">
        <DialogHeader>
          <DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.09em] text-mdt-muted">New Call for Service</DialogTitle>
        </DialogHeader>
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <MField label="Call Type"><MInput value={form.call_type} onChange={(e) => set("call_type", e.target.value)} placeholder="e.g. Burglary in progress" /></MField>
            <MField label="Priority"><MSelect value={form.priority} onChange={(e) => set("priority", e.target.value)} options={PRIORITIES} /></MField>
          </div>
          <MField label="Location"><MInput value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. 123 Main St" /></MField>
          <MField label="Description"><MTextarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} /></MField>
          <div className="grid grid-cols-2 gap-2.5">
            <MField label="Caller Name"><MInput value={form.caller_name} onChange={(e) => set("caller_name", e.target.value)} /></MField>
            <MField label="Caller Phone"><MInput value={form.caller_phone} onChange={(e) => set("caller_phone", e.target.value)} /></MField>
          </div>
          <MField label="Department">
            <select value={form.department_id} onChange={(e) => set("department_id", e.target.value)} className="h-7 px-1.5 w-full bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text focus:outline-none focus:border-mdt-accent">
              <option value="">Select…</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </MField>
        </div>
        <DialogFooter>
          <Btn variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={onCreate} disabled={!form.call_type || !form.location}>Create Call</Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}