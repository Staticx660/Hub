import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { MInput } from "@/components/mdt/ui/formFields";
import { Btn } from "@/components/mdt/ui/primitives";

export default function WipeConfirmDialog({ open, onOpenChange, title, lines, wiping, onConfirm }) {
  const [confirmText, setConfirmText] = useState("");

  const close = (o) => { onOpenChange(o); if (!o) setConfirmText(""); };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="mdt p-0 gap-0 max-w-md bg-mdt-surface border border-red-500/40 text-mdt-text rounded-none">
        <div className="h-9 px-2.5 flex items-center gap-1.5 border-b border-red-500/40 bg-red-500/10">
          <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
          <span className="text-[12.5px] font-semibold text-red-300">{title}</span>
        </div>
        <div className="p-2.5 space-y-2">
          <p className="text-[11.5px] text-mdt-muted">You are about to permanently delete:</p>
          <ul className="text-[11.5px] text-mdt-muted space-y-0.5">
            {lines.map((l) => <li key={l}>• {l}</li>)}
          </ul>
          <p className="text-[11.5px] font-semibold text-red-300">This cannot be undone.</p>
          <div>
            <p className="text-[11.5px] text-mdt-text mb-1">Type <span className="font-mono font-bold text-red-300">WIPE</span> to confirm:</p>
            <MInput value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="WIPE" className="font-mono" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 h-10 px-2.5 border-t border-mdt-line bg-mdt-surface-2">
          <Btn onClick={() => close(false)}>Cancel</Btn>
          <Btn variant="danger" icon={wiping ? Loader2 : Trash2} disabled={wiping || confirmText !== "WIPE"} onClick={() => onConfirm(() => setConfirmText(""))}>Delete</Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}