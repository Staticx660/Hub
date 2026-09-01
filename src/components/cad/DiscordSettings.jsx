import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw, Users, Loader2, CheckCircle2, Terminal } from "lucide-react";
import { MSection } from "@/components/mdt/ui/formFields";
import { Btn, Field } from "@/components/mdt/ui/primitives";
import DiscordRoleMappings from "@/components/cad/discord/DiscordRoleMappings";

export default function DiscordSettings() {
  const [guild, setGuild] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [report, setReport] = useState(null);
  const [registering, setRegistering] = useState(false);
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

  // Single sync for both systems: roster from Discord, then CAD personnel from roster.
  const syncAll = async () => {
    setSyncing(true);
    try {
      const rosterRes = await base44.functions.invoke('syncDiscordMembers', {});
      if (rosterRes.data?.error) throw new Error(rosterRes.data.error);
      const cadRes = await base44.functions.invoke('syncCADPersonnel', {});
      setReport({ roster: rosterRes.data.report, cad: cadRes.data?.report, cadError: cadRes.data?.error });
      toast({
        title: "Roster & CAD synced",
        description: `Roster: ${rosterRes.data.report.added} added, ${rosterRes.data.report.updated} updated${cadRes.data?.error ? ` · CAD error: ${cadRes.data.error}` : ` · CAD: ${cadRes.data?.report?.added || 0} added, ${cadRes.data?.report?.updated || 0} updated`}`,
      });
    } catch (e) { toast({ title: "Sync failed", description: e.message, variant: "destructive" }); }
    setSyncing(false);
  };

  const registerCommands = async () => {
    setRegistering(true);
    try {
      const res = await base44.functions.invoke('registerDiscordCommands', {});
      if (res.data?.error) toast({ title: "Registration failed", description: res.data.error, variant: "destructive" });
      else toast({ title: "Slash commands registered", description: "/loa-request, /clock-in and /clock-out are now available." });
    } catch (e) { toast({ title: "Registration failed", description: e.message, variant: "destructive" }); }
    setRegistering(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  return (
    <div className="max-w-5xl space-y-2.5">
      <MSection title="Discord Guild">
        <div className="grid grid-cols-3 gap-2.5">
          <Field label="Guild ID" value={<span className="font-mono">{guild ? guild.id : "—"}</span>} />
          <Field label="Bot Token" value={<span className="text-emerald-300">Active</span>} />
          <Field label="Public Key" value={<span className="text-emerald-300">Set</span>} />
        </div>
        <p className="text-[11px] text-mdt-dim mt-2">Discord secrets are managed in the app dashboard under Environment Variables and are used for all Discord integrations.</p>
        {guild ? (
          <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-mdt-line">
            {guild.icon && <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt="" className="w-10 h-10 border border-mdt-line-2" />}
            <div>
              <p className="text-[12.5px] text-mdt-text">{guild.name}</p>
              <p className="text-[11px] text-mdt-dim">Members: {guild.approximate_member_count || "—"} · Online: {guild.approximate_presence_count || "—"} · Roles: {roles.length}</p>
            </div>
          </div>
        ) : (
          <p className="text-[11.5px] text-red-300 mt-2.5 pt-2.5 border-t border-mdt-line">Could not load guild data. Make sure DISCORD_GUILD_ID and DISCORD_BOT_TOKEN are set.</p>
        )}
      </MSection>

      <DiscordRoleMappings roles={roles} />

      <MSection title="Sync Roster & CAD" actions={<Btn variant="primary" icon={syncing ? Loader2 : RefreshCw} disabled={syncing} onClick={syncAll}>{syncing ? "Syncing…" : "Sync Now"}</Btn>}>
        <p className="text-[11.5px] text-mdt-muted">One sync for both systems: Discord members with a mapped role are added or updated on the Roster, then CAD personnel are rebuilt from the Roster (matched by Discord Role ID). Also runs automatically every hour.</p>
        {report && (
          <div className="mt-2 border border-mdt-line bg-mdt-bg/40 p-2 text-[11.5px] text-mdt-muted space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              Roster — Added: {report.roster.added} · Updated: {report.roster.updated} · Skipped: {report.roster.skipped}
              {report.roster.errors?.length > 0 && <span className="text-red-300">· {report.roster.errors.length} errors</span>}
            </div>
            <div className="pl-5">
              {report.cadError
                ? <span className="text-red-300">CAD Personnel — {report.cadError}</span>
                : <>CAD Personnel — Added: {report.cad?.added || 0} · Updated: {report.cad?.updated || 0} · Skipped: {report.cad?.skipped || 0}</>}
            </div>
          </div>
        )}
      </MSection>

      <MSection title="Slash Commands" actions={<Btn variant="primary" icon={registering ? Loader2 : Terminal} disabled={registering} onClick={registerCommands}>{registering ? "Registering…" : "Register"}</Btn>}>
        <p className="text-[11.5px] text-mdt-muted">Registers /loa-request, /clock-in and /clock-out in your Discord server so members can use them without leaving Discord.</p>
      </MSection>

      {roles.length > 0 && (
        <MSection title={`Available Roles — ${roles.length}`}>
          <p className="text-[11.5px] text-mdt-muted mb-1.5">Copy these Role IDs into your department settings to restrict access.</p>
          <div className="max-h-56 overflow-auto mdt-scroll border border-mdt-line divide-y divide-mdt-line">
            {roles.map(r => (
              <div key={r.id} className="flex items-center justify-between px-2 h-7">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 flex-shrink-0" style={{ background: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#64748b' }} />
                  <span className="text-[12px] text-mdt-text truncate">{r.name}</span>
                </span>
                <span className="text-[10.5px] font-mono text-mdt-dim">{r.id}</span>
              </div>
            ))}
          </div>
        </MSection>
      )}

      <div className="flex justify-end">
        <Btn icon={Users} onClick={load}>Reload Guild Data</Btn>
      </div>
    </div>
  );
}