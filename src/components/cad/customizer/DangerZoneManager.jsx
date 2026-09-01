import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Btn } from "@/components/mdt/ui/primitives";
import { WIPE_SCOPES } from "./wipeScopes";
import WipeConfirmDialog from "./WipeConfirmDialog";

export default function DangerZoneManager() {
  const [target, setTarget] = useState(null); // scope object, or "all"
  const [wiping, setWiping] = useState(false);
  const { toast } = useToast();

  const isAll = target === "all";
  const lines = isAll ? WIPE_SCOPES.map((s) => s.label) : target ? [target.label] : [];
  const title = isAll ? "Confirm Full System Wipe" : `Confirm Wipe — ${target?.label || ""}`;

  const runWipe = async (reset) => {
    setWiping(true);
    try {
      const res = await base44.functions.invoke("wipeSystemData", {
        confirm: "WIPE",
        scope: isAll ? "all" : target.key,
      });
      if (res.data?.error) {
        toast({ title: "Wipe failed", description: res.data.error, variant: "destructive" });
      } else {
        toast({ title: "Data wiped", description: isAll ? "All operational records deleted." : `${target.label} deleted.` });
        setTarget(null);
        reset();
      }
    } catch (e) {
      toast({ title: "Wipe failed", description: e.message, variant: "destructive" });
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-2.5">
      <p className="text-[11.5px] text-mdt-dim">
        Permanently delete operational data by category. Configuration (departments, penal codes, templates, settings, personnel) is always preserved.
      </p>

      <section className="border border-red-500/30 bg-red-500/5">
        <header className="flex items-center gap-1.5 h-7 px-2.5 border-b border-red-500/30 bg-red-500/10">
          <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
          <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-red-300">Wipe By Category</h3>
        </header>
        <div className="divide-y divide-mdt-line">
          {WIPE_SCOPES.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-3 px-2.5 py-2">
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-mdt-text">{s.label}</div>
                <div className="text-[11px] text-mdt-dim truncate">{s.desc}</div>
              </div>
              <Btn variant="danger" icon={Trash2} className="flex-shrink-0" onClick={() => setTarget(s)}>Wipe</Btn>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-red-500/40 bg-red-500/10">
        <header className="flex items-center gap-1.5 h-7 px-2.5 border-b border-red-500/40">
          <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
          <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-red-300">Wipe Everything</h3>
        </header>
        <div className="p-2.5 flex items-start justify-between gap-3">
          <p className="text-[11.5px] text-mdt-muted">
            Deletes every category listed above in one operation. This cannot be undone.
          </p>
          <Btn variant="danger" icon={Trash2} className="flex-shrink-0" onClick={() => setTarget("all")}>Wipe All Data</Btn>
        </div>
      </section>

      <WipeConfirmDialog
        open={!!target}
        onOpenChange={(o) => { if (!o) setTarget(null); }}
        title={title}
        lines={lines}
        wiping={wiping}
        onConfirm={runWipe}
      />
    </div>
  );
}