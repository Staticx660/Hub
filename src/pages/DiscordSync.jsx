import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  RefreshCw, Save, AlertCircle, CheckCircle, Loader2,
  Server, Link2, Terminal
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
  const [registering, setRegistering] = useState(false);
  const [loaRoleMappings, setLoaRoleMappings] = useState({});
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
        const loaMappings = {};
        for (const dept of depts || []) {
          if (dept.discord_role_id) {
            mappings[dept.id] = dept.discord_role_id;
          }
          if (dept.discord_supervisor_role_id) {
            supMappings[dept.id] = dept.discord_supervisor_role_id;
          }
          if (dept.loa_discord_role_id) {
            loaMappings[dept.id] = dept.loa_discord_role_id;
          }
        }
        setRoleMappings(mappings);
        setSupervisorMappings(supMappings);
        setLoaRoleMappings(loaMappings);
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

  const handleLoaRoleChange = (deptId, value) => {
    setLoaRoleMappings(prev => ({ ...prev, [deptId]: value }));
  };

  const handleSaveMappings = async () => {
    setSaving(true);
    try {
      for (const dept of departments) {
        const newRoleId = roleMappings[dept.id] || "";
        const newSupRoleId = supervisorMappings[dept.id] || "";
        const newLoaRoleId = loaRoleMappings[dept.id] || "";
        const updates = {};
        if ((dept.discord_role_id || "") !== newRoleId) updates.discord_role_id = newRoleId;
        if ((dept.discord_supervisor_role_id || "") !== newSupRoleId) updates.discord_supervisor_role_id = newSupRoleId;
        if ((dept.loa_discord_role_id || "") !== newLoaRoleId) updates.loa_discord_role_id = newLoaRoleId;
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

  const handleRegisterCommands = async () => {
    setRegistering(true);
    try {
      const res = await base44.functions.invoke("registerDiscordCommands", {});
      if (res.data?.error) {
        toast({ title: "Registration failed", description: res.data.error, variant: "destructive" });
      } else {
        toast({
          title: "Slash commands registered",
          description: `/loa-request, /clock-in, and /clock-out are now available in your Discord server.`
        });
      }
    } catch (e) {
      toast({ title: "Registration failed", description: e.message, variant: "destructive" });
    } finally {
      setRegistering(false);
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
        <h1 className="text-2xl font-bold text-mdt-text">Discord Sync</h1>
        <p className="text-sm text-mdt-muted mt-1">
          Sync Discord members into your roster by mapping roles to departments
        </p>
      </div>

      {/* Guild info */}
      <div className="bg-mdt-surface border border-mdt-line p-6">
        <h2 className="text-lg font-semibold text-mdt-text mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" /> Connected Server
        </h2>
        {guild ? (
          <div className="flex items-center gap-3">
            {guildIconUrl && (
              <img src={guildIconUrl} alt={guild.name} className="w-12 h-12 rounded-full" />
            )}
            <div>
              <p className="text-mdt-text font-medium">{guild.name}</p>
              <p className="text-xs text-mdt-dim">{guild.member_count || "—"} members</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Could not connect to Discord. Check your bot token and guild ID.
          </p>
        )}
      </div>

      {/* Role mapping table */}
      <div className="bg-mdt-surface border border-mdt-line p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-mdt-text flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" /> Role Mapping
          </h2>
          <Button onClick={handleSaveMappings} disabled={saving} size="sm" className="bg-mdt-accent hover:brightness-110 rounded-none">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Mappings
          </Button>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-4 pb-2 border-b border-mdt-line">
            <div className="flex-1">
              <p className="text-xs font-medium text-mdt-dim uppercase tracking-wide">Department</p>
            </div>
            <div className="flex flex-col gap-1.5 w-52">
              <p className="text-xs font-medium text-mdt-muted">Member Role ID</p>
              <p className="text-xs font-medium text-amber-500/70">Supervisor Role ID</p>
              <p className="text-xs font-medium text-cyan-500/70">LOA Role ID</p>
            </div>
          </div>
          {departments.map(dept => (
            <div key={dept.id} className="flex items-center gap-4 py-3 border-b border-mdt-line last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-mdt-text truncate">{dept.name}</p>
                <p className="text-xs text-mdt-dim">{dept.category}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Input
                  value={roleMappings[dept.id] || ""}
                  onChange={(e) => handleRoleChange(dept.id, e.target.value)}
                  placeholder="Member Role ID"
                  className="w-52 bg-mdt-bg border-mdt-line-2 text-mdt-text placeholder:text-mdt-dim font-mono text-xs h-8"
                />
                <Input
                  value={supervisorMappings[dept.id] || ""}
                  onChange={(e) => handleSupervisorChange(dept.id, e.target.value)}
                  placeholder="Supervisor Role ID"
                  className="w-52 bg-mdt-bg border-amber-700/50 text-mdt-text placeholder:text-mdt-dim font-mono text-xs h-8"
                />
                <Input
                  value={loaRoleMappings[dept.id] || ""}
                  onChange={(e) => handleLoaRoleChange(dept.id, e.target.value)}
                  placeholder="LOA Role ID"
                  className="w-52 bg-mdt-bg border-cyan-700/50 text-mdt-text placeholder:text-mdt-dim font-mono text-xs h-8"
                />
              </div>
            </div>
          ))}
          {departments.length === 0 && (
            <p className="text-sm text-mdt-muted py-4 text-center">No departments yet. Create departments first.</p>
          )}
        </div>

        {/* Available roles reference */}
        {roles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-mdt-line">
            <p className="text-xs text-mdt-dim mb-2">Available Discord Roles (copy the ID you need):</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {roles.filter(r => r.name !== "@everyone").map(r => (
                <div key={r.id} className="px-2 py-1 bg-mdt-surface-2 border border-mdt-line-2 text-xs text-mdt-muted font-mono">
                  <span className="text-mdt-text">{r.name}</span> → {r.id}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slash command registration */}
      <div className="bg-mdt-surface border border-mdt-line p-6">
        <h2 className="text-lg font-semibold text-mdt-text mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" /> Slash Commands
        </h2>
        <p className="text-sm text-mdt-muted mb-4">
          Register the <code className="text-cyan-400 bg-mdt-surface-2 px-1.5 py-0.5 rounded text-xs">/loa-request</code> slash command in your Discord server.
          This lets members submit LOA requests directly from Discord.
        </p>
        <Button onClick={handleRegisterCommands} disabled={registering} className="bg-mdt-accent hover:brightness-110 rounded-none">
          {registering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Terminal className="w-4 h-4 mr-2" />}
          {registering ? "Registering..." : "Register Slash Command"}
        </Button>
      </div>

      {/* Sync panel */}
      <div className="bg-mdt-surface border border-mdt-line p-6">
        <h2 className="text-lg font-semibold text-mdt-text mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-400" /> Sync Members
        </h2>
        <p className="text-sm text-mdt-muted mb-4">
          Pull all Discord members who have a mapped role into the roster. New members are added;
          existing members are updated. Syncs also run automatically every hour.
        </p>
        <Button onClick={handleSync} disabled={syncing} className="bg-mdt-accent hover:brightness-110 rounded-none">
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
                <p className="text-mdt-dim text-xs">Discord Members</p>
                <p className="text-mdt-text font-semibold">{syncReport.report.totalDiscordMembers}</p>
              </div>
              <div>
                <p className="text-mdt-dim text-xs">Added</p>
                <p className="text-emerald-400 font-semibold">{syncReport.report.added}</p>
              </div>
              <div>
                <p className="text-mdt-dim text-xs">Updated</p>
                <p className="text-blue-400 font-semibold">{syncReport.report.updated}</p>
              </div>
              <div>
                <p className="text-mdt-dim text-xs">Skipped</p>
                <p className="text-mdt-muted font-semibold">{syncReport.report.skipped}</p>
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