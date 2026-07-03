import { useState } from "react";
import { Settings, Server, Webhook, Users } from "lucide-react";

export default function CADSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Settings className="w-6 h-6" /> CAD Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage global Discord sync, server configuration, and system preferences</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Server className="w-5 h-5 text-cyan-400" /> Discord Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1"><Server className="w-4 h-4 text-slate-500" /><span className="text-xs text-slate-500 uppercase">Guild ID</span></div>
            <p className="text-sm text-slate-300 font-mono">Configured via secrets</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1"><Webhook className="w-4 h-4 text-slate-500" /><span className="text-xs text-slate-500 uppercase">Bot Token</span></div>
            <p className="text-sm text-green-400">✓ Active</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-slate-500" /><span className="text-xs text-slate-500 uppercase">Public Key</span></div>
            <p className="text-sm text-green-400">✓ Set</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">Discord secrets are managed in the app dashboard under Environment Variables. The Guild ID, Bot Token, and Public Key are used for all Discord integrations across the CAD system.</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-2">Discord Sync</h2>
        <p className="text-sm text-slate-400">Discord member sync and role management is available in the <span className="text-cyan-400">Admin Panel → Discord</span> tab. Visit the Admin Panel to sync members, manage roles, and configure department access.</p>
      </div>
    </div>
  );
}