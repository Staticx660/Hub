import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Btn } from "@/components/mdt/ui/primitives";

/** Non-blocking confirmation dialog. Replaces window.confirm(), which is
 *  blocked inside sandboxed iframes (in-game tablet) and freezes the UI. */
export default function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "danger", onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mdt bg-mdt-bg border-mdt-line text-mdt-text max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.09em] text-mdt-muted">{title}</DialogTitle>
        </DialogHeader>
        {description && <p className="text-[12.5px] text-mdt-text">{description}</p>}
        <DialogFooter>
          <Btn variant="ghost" onClick={() => onOpenChange(false)}>{cancelLabel}</Btn>
          <Btn variant={variant} onClick={() => { onOpenChange(false); onConfirm?.(); }}>{confirmLabel}</Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}