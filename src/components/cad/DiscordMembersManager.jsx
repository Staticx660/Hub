import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IdCard, Search, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function DiscordMembersManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getDiscordMembers', {});
      if (res.data.error) {
        toast({ title: "Error", description: res.data.error, variant: "destructive" });
      } else {
        setMembers(res.data.members || []);
      }
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = members.filter(m => {
    const matchSearch = !search ||
      m.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.username?.toLowerCase().includes(search.toLowerCase()) ||
      m.discord_id?.includes(search);
    const matchStatus = filterStatus === "all" || (filterStatus === "registered" && m.is_registered) || (filterStatus === "pending" && !m.is_registered);
    return matchSearch && matchStatus;
  });

  const registeredCount = members.filter(m => m.is_registered).length;
  const pendingCount = members.length - registeredCount;

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-cad-border border-t-cad-accent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-cad-text flex items-center gap-2"><IdCard className="w-5 h-5 text-cad-accent" /> Discord Identifiers</h2>
          <p className="text-sm text-cad-muted mt-1">{members.length} Discord members · <span className="text-emerald-400">{registeredCount} registered</span> · <span className="text-amber-400">{pendingCount} pending</span></p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cad-surface border border-cad-border text-cad-muted hover:text-cad-text text-sm transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cad-dim" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, username, Discord ID..." className="bg-cad-surface border-cad-border text-cad-text pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-cad-surface border-cad-border text-cad-text h-9"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-cad-surface-2 border-cad-border">
            <SelectItem value="all" className="text-cad-text">All Members</SelectItem>
            <SelectItem value="registered" className="text-cad-text">Registered</SelectItem>
            <SelectItem value="pending" className="text-cad-text">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-cad-dim border-b border-cad-border">
            <th className="pb-2 pr-4">Discord Member</th><th className="pb-2 pr-4">Username</th><th className="pb-2 pr-4">Discord ID</th><th className="pb-2 pr-4">Status</th><th className="pb-2 pr-4">Linked Account</th>
          </tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.discord_id} className="border-b border-cad-border/30">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-7 h-7 rounded-full" /> : <div className="w-7 h-7 rounded-full bg-cad-surface-3 flex items-center justify-center text-xs font-bold text-cad-muted">{m.display_name?.charAt(0)?.toUpperCase()}</div>}
                    <span className="text-cad-text font-medium">{m.display_name}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-cad-muted">@{m.username}</td>
                <td className="py-2.5 pr-4 text-cad-dim font-mono text-xs">{m.discord_id}</td>
                <td className="py-2.5 pr-4">
                  {m.is_registered ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Registered</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-cad-muted text-xs">{m.linked_user?.email || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-cad-dim"><IdCard className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No Discord members found.</p></div>}
      </div>
    </div>
  );
}