import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Search, Loader2, Truck } from "lucide-react";

const OCRP_LOGO = "https://media.base44.com/images/public/6a441f279b9d3cd678958799/5a43a1b46_OCRP20.png";

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
      // Auto-pull from roster by matching user's name
      autoLookupRoster();
      // Load apparatus groups for Fire/EMS
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
    // First: use the linked Discord ID to find the roster member
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
    // Fallback: match by full name
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
        setForm(prev => ({
          ...prev,
          name: match.name || "",
          callsign: match.callsign || "",
          rank: match.rank || "",
        }));
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
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <img src={OCRP_LOGO} alt="OCRP" className="w-12 h-12 rounded-lg object-cover" />
            <div>
              <DialogTitle className="text-white">Clock In — {department?.name}</DialogTitle>
              <p className="text-sm text-slate-400">Enter your details before going on duty</p>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <Label className="text-slate-300 text-sm font-semibold">Link Discord (Optional)</Label>
            <p className="text-xs text-slate-500 mb-2">Enter your Discord ID or username to pull your info from the Roster</p>
            <div className="flex gap-2">
              <Input
                value={discordQuery}
                onChange={(e) => setDiscordQuery(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Discord ID or username"
                onKeyDown={(e) => e.key === "Enter" && lookupDiscord()}
              />
              <Button onClick={lookupDiscord} disabled={searching} variant="outline" className="border-slate-700 text-slate-300 gap-2">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Lookup
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-slate-300">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="Your name" />
            </div>
            <div>
              <Label className="text-slate-300">Callsign</Label>
              <Input value={form.callsign} onChange={(e) => setForm({ ...form, callsign: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. 1A-01" />
            </div>
            <div>
              <Label className="text-slate-300">Rank</Label>
              <Input value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Officer" />
            </div>
          </div>
          {isFireEMS && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <Label className="text-slate-300 text-sm font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Assigned Apparatus</Label>
              <p className="text-xs text-slate-500 mb-2">Select which apparatus you are riding on — this is required for Fire & EMS</p>
              <Select value={form.group_id} onValueChange={selectGroup}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder={groups.length === 0 ? "No apparatus available — ask admin to create groups" : "Select apparatus..."} /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{groups.map(g => {
                  const crewCount = sessions.filter(s => s.group_id === g.id).length;
                  const maxSeats = g.max_seats || 0;
                  const isFull = maxSeats > 0 && crewCount >= maxSeats;
                  return <SelectItem key={g.id} value={g.id} className="text-white" disabled={isFull}>{g.name} ({crewCount}{maxSeats ? `/${maxSeats}` : ""} seats){isFull ? " — Full" : ""}</SelectItem>;
                })}</SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300">Cancel</Button>
          <Button onClick={() => onClockIn(form)} disabled={!form.name || (isFireEMS && !form.group_id)} className="bg-blue-600 hover:bg-blue-700">Clock In & Start MDT</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}