import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConsoleBtn, ConsoleInput, ConsoleTextarea, ConsoleSelect, ConsoleLabel } from "@/components/cad/console/ConsoleUI";
import AddressSearch from "@/components/cad/mdt/AddressSearch";
import { Phone } from "lucide-react";

const CALL_TYPES = ["Medical Emergency", "Structure Fire", "Traffic Accident", "Burglary", "Robbery", "Assault", "Theft", "Vandalism", "Noise Complaint", "Suspicious Person", "Welfare Check", "Domestic Dispute", "Shots Fired", "Other"];
const PRIORITIES = ["1 - High", "2 - Medium", "3 - Low"];

export default function Call911Dialog({ open, onOpenChange, form, setForm, callerLabel, onSubmit }) {
  const set = (k, v) => setForm({ ...form, [k]: v });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cad-font bg-cad-surface border-cad-border">
        <DialogHeader>
          <DialogTitle className="text-cad-text flex items-center gap-2 text-base"><Phone className="w-4 h-4 text-red-400" /> Place 911 Call</DialogTitle>
        </DialogHeader>
        <p className="text-[12.5px] text-cad-muted">Calling as: <span className="text-cad-text font-medium">{callerLabel}</span></p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ConsoleLabel label="Call Type *"><ConsoleSelect value={form.call_type} onChange={(e) => set("call_type", e.target.value)} options={CALL_TYPES} /></ConsoleLabel>
            <ConsoleLabel label="Priority"><ConsoleSelect value={form.priority} onChange={(e) => set("priority", e.target.value)} options={PRIORITIES} /></ConsoleLabel>
          </div>
          <ConsoleLabel label="Address *">
            <AddressSearch
              value={form.location}
              onChange={(v) => set("location", v)}
              className="h-8 pl-9 pr-2 w-full bg-cad-surface-2 border border-cad-border rounded-[calc(var(--cad-radius)*0.6)] text-[12.5px] text-cad-text focus-visible:outline-none focus:border-cad-accent"
              placeholder="Search for a road..."
            />
          </ConsoleLabel>
          <div className="grid grid-cols-3 gap-3">
            <ConsoleLabel label="Postal"><ConsoleInput value={form.postal} onChange={(e) => set("postal", e.target.value)} placeholder="e.g. 1234" /></ConsoleLabel>
            <ConsoleLabel label="Block"><ConsoleInput value={form.block} onChange={(e) => set("block", e.target.value)} placeholder="e.g. 100" /></ConsoleLabel>
            <ConsoleLabel label="Cross Streets"><ConsoleInput value={form.cross_streets} onChange={(e) => set("cross_streets", e.target.value)} placeholder="e.g. Vinewood & Power" /></ConsoleLabel>
          </div>
          <ConsoleLabel label="Description"><ConsoleTextarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Describe the emergency..." /></ConsoleLabel>
        </div>
        <DialogFooter>
          <ConsoleBtn variant="ghost" onClick={() => onOpenChange(false)}>Cancel</ConsoleBtn>
          <ConsoleBtn variant="danger" icon={Phone} onClick={onSubmit} disabled={!form.location}>Call 911</ConsoleBtn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}