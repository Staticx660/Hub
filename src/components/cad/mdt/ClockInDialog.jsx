import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Search, Loader2, Truck, Clock } from "lucide-react";
import { Btn } from "@/components/mdt/ui/primitives";

const input = "h-7 w-full px-2 bg-mdt-bg border border-mdt-line-2 text-[12px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";
const label = "block text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1";

export default function ClockInDialog({ open, onOpenChange, department, user, onClockIn }) {
  const [form, setForm] = useState({ name: "", callsign: "", rank: "", group_id: "", group_name: "" });
  const [discordQuery, setDiscordQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [groups, setGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const { toast } = useToast();

  const isFireEMS = department?.category === "Fire" || department?.category === "EMS";

  useEffect(() => {
    if (open) {
      setForm({ name: "", callsign: "", rank: "", group_id: "", group_name: "" });
      setDiscordQuery("");
      setGroups([]);
      autoLookupRoster();
      if (isFireEMS && department?.id) loadGroups();
    }
  }, [open]);

  const loadGroups = async () => {
    try {
      const [g, s] = await Promise.all([
        base44.entities.CADUnitGroup.filter({ department_id: department.id }),
        base44.entities.CADSession.filter({ department_id: department.id, is_active: true }),
      ]);
      setGroups(g); setSessions(s);
    } catch (e) { setGroups([]); setSessions([]); }
  };

  const selectGroup = (groupId) => {
    const g = groups.find(x => x.id === groupId);
    setForm(prev => ({ ...prev, group_id: groupId, group_name: g?.name || "" }));
  };

  const autoLookupRoster = async () => {
    if (user?.discord_id) {
      try {
        const members = await base44.entities.RosterMember.filter({ discord_id: user.discord_id });
        if (members.length > 0) {
          const match = members[0];
          setForm(prev => ({ ...prev, name: match.name || "", callsign: match.callsign || "", rank: match.rank || "" }));
          setDiscordQuery(match.discord_username || match.discord_id || "");
          return;
        }
      } catch (e) { /* fall through to name match */ }
    }
    if (!user?.full_name) return;
    try {
      const members = await base44.entities.RosterMember.list();
      const match = members.find(
        (m) => m.name?.toLowerCase().trim() === user.full_name?.toLowerCase().trim()
      );
      if (match) {
        setForm(prev => ({ ...prev, name: match.name || "", callsign: match.callsign || "", rank: match.rank || "" }));
        setDiscordQuery(match.discord_username || match.discord_id || "");
      }
    } catch (e) { /* silent fail — user can manually enter */ }
  };

  const lookupDiscord = async () => {
    if (!discordQuery.trim()) return;
    setSearching(true);
    try {
      const members = await base44.entities.RosterMember.list();
      const match = members.find(
        (m) =>
          m.discord_id === discordQuery ||
          m.discord_username?.toLowerCase() === discordQuery.toLowerCase() ||
          m.name?.toLowerCase().trim() === discordQuery.toLowerCase().trim()
      );
      if (match) {
        setForm(prev => ({ ...prev, name: match.name || "", callsign: match.callsign || "", rank: match.rank || "" }));
        toast({ title: "Roster match found", description: `Linked to ${match.name}` });
      } else {
        toast({ title: "No match found", description: "No roster member with that info", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSearching(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mdt p-0 gap-0 max-w-lg bg-mdt-surface border border-mdt-line text-mdt-text rounded-none">
        <div className="h-9 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold leading-tight truncate">Terminal Sign-On</div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-mdt-dim truncate">{department?.name}</div>
          </div>
        </div>

        <div className="p-2.5 space-y-2.5">
          <div className="border border-mdt-line bg-mdt-bg/40 p-2.5">
            <label className={label}>Roster Lookup (Optional)</label>
            <div className="flex items-center gap-1.5">
              <input
                value={discordQuery}
                onChange={(e) => setDiscordQuery(e.target.value)}
                className={input}
                placeholder="Discord ID, username or name"
                onKeyDown={(e) => e.key === "Enter" && lookupDiscord()}
              />
              <Btn icon={searching ? Loader2 : Search} disabled={searching} onClick={lookupDiscord}>Lookup</Btn>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-2">
              <label className={label}>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Your name" />
            </div>
            <div>
              <label className={label}>Callsign</label>
              <input value={form.callsign} onChange={(e) => setForm({ ...form, callsign: e.target.value })} className={`${input} font-mono`} placeholder="1A-01" />
            </div>
            <div>
              <label className={label}>Rank</label>
              <input value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} className={input} placeholder="Officer" />
            </div>
          </div>

          {isFireEMS && (
            <div className="border border-mdt-line bg-mdt-bg/40 p-2.5">
              <label className={`${label} flex items-center gap-1.5`}><Truck className="w-3 h-3" /> Assigned Apparatus (Required)</label>
              <select value={form.group_id} onChange={(e) => selectGroup(e.target.value)} className={input}>
                <option value="">{groups.length === 0 ? "No apparatus available — ask an admin" : "Select apparatus…"}</option>
                {groups.map(g => {
                  const crewCount = sessions.filter(s => s.group_id === g.id).length;
                  const maxSeats = g.max_seats || 0;
                  const isFull = maxSeats > 0 && crewCount >= maxSeats;
                  return <option key={g.id} value={g.id} disabled={isFull}>{g.name} ({crewCount}{maxSeats ? `/${maxSeats}` : ""} seats){isFull ? " — Full" : ""}</option>;
                })}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-1.5 h-10 px-2.5 border-t border-mdt-line bg-mdt-surface-2">
          <Btn onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" icon={Clock} disabled={!form.name || (isFireEMS && !form.group_id)} onClick={() => onClockIn(form)}>Clock In</Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}