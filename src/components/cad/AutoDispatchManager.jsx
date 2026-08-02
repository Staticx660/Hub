import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { Btn } from "@/components/mdt/ui/primitives";
import AutoDispatchToggles from "@/components/cad/autodispatch/AutoDispatchToggles";
import AutoDispatchLogList from "@/components/cad/autodispatch/AutoDispatchLogList";
import AutoDispatchStats from "@/components/cad/autodispatch/AutoDispatchStats";

export default function AutoDispatchManager() {
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState([]);
  const [closedCallIds, setClosedCallIds] = useState(new Set());
  const [dispatchersOnline, setDispatchersOnline] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const [list, logList, sessions, depts, closedCalls] = await Promise.all([
      base44.entities.AutoDispatchSetting.list(),
      base44.entities.AutoDispatchLog.list("-created_date", 200),
      base44.entities.CADSession.filter({ is_active: true }),
      base44.entities.CADDepartment.filter({ is_active: true }),
      base44.entities.ActiveCall.filter({ status: "Closed" }, "-created_date", 300),
    ]);
    setClosedCallIds(new Set(closedCalls.map((c) => c.id)));
    const dispatchIds = new Set(depts.filter((d) => d.category === "Dispatch").map((d) => d.id));
    setDispatchersOnline(sessions.filter((s) => dispatchIds.has(s.department_id)).length);
    setSettings(list[0] || (await base44.entities.AutoDispatchSetting.create({ enabled: true })));
    setLogs(logList);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateSettings = async (patch) => {
    setSaving(true);
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await base44.entities.AutoDispatchSetting.update(settings.id, patch);
      toast({ title: "Saved", description: "Automated dispatch settings updated." });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading || !settings) {
    return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;
  }

  const standingDown = dispatchersOnline >= 1;
  const stateBorder = settings.enabled === false ? "border-mdt-line bg-mdt-surface" : standingDown ? "border-blue-500/25 bg-blue-500/10" : "border-emerald-500/25 bg-emerald-500/10";

  return (
    <div className="max-w-3xl space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] text-mdt-dim">
          When no dispatcher is on duty, new 911 calls are categorized, routed to the right departments and assigned to the nearest available units automatically.
        </p>
        <Btn icon={RefreshCw} onClick={load} className="flex-shrink-0">Refresh</Btn>
      </div>

      <div className={`border p-2.5 ${stateBorder}`}>
        <p className="text-[12.5px] font-semibold text-mdt-text">
          {settings.enabled === false
            ? "Automation is turned off"
            : standingDown
            ? `Standing down — ${dispatchersOnline} dispatcher${dispatchersOnline > 1 ? "s" : ""} on duty`
            : "Active — no dispatchers on duty, calls are being routed automatically"}
        </p>
        {settings.last_run_at && (
          <p className="text-[11px] text-mdt-dim mt-0.5">Last call processed: {settings.last_run_status} — {new Date(settings.last_run_at).toLocaleString()}</p>
        )}
      </div>

      <AutoDispatchStats logs={logs} closedCallIds={closedCallIds} />

      <AutoDispatchToggles settings={settings} onChange={updateSettings} saving={saving} />

      <div>
        <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1.5">Dispatch Activity</h3>
        <AutoDispatchLogList logs={logs.slice(0, 30)} />
      </div>
    </div>
  );
}