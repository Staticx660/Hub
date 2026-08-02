import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MField, MInput, MTextarea, MSelect } from "@/components/mdt/ui/formFields";
import { Btn } from "@/components/mdt/ui/primitives";
import AddressSearch from "@/components/cad/mdt/AddressSearch";
import { Phone } from "lucide-react";

const CALL_TYPES = ["Medical Emergency", "Structure Fire", "Traffic Accident", "Burglary", "Robbery", "Assault", "Theft", "Vandalism", "Noise Complaint", "Suspicious Person", "Welfare Check", "Domestic Dispute", "Shots Fired", "Other"];
const PRIORITIES = ["1 - High", "2 - Medium", "3 - Low"];

export default function Call911Dialog({ open, onOpenChange, form, setForm, callerLabel, onSubmit }) {
  const set = (k, v) => setForm({ ...form, [k]: v });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.09em] text-mdt-muted">
            <Phone className="w-3.5 h-3.5 text-red-400" /> Place 911 Call
          </DialogTitle>
        </DialogHeader>
        <p className="text-[11.5px] text-mdt-dim">Calling as <span className="text-mdt-text">{callerLabel}</span></p>
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <MField label="Call Type *"><MSelect value={form.call_type} options={CALL_TYPES} onChange={(e) => set("call_type", e.target.value)} /></MField>
            <MField label="Priority"><MSelect value={form.priority} options={PRIORITIES} onChange={(e) => set("priority", e.target.value)} /></MField>
          </div>
          <MField label="Address *">
            <AddressSearch
              value={form.location}
              onChange={(v) => set("location", v)}
              className="h-7 pl-8 pr-2 w-full bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent"
              placeholder="Search for a road..."
            />
          </MField>
          <div className="grid grid-cols-3 gap-2.5">
            <MField label="Postal"><MInput value={form.postal} onChange={(e) => set("postal", e.target.value)} placeholder="1234" /></MField>
            <MField label="Block"><MInput value={form.block} onChange={(e) => set("block", e.target.value)} placeholder="100" /></MField>
            <MField label="Cross Streets"><MInput value={form.cross_streets} onChange={(e) => set("cross_streets", e.target.value)} placeholder="Vinewood & Power" /></MField>
          </div>
          <MField label="Description"><MTextarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Describe the emergency..." /></MField>
        </div>
        <DialogFooter>
          <Btn variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="danger" icon={Phone} onClick={onSubmit} disabled={!form.location}>Call 911</Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}