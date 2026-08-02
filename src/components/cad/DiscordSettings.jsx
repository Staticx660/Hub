import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw, Users, Loader2, CheckCircle2 } from "lucide-react";
import { MSection } from "@/components/mdt/ui/formFields";
import { Btn, Field } from "@/components/mdt/ui/primitives";

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
      const res = await base44.functions.invoke('syncCADPersonnel', {});
      if (res.data.error) {
        toast({ title: "Sync failed", description: res.data.error, variant: "destructive" });
      } else {
        const report = res.data.report;
        setPersonnelReport(report);
        toast({ title: "Personnel synced", description: `${report.added} added, ${report.updated} updated${report.skipped > 0 ? `, ${report.skipped} skipped` : ""}` });
      }
    } catch (e) { toast({ title: "Sync failed", description: e.message, variant: "destructive" }); }
    setSyncingPersonnel(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  return (
    <div className="max-w-3xl space-y-2.5">
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

      <MSection title="Sync Roster from Discord" actions={<Btn variant="primary" icon={syncingRoster ? Loader2 : RefreshCw} disabled={syncingRoster} onClick={syncRoster}>Sync</Btn>}>
        <p className="text-[11.5px] text-mdt-muted">Pulls all Discord members with department roles into the Roster.</p>
        {rosterReport && (
          <div className="mt-2 flex items-center gap-1.5 border border-mdt-line bg-mdt-bg/40 p-2 text-[11.5px] text-mdt-muted">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            Added: {rosterReport.added} · Updated: {rosterReport.updated} · Skipped: {rosterReport.skipped}
            {rosterReport.errors?.length > 0 && <span className="text-red-300">· {rosterReport.errors.length} errors</span>}
          </div>
        )}
      </MSection>

      <MSection title="Sync CAD Personnel from Roster" actions={<Btn variant="primary" icon={syncingPersonnel ? Loader2 : RefreshCw} disabled={syncingPersonnel} onClick={syncPersonnel}>Sync</Btn>}>
        <p className="text-[11.5px] text-mdt-muted">Creates and updates CAD personnel from the Roster. Roster departments are matched to CAD departments by Discord Role ID — both must have the same role ID set.</p>
        {personnelReport && (
          <div className="mt-2 flex items-center gap-1.5 border border-mdt-line bg-mdt-bg/40 p-2 text-[11.5px] text-mdt-muted">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            Added: {personnelReport.added} · Updated: {personnelReport.updated} · Skipped: {personnelReport.skipped || 0} · Total roster members: {personnelReport.total}
          </div>
        )}
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