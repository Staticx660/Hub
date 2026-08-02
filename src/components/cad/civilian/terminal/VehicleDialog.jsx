import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MField, MInput, MSelect } from "@/components/mdt/ui/formFields";
import { Btn } from "@/components/mdt/ui/primitives";

const TYPES = ["", "Sedan", "SUV", "Truck", "Motorcycle", "Van", "Sports", "Other"];
const REG = ["Valid", "Expired", "Suspended", "None"];
const INS = ["Valid", "Expired", "None"];

export default function VehicleDialog({ open, onOpenChange, form, setForm, onSubmit }) {
  const set = (k, v) => setForm({ ...form, [k]: v });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text">
        <DialogHeader>
          <DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.09em] text-mdt-muted">Register Vehicle</DialogTitle>
        </DialogHeader>
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <MField label="Plate *"><MInput value={form.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} className="font-mono" /></MField>
            <MField label="Vehicle Type"><MSelect value={form.type} options={TYPES} onChange={(e) => set("type", e.target.value)} /></MField>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            <MField label="Make"><MInput value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="Toyota" /></MField>
            <MField label="Model"><MInput value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Camry" /></MField>
            <MField label="Color"><MInput value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Black" /></MField>
            <MField label="Year"><MInput value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2023" /></MField>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <MField label="Registration"><MSelect value={form.registration_status} options={REG} onChange={(e) => set("registration_status", e.target.value)} /></MField>
            <MField label="Insurance"><MSelect value={form.insurance_status} options={INS} onChange={(e) => set("insurance_status", e.target.value)} /></MField>
          </div>
        </div>
        <DialogFooter>
          <Btn variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={onSubmit} disabled={!form.plate}>Register</Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}