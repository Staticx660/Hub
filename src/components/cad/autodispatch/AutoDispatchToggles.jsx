import { Switch } from "@/components/ui/switch";
import { MInput, MSection } from "@/components/mdt/ui/formFields";

const TOGGLES = [
  { key: "enabled", label: "Automation Enabled", hint: "Master switch. Automation only acts when zero dispatchers are on duty." },
  { key: "auto_assign_units", label: "Auto-Assign Units", hint: "Attach the recommended units to the call instead of only suggesting them." },
  { key: "ai_narratives", label: "AI Call Narratives", hint: "Generate a dispatch narrative and append it to the call description." },
  { key: "discord_notify", label: "Discord Notifications", hint: "Post the dispatch to each responding department's Discord webhook." },
];

export default function AutoDispatchToggles({ settings, onChange, saving }) {
  return (
    <MSection title="Automation Settings">
      <div className="divide-y divide-mdt-line">
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-start justify-between gap-3 py-2 first:pt-0">
            <div className="min-w-0">
              <p className="text-[12.5px] text-mdt-text">{t.label}</p>
              <p className="text-[11px] text-mdt-dim mt-0.5">{t.hint}</p>
            </div>
            <Switch checked={settings[t.key] !== false} disabled={saving} onCheckedChange={(v) => onChange({ [t.key]: v })} />
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-[12.5px] text-mdt-text">Max Recommended Units</p>
            <p className="text-[11px] text-mdt-dim mt-0.5">How many units the system may recommend per call.</p>
          </div>
          <MInput
            type="number"
            min={1}
            max={10}
            value={settings.max_recommended_units ?? 3}
            disabled={saving}
            onChange={(e) => onChange({ max_recommended_units: parseInt(e.target.value, 10) || 1 })}
            className="w-16"
          />
        </div>
      </div>
    </MSection>
  );
}