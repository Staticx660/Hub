import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  RefreshCw, Save, AlertCircle, CheckCircle, Loader2,
  Server, Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function DiscordSync() {
  const [guild, setGuild] = useState(null);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roleMappings, setRoleMappings] = useState({});
  const [supervisorMappings, setSupervisorMappings] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [depts, guildRes] = await Promise.all([
          base44.entities.Department.list(),
          base44.functions.invoke("getDiscordGuildData", {})
        ]);
        setDepartments(depts || []);
        setGuild(guildRes.data?.guild || null);
        setRoles(guildRes.data?.roles || []);

        if (guildRes.data?.guildError || guildRes.data?.rolesError) {
          toast({
            title: "Discord connection issue",
            description: guildRes.data?.guildError || guildRes.data?.rolesError,
            variant: "destructive"
          });
        }

        const mappings = {};
        const supMappings = {};
        for (const dept of depts || []) {
          if (dept.discord_role_id) {
            mappings[dept.id] = dept.discord_role_id;
          }
          if (dept.discord_supervisor_role_id) {
            supMappings[dept.id] = dept.discord_supervisor_role_id;
          }
        }
        setRoleMappings(mappings);
        setSupervisorMappings(supMappings);
      } catch (e) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleRoleChange = (deptId, value) => {
    setRoleMappings(prev => ({ ...prev, [deptId]: value }));
  };

  const handleSupervisorChange = (deptId, value) => {
    setSupervisorMappings(prev => ({ ...prev, [deptId]: value }));
  };

  const handleSaveMappings = async () => {
    setSaving(true);
    try {
      for (const dept of departments) {
        const newRoleId = roleMappings[dept.id] || "";
        const newSupRoleId = supervisorMappings[dept.id] || "";
        const updates = {};
        if ((dept.discord_role_id || "") !== newRoleId) updates.discord_role_id = newRoleId;
        if ((dept.discord_supervisor_role_id || "") !== newSupRoleId) updates.discord_supervisor_role_id = newSupRoleId;
        if (Object.keys(updates).length > 0) {
          await base44.entities.Department.update(dept.id, updates);
        }
      }
      toast({ title: "Saved", description: "Department role mappings updated." });
    } catch (e) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncReport(null);
    try {
      const res = await base44.functions.invoke("syncDiscordMembers", {});
      setSyncReport(res.data);
      if (res.data?.error) {
        toast({ title: "Sync failed", description: res.data.error, variant: "destructive" });
      } else {
        toast({
          title: "Sync complete",
          description: `Added ${res.data.report.added}, updated ${res.data.report.updated}, skipped ${res.data.report.skipped}`
        });
      }
    } catch (e) {
      toast({ title: "Sync failed", description: e.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const guildIconUrl = guild?.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
    : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Discord Sync</h1>
        <p className="text-sm text-slate-400 mt-1">
          Sync Discord members into your roster by mapping roles to departments
        </p>
      </div>

      {/* Guild info */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" /> Connected Server
        </h2>
        {guild ? (
          <div className="flex items-center gap-3">
            {guildIconUrl && (
              <img src={guildIconUrl} alt={guild.name} className="w-12 h-12 rounded-full" />
            )}
            <div>
              <p className="text-white font-medium">{guild.name}</p>
              <p className="text-xs text-slate-500">{guild.member_count || "—"} members</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Could not connect to Discord. Check your bot token and guild ID.
          </p>
        )}
      </div>

      {/* Role mapping table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" /> Role Mapping
          </h2>
          <Button onClick={handleSaveMappings} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Mappings
          </Button>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-4 pb-2 border-b border-slate-800">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Department</p>
            </div>
            <div className="flex flex-col gap-1.5 w-52">
              <p className="text-xs font-medium text-slate-400">Member Role ID</p>
              <p className="text-xs font-medium text-amber-500/70">Supervisor Role ID</p>
            </div>
          </div>
          {departments.map(dept => (
            <div key={dept.id} className="flex items-center gap-4 py-3 border-b border-slate-800 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{dept.name}</p>
                <p className="text-xs text-slate-500">{dept.category}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Input
                  value={roleMappings[dept.id] || ""}
                  onChange={(e) => handleRoleChange(dept.id, e.target.value)}
                  placeholder="Member Role ID"
                  className="w-52 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 font-mono text-xs h-8"
                />
                <Input
                  value={supervisorMappings[dept.id] || ""}
                  onChange={(e) => handleSupervisorChange(dept.id, e.target.value)}
                  placeholder="Supervisor Role ID"
                  className="w-52 bg-slate-800 border-amber-700/50 text-white placeholder:text-slate-600 font-mono text-xs h-8"
                />
              </div>
            </div>
          ))}
          {departments.length === 0 && (
            <p className="text-sm text-slate-400 py-4 text-center">No departments yet. Create departments first.</p>
          )}
        </div>

        {/* Available roles reference */}
        {roles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-2">Available Discord Roles (copy the ID you need):</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {roles.filter(r => r.name !== "@everyone").map(r => (
                <div key={r.id} className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400 font-mono">
                  <span className="text-slate-300">{r.name}</span> → {r.id}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sync panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-400" /> Sync Members
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Pull all Discord members who have a mapped role into the roster. New members are added;
          existing members are updated. Syncs also run automatically every hour.
        </p>
        <Button onClick={handleSync} disabled={syncing} className="bg-blue-600 hover:bg-blue-700">
          {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>

        {syncReport && !syncReport.error && (
          <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Sync Complete</span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Discord Members</p>
                <p className="text-white font-semibold">{syncReport.report.totalDiscordMembers}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Added</p>
                <p className="text-emerald-400 font-semibold">{syncReport.report.added}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Updated</p>
                <p className="text-blue-400 font-semibold">{syncReport.report.updated}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Skipped</p>
                <p className="text-slate-400 font-semibold">{syncReport.report.skipped}</p>
              </div>
            </div>
            {syncReport.report.errors.length > 0 && (
              <div className="mt-3 text-xs text-red-400 space-y-1">
                {syncReport.report.errors.slice(0, 5).map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}