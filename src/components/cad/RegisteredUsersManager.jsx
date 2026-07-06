import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, UserPlus, Mail, Loader2, Shield, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function RegisteredUsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const list = await base44.entities.User.list();
      setUsers(list);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      toast({ title: "Invitation sent", description: `Invited ${inviteEmail} as ${inviteRole}` });
      setInviteOpen(false); setInviteEmail(""); setInviteRole("user");
      load();
    } catch (e) { toast({ title: "Invite failed", description: e.message, variant: "destructive" }); }
    setInviting(false);
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.discord_id?.includes(search);
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-cad-border border-t-cad-accent rounded-full animate-spin" /></div>;

  const linkedCount = users.filter(u => u.discord_id).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-cad-text flex items-center gap-2"><Users className="w-5 h-5 text-cad-accent" /> Registered Members</h2>
        <p className="text-sm text-cad-muted mt-1">Users with platform accounts — {users.length} registered · {linkedCount} Discord linked</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cad-dim" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email, name, Discord ID..." className="bg-cad-surface border-cad-border text-cad-text pl-9" />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-36 bg-cad-surface border-cad-border text-cad-text h-9"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-cad-surface-2 border-cad-border">
              <SelectItem value="all" className="text-cad-text">All Roles</SelectItem>
              <SelectItem value="admin" className="text-cad-text">Admin</SelectItem>
              <SelectItem value="user" className="text-cad-text">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-cad-accent hover:bg-cad-accent/80 text-cad-bg-solid"><UserPlus className="w-4 h-4 mr-2" /> Invite User</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-cad-dim border-b border-cad-border">
            <th className="pb-2 pr-4">User</th><th className="pb-2 pr-4">Email</th><th className="pb-2 pr-4">Role</th><th className="pb-2 pr-4">Discord</th><th className="pb-2 pr-4">Joined</th>
          </tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-cad-border/30">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full" /> : <div className="w-7 h-7 rounded-full bg-cad-surface-3 flex items-center justify-center text-xs font-bold text-cad-muted">{(u.display_name || u.email || "?").charAt(0).toUpperCase()}</div>}
                    <span className="text-cad-text font-medium">{u.display_name || u.email?.split("@")[0]}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-cad-muted">{u.email}</td>
                <td className="py-2.5 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${u.role === "admin" ? "bg-purple-500/15 text-purple-400" : "bg-slate-500/15 text-slate-400"}`}>
                    {u.role === "admin" && <Shield className="w-3 h-3" />}{u.role}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  {u.discord_id ? <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Linked</span> : <span className="text-xs text-cad-dim flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Not linked</span>}
                </td>
                <td className="py-2.5 pr-4 text-cad-dim text-xs">{u.created_date ? new Date(u.created_date).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-cad-dim"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No users found.</p></div>}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-cad-surface border-cad-border">
          <DialogHeader><DialogTitle className="text-cad-text">Invite New User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-cad-muted">Email Address</Label><Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="bg-cad-surface-2 border-cad-border text-cad-text mt-1" placeholder="user@example.com" /></div>
            <div><Label className="text-cad-muted">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-cad-surface-2 border-cad-border text-cad-text"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-cad-surface-2 border-cad-border">
                  <SelectItem value="user" className="text-cad-text">User</SelectItem>
                  <SelectItem value="admin" className="text-cad-text">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} className="border-cad-border text-cad-muted">Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || inviting} className="bg-cad-accent hover:bg-cad-accent/80 text-cad-bg-solid">{inviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />} Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}