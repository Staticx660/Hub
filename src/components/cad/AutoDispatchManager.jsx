import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-cad-accent" /></div>;
  }

  const standingDown = dispatchersOnline >= 1;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-cad-text flex items-center gap-2"><Bot className="w-5 h-5 text-cad-accent" /> Automated Dispatch</h2>
          <p className="text-sm text-cad-muted mt-1">
            When no dispatcher is on duty, new 911 calls are categorized, routed to the right departments and assigned to the nearest available units automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="border-cad-border/50 text-cad-muted gap-1.5 flex-shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className={`p-4 rounded-lg border ${settings.enabled === false ? "bg-cad-surface-2/40 border-cad-border/40" : standingDown ? "bg-blue-500/10 border-blue-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
        <p className="text-sm font-semibold text-cad-text">
          {settings.enabled === false
            ? "Automation is turned off"
            : standingDown
            ? `Standing down — ${dispatchersOnline} dispatcher${dispatchersOnline > 1 ? "s" : ""} on duty`
            : "Active — no dispatchers on duty, calls are being routed automatically"}
        </p>
        {settings.last_run_at && (
          <p className="text-xs text-cad-dim mt-1">Last call processed: {settings.last_run_status} — {new Date(settings.last_run_at).toLocaleString()}</p>
        )}
      </div>

      <AutoDispatchStats logs={logs} closedCallIds={closedCallIds} />

      <AutoDispatchToggles settings={settings} onChange={updateSettings} saving={saving} />

      <div>
        <h3 className="text-sm font-bold text-cad-text uppercase tracking-wider mb-2">Dispatch Activity</h3>
        <AutoDispatchLogList logs={logs.slice(0, 30)} />
      </div>
    </div>
  );
}