import { Settings as SettingsIcon, Server, Webhook, Users } from "lucide-react";
import ThemeSelector from "@/components/cad/ThemeSelector";

export default function CADSettings() {
  return (
    <div className="space-y-6 cad-font">
      <div>
        <h1 className="text-2xl font-bold text-cad-text flex items-center gap-2"><SettingsIcon className="w-6 h-6 text-cad-accent" /> CAD Settings</h1>
        <p className="text-sm text-cad-muted mt-1">Manage global Discord sync, server configuration, and system preferences</p>
      </div>

      <ThemeSelector />

      <div className="cad-card rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-cad-text mb-4 flex items-center gap-2"><Server className="w-5 h-5 text-cad-accent" /> Discord Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-cad-surface-2/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1"><Server className="w-4 h-4 text-cad-dim" /><span className="text-xs text-cad-dim uppercase">Guild ID</span></div>
            <p className="text-sm text-cad-muted font-mono">Configured via secrets</p>
          </div>
          <div className="bg-cad-surface-2/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1"><Webhook className="w-4 h-4 text-cad-dim" /><span className="text-xs text-cad-dim uppercase">Bot Token</span></div>
            <p className="text-sm text-green-400">✓ Active</p>
          </div>
          <div className="bg-cad-surface-2/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-cad-dim" /><span className="text-xs text-cad-dim uppercase">Public Key</span></div>
            <p className="text-sm text-green-400">✓ Set</p>
          </div>
        </div>
        <p className="text-xs text-cad-dim mt-3">Discord secrets are managed in the app dashboard under Environment Variables. The Guild ID, Bot Token, and Public Key are used for all Discord integrations across the CAD system.</p>
      </div>

      <div className="cad-card rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-cad-text mb-2">Discord Sync</h2>
        <p className="text-sm text-cad-muted">Discord member sync and role management is available in the <span className="text-cad-accent">Admin Panel → Discord</span> tab. Visit the Admin Panel to sync members, manage roles, and configure department access.</p>
      </div>
    </div>
  );
}