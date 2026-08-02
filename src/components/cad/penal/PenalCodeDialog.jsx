import React from "react";
import { MField, MInput, MTextarea } from "@/components/mdt/ui/formFields";
import MDialog from "@/components/mdt/ui/MDialog";

export default function PenalCodeDialog({ open, onOpenChange, editing, form, setForm, onSave, chargeTypes, bondTypes }) {
  const set = (patch) => setForm({ ...form, ...patch });
  return (
    <MDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Penal Code" : "New Penal Code"}
      onSubmit={onSave}
      submitLabel={editing ? "Update" : "Create"}
      submitDisabled={!form.code?.trim() || !form.title?.trim()}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <MField label="Code *">
          <MInput value={form.code} onChange={e => set({ code: e.target.value })} className="font-mono" placeholder="A0.0.0.1" />
        </MField>
        <MField label="Category">
          <MInput value={form.category} onChange={e => set({ category: e.target.value })} placeholder="e.g. Felony" />
        </MField>
        <MField label="Charge Type">
          <select value={form.charge_type || ""} onChange={e => set({ charge_type: e.target.value })} className="h-7 px-1.5 w-full bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text focus:outline-none focus:border-mdt-accent">
            <option value="">— None —</option>
            {chargeTypes.map(ct => <option key={ct.id} value={ct.name}>{ct.name}</option>)}
          </select>
        </MField>
        <MField label="Bond Type">
          <select value={form.bond_type || ""} onChange={e => set({ bond_type: e.target.value })} className="h-7 px-1.5 w-full bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text focus:outline-none focus:border-mdt-accent">
            <option value="">— None —</option>
            {bondTypes.map(bt => <option key={bt.id} value={bt.name}>{bt.name}</option>)}
          </select>
        </MField>
        <MField label="Title *" className="col-span-2">
          <MInput value={form.title} onChange={e => set({ title: e.target.value })} placeholder="e.g. Murder" />
        </MField>
        <MField label="Description" className="col-span-2">
          <MTextarea value={form.description} onChange={e => set({ description: e.target.value })} rows={3} />
        </MField>
        <MField label="Fine Amount ($)">
          <MInput type="number" value={form.fine_amount} onChange={e => set({ fine_amount: Number(e.target.value) })} />
        </MField>
        <MField label="Jail Time (months)">
          <MInput type="number" value={form.jail_time_months} onChange={e => set({ jail_time_months: Number(e.target.value) })} />
        </MField>
      </div>
    </MDialog>
  );
}