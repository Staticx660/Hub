import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

const TOGGLES = [
  { key: "enabled", label: "Automation Enabled", hint: "Master switch. Automation only acts when zero dispatchers are on duty." },
  { key: "auto_assign_units", label: "Auto-Assign Units", hint: "Attach the recommended units to the call instead of only suggesting them." },
  { key: "ai_narratives", label: "AI Call Narratives", hint: "Generate a dispatch narrative and append it to the call description." },
  { key: "discord_notify", label: "Discord Notifications", hint: "Post the dispatch to each responding department's Discord webhook." },
];

export default function AutoDispatchToggles({ settings, onChange, saving }) {
  return (
    <div className="space-y-3">
      {TOGGLES.map((t) => (
        <div key={t.key} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-cad-surface-2/40 border border-cad-border/40">
          <div className="min-w-0">
            <p className="text-sm font-medium text-cad-text">{t.label}</p>
            <p className="text-xs text-cad-dim mt-0.5">{t.hint}</p>
          </div>
          <Switch checked={settings[t.key] !== false} disabled={saving} onCheckedChange={(v) => onChange({ [t.key]: v })} />
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-cad-surface-2/40 border border-cad-border/40">
        <div>
          <p className="text-sm font-medium text-cad-text">Max Recommended Units</p>
          <p className="text-xs text-cad-dim mt-0.5">How many units the system may recommend per call.</p>
        </div>
        <Input
          type="number"
          min={1}
          max={10}
          value={settings.max_recommended_units ?? 3}
          disabled={saving}
          onChange={(e) => onChange({ max_recommended_units: parseInt(e.target.value, 10) || 1 })}
          className="w-20 bg-cad-surface border-cad-border/50 text-cad-text"
        />
      </div>
    </div>
  );
}