import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw, Users, Loader2, CheckCircle2 } from "lucide-react";

export default function DiscordSettings() {
  const [guild, setGuild] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingRoster, setSyncingRoster] = useState(false);
  const [syncingPersonnel, setSyncingPersonnel] = useState(false);
  const [rosterReport, setRosterReport] = useState(null);
  const [personnelReport, setPersonnelReport] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const res = await base44.functions.invoke('getDiscordGuildData', {});
      setGuild(res.data.guild);
      setRoles(res.data.roles || []);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const syncRoster = async () => {
    setSyncingRoster(true);
    try {
      const res = await base44.functions.invoke('syncDiscordMembers', {});
      setRosterReport(res.data.report);
      toast({ title: "Roster synced", description: `${res.data.report.added} added, ${res.data.report.updated} updated` });
    } catch (e) { toast({ title: "Sync failed", description: e.message, variant: "destructive" }); }
    setSyncingRoster(false);
  };

  const syncPersonnel = async () => {
    setSyncingPersonnel(true);
    try {
      const [members, personnel, cadDepartments, rosterDepartments] = await Promise.all([
        base44.entities.RosterMember.list(),
        base44.entities.CADPersonnel.list(),
        base44.entities.CADDepartment.list(),
        base44.entities.Department.list(),
      ]);

      // Build mapping: roster Department ID → CADDepartment ID (matched by discord_role_id)
      const rosterToCadDept = {};
      for (const rDept of rosterDepartments) {
        if (!rDept.discord_role_id) continue;
        const cadDept = cadDepartments.find(c => c.discord_role_id === rDept.discord_role_id);
        if (cadDept) rosterToCadDept[rDept.id] = cadDept.id;
      }

      let added = 0, updated = 0, skipped = 0;
      for (const member of members) {
        const cadDeptId = rosterToCadDept[member.department_id];
        if (!cadDeptId) { skipped++; continue; }

        const existing = personnel.find(p => p.name === member.name && p.department_id === cadDeptId);
        if (existing) {
          const updates = {};
          if (existing.rank !== (member.rank || "")) updates.rank = member.rank || "";
          if (existing.callsign !== (member.callsign || "")) updates.callsign = member.callsign || "";
          if (existing.badge_number !== (member.badge_number || "")) updates.badge_number = member.badge_number || "";
          if (Object.keys(updates).length > 0) { await base44.entities.CADPersonnel.update(existing.id, updates); updated++; }
        } else {
          await base44.entities.CADPersonnel.create({
            name: member.name, department_id: cadDeptId, rank: member.rank || "",
            badge_number: member.badge_number || "", callsign: member.callsign || "", status: "Off Duty",
          });
          added++;
        }
      }
      setPersonnelReport({ added, updated, skipped, total: members.length });
      toast({ title: "Personnel synced", description: `${added} added, ${updated} updated${skipped > 0 ? `, ${skipped} skipped (no CAD dept match)` : ""}` });
    } catch (e) { toast({ title: "Sync failed", description: e.message, variant: "destructive" }); }
    setSyncingPersonnel(false);
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Guild Info */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-1">Discord Guild</h2>
        <p className="text-sm text-slate-400 mb-4">Global Discord settings for the CAD system. The Guild ID is configured via environment variables.</p>
        {guild ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {guild.icon && <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt="" className="w-12 h-12 rounded-full" />}
              <div>
                <p className="text-white font-medium">{guild.name}</p>
                <p className="text-xs text-slate-500 font-mono">ID: {guild.id}</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm text-slate-400 mt-2">
              <span>Members: {guild.approximate_member_count || "—"}</span>
              <span>Online: {guild.approximate_presence_count || "—"}</span>
              <span>Roles: {roles.length}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-400">Could not load guild data. Make sure DISCORD_GUILD_ID and DISCORD_BOT_TOKEN are set.</p>
        )}
      </div>

      {/* Sync Roster */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-white font-medium flex items-center gap-2"><Users className="w-4 h-4 text-cyan-400" /> Sync Roster from Discord</h3>
            <p className="text-sm text-slate-400">Pulls all Discord members with department roles into the Roster</p>
          </div>
          <Button onClick={syncRoster} disabled={syncingRoster} className="bg-cyan-600 hover:bg-cyan-700 gap-2">
            {syncingRoster ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Sync
          </Button>
        </div>
        {rosterReport && (
          <div className="mt-3 text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-400" />
            Added: {rosterReport.added} · Updated: {rosterReport.updated} · Skipped: {rosterReport.skipped}
            {rosterReport.errors?.length > 0 && <p className="text-red-400 mt-1">{rosterReport.errors.length} errors</p>}
          </div>
        )}
      </div>

      {/* Sync Personnel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-white font-medium flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Sync CAD Personnel from Roster</h3>
            <p className="text-sm text-slate-400">Creates/updates CAD personnel records from the Roster. Roster departments are matched to CAD departments by their Discord Role ID — make sure both have the same role ID set.</p>
          </div>
          <Button onClick={syncPersonnel} disabled={syncingPersonnel} className="bg-blue-600 hover:bg-blue-700 gap-2">
            {syncingPersonnel ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Sync
          </Button>
        </div>
        {personnelReport && (
          <div className="mt-3 text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-400" />
            Added: {personnelReport.added} · Updated: {personnelReport.updated} · Skipped: {personnelReport.skipped || 0} · Total roster members: {personnelReport.total}
          </div>
        )}
      </div>

      {/* Available Roles */}
      {roles.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-medium mb-3">Available Roles</h3>
          <p className="text-sm text-slate-400 mb-3">Copy these Role IDs into your department settings to restrict access</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {roles.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm bg-slate-800/50 rounded px-3 py-1.5">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#64748b' }} />
                  <span className="text-slate-300">{r.name}</span>
                </span>
                <span className="text-xs font-mono text-slate-500">{r.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}