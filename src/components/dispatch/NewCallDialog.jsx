import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConsoleBtn, ConsoleInput, ConsoleTextarea, ConsoleSelect, ConsoleLabel } from "@/components/cad/console/ConsoleUI";
import { Siren } from "lucide-react";

const PRIORITIES = ["1 - High", "2 - Medium", "3 - Low"];

export default function NewCallDialog({ open, onOpenChange, form, setForm, departments, onCreate }) {
  const set = (k, v) => setForm({ ...form, [k]: v });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cad-font bg-cad-surface border-cad-border">
        <DialogHeader>
          <DialogTitle className="text-cad-text flex items-center gap-2 text-base"><Siren className="w-4 h-4 text-cad-accent" /> New Call for Service</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ConsoleLabel label="Call Type"><ConsoleInput value={form.call_type} onChange={(e) => set("call_type", e.target.value)} placeholder="e.g. Burglary in progress" /></ConsoleLabel>
            <ConsoleLabel label="Priority"><ConsoleSelect value={form.priority} onChange={(e) => set("priority", e.target.value)} options={PRIORITIES} /></ConsoleLabel>
          </div>
          <ConsoleLabel label="Location"><ConsoleInput value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. 123 Main St" /></ConsoleLabel>
          <ConsoleLabel label="Description"><ConsoleTextarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} /></ConsoleLabel>
          <div className="grid grid-cols-2 gap-3">
            <ConsoleLabel label="Caller Name"><ConsoleInput value={form.caller_name} onChange={(e) => set("caller_name", e.target.value)} /></ConsoleLabel>
            <ConsoleLabel label="Caller Phone"><ConsoleInput value={form.caller_phone} onChange={(e) => set("caller_phone", e.target.value)} /></ConsoleLabel>
          </div>
          <ConsoleLabel label="Department">
            <ConsoleSelect
              value={form.department_id}
              onChange={(e) => set("department_id", e.target.value)}
              placeholder="Select…"
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </ConsoleLabel>
        </div>
        <DialogFooter>
          <ConsoleBtn variant="ghost" onClick={() => onOpenChange(false)}>Cancel</ConsoleBtn>
          <ConsoleBtn variant="primary" onClick={onCreate} disabled={!form.call_type || !form.location}>Create Call</ConsoleBtn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}