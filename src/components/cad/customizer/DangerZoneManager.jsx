import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { MInput } from "@/components/mdt/ui/formFields";
import { Btn } from "@/components/mdt/ui/primitives";

const WIPED_ENTITIES = [
  "Active Calls",
  "BOLOs",
  "Warrants",
  "Civilians & Vehicles",
  "Reports & Patient Care Reports",
  "Active Sessions & Unit Groups",
  "Firearms"
];

export default function DangerZoneManager() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);
  const { toast } = useToast();

  const handleWipe = async () => {
    if (confirmText !== "WIPE") return;
    setWiping(true);
    try {
      const res = await base44.functions.invoke("wipeSystemData", { confirm: "WIPE" });
      if (res.data?.error) {
        toast({ title: "Wipe failed", description: res.data.error, variant: "destructive" });
      } else {
        toast({ title: "System data wiped", description: "All operational records have been deleted." });
        setConfirmOpen(false);
        setConfirmText("");
      }
    } catch (e) {
      toast({ title: "Wipe failed", description: e.message, variant: "destructive" });
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-2.5">
      <p className="text-[11.5px] text-mdt-dim">
        Permanently delete all operational data. Configuration (departments, penal codes, templates, settings, personnel) is preserved.
      </p>

      <section className="border border-red-500/30 bg-red-500/5">
        <header className="flex items-center gap-1.5 h-7 px-2.5 border-b border-red-500/30 bg-red-500/10">
          <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
          <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-red-300">Wipe All System Data</h3>
        </header>
        <div className="p-2.5 flex items-start justify-between gap-3">
          <p className="text-[11.5px] text-mdt-muted">
            Deletes all calls, BOLOs, warrants, civilians, vehicles, reports, PCRs, sessions, groups and firearms. This cannot be undone.
          </p>
          <Btn variant="danger" icon={Trash2} className="flex-shrink-0" onClick={() => setConfirmOpen(true)}>Wipe Data</Btn>
        </div>
      </section>

      <Dialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) setConfirmText(""); }}>
        <DialogContent className="mdt p-0 gap-0 max-w-md bg-mdt-surface border border-red-500/40 text-mdt-text rounded-none">
          <div className="h-9 px-2.5 flex items-center gap-1.5 border-b border-red-500/40 bg-red-500/10">
            <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
            <span className="text-[12.5px] font-semibold text-red-300">Confirm System Wipe</span>
          </div>
          <div className="p-2.5 space-y-2">
            <p className="text-[11.5px] text-mdt-muted">You are about to permanently delete ALL operational data:</p>
            <ul className="text-[11.5px] text-mdt-muted space-y-0.5">
              {WIPED_ENTITIES.map((e) => <li key={e}>• {e}</li>)}
            </ul>
            <p className="text-[11.5px] font-semibold text-red-300">This cannot be undone.</p>
            <div>
              <p className="text-[11.5px] text-mdt-text mb-1">Type <span className="font-mono font-bold text-red-300">WIPE</span> to confirm:</p>
              <MInput value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="WIPE" className="font-mono" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 h-10 px-2.5 border-t border-mdt-line bg-mdt-surface-2">
            <Btn onClick={() => { setConfirmOpen(false); setConfirmText(""); }}>Cancel</Btn>
            <Btn variant="danger" icon={wiping ? Loader2 : Trash2} disabled={wiping || confirmText !== "WIPE"} onClick={handleWipe}>Wipe All Data</Btn>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}