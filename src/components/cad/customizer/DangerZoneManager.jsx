import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <h2 className="text-xl font-bold text-cad-text">Danger Zone</h2>
      </div>
      <p className="text-sm text-cad-muted mb-6">
        Permanently delete all operational data from the system. Configuration data (departments, penal codes, templates, settings, personnel) will be preserved.
      </p>

      <div className="border border-red-500/30 rounded-lg bg-red-500/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-red-400">Wipe All System Data</h3>
            <p className="text-xs text-cad-muted mt-1">
              Deletes all calls, BOLOs, warrants, civilians, vehicles, reports, PCRs, sessions, groups, and firearms. This cannot be undone.
            </p>
          </div>
          <Button onClick={() => setConfirmOpen(true)} variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 flex-shrink-0">
            <Trash2 className="w-4 h-4 mr-2" /> Wipe Data
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) setConfirmText(""); }}>
        <DialogContent className="bg-cad-surface border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Confirm System Wipe
            </DialogTitle>
            <DialogDescription className="text-cad-muted">
              You are about to permanently delete ALL operational data:
              <ul className="mt-2 space-y-1 text-xs">
                {WIPED_ENTITIES.map((e) => <li key={e}>• {e}</li>)}
              </ul>
              <span className="block mt-3 font-medium text-red-400">This cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-cad-text mb-2">Type <span className="font-mono font-bold text-red-400">WIPE</span> to confirm:</p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="WIPE"
              className="bg-cad-surface-2/50 border-cad-border/50 text-cad-text font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmOpen(false); setConfirmText(""); }} className="border-cad-border/50 text-cad-muted">
              Cancel
            </Button>
            <Button onClick={handleWipe} disabled={wiping || confirmText !== "WIPE"} className="bg-red-600 hover:bg-red-700 text-white">
              {wiping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Wipe All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}