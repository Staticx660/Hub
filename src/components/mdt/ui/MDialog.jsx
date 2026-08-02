import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Btn } from "@/components/mdt/ui/primitives";

/* Flat enterprise dialog shell: title bar, body, footer actions */
export default function MDialog({ open, onOpenChange, title, subtitle, children, onSubmit, submitLabel = "Save", submitDisabled, width = "max-w-lg" }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`mdt p-0 gap-0 ${width} bg-mdt-surface border border-mdt-line text-mdt-text rounded-none`}>
        <div className="h-9 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold leading-tight truncate">{title}</div>
            {subtitle && <div className="text-[10px] uppercase tracking-[0.1em] text-mdt-dim truncate">{subtitle}</div>}
          </div>
        </div>
        <div className="p-2.5 max-h-[70vh] overflow-auto mdt-scroll">{children}</div>
        {onSubmit && (
          <div className="flex items-center justify-end gap-1.5 h-10 px-2.5 border-t border-mdt-line bg-mdt-surface-2">
            <Btn onClick={() => onOpenChange(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={submitDisabled} onClick={onSubmit}>{submitLabel}</Btn>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}