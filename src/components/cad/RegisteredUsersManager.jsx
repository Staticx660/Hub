import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Users, Search, UserPlus, Mail, Loader2, Crown, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Btn, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";
import DataTable from "@/components/mdt/ui/DataTable";

const input = "h-7 px-2 bg-mdt-bg border border-mdt-line-2 text-[12px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";
const cap = "text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim";

export default function RegisteredUsersManager() {
  const [users, setUsers] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const { toast } = useToast();

  const load = async () => {
    try {
      const [list, p] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.CADPersonnel.list().catch(() => []),
      ]);
      setUsers(list);
      setPersonnel(p);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const personnelByDiscordId = {};
  personnel.forEach(p => { if (p.discord_id) personnelByDiscordId[p.discord_id] = p; });

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

  const toggleAdmin = async (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    setUpdatingIds(prev => new Set(prev).add(user.id));
    try {
      await base44.entities.User.update(user.id, { role: newRole });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      toast({ title: `${newRole === "admin" ? "Admin" : "User"} role ${newRole === "admin" ? "granted" : "revoked"}`, duration: 2000 });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setUpdatingIds(prev => { const n = new Set(prev); n.delete(user.id); return n; }); }
  };

  const toggleSupervisor = async (user) => {
    const cp = personnelByDiscordId[user.discord_id];
    if (!cp) { toast({ title: "No personnel record", description: "This user has no linked CAD personnel record to update.", variant: "destructive" }); return; }
    setUpdatingIds(prev => new Set(prev).add(user.id));
    try {
      await base44.entities.CADPersonnel.update(cp.id, { is_supervisor: !cp.is_supervisor });
      setPersonnel(prev => prev.map(p => p.id === cp.id ? { ...p, is_supervisor: !cp.is_supervisor } : p));
      toast({ title: `Supervisor ${!cp.is_supervisor ? "granted" : "revoked"}`, duration: 2000 });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setUpdatingIds(prev => { const n = new Set(prev); n.delete(user.id); return n; }); }
  };

  const removeUser = async (user) => {
    const cp = user.discord_id ? personnelByDiscordId[user.discord_id] : null;
    if (!window.confirm(`Remove ${user.email} from the system?\n\nThis deletes their account${cp ? " and their CAD personnel record" : ""}. This cannot be undone.`)) return;
    setUpdatingIds(prev => new Set(prev).add(user.id));
    try {
      if (cp) {
        await base44.entities.CADPersonnel.delete(cp.id);
        setPersonnel(prev => prev.filter(p => p.id !== cp.id));
      }
      await base44.entities.User.delete(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast({ title: "User removed", description: user.email });
    } catch (e) { toast({ title: "Remove failed", description: e.message, variant: "destructive" }); }
    finally { setUpdatingIds(prev => { const n = new Set(prev); n.delete(user.id); return n; }); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.discord_id?.includes(search);
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  const linkedCount = users.filter(u => u.discord_id).length;

  const columns = [
    { key: "display_name", label: "User", render: (u) => (
      <span className="flex items-center gap-1.5">
        <span className="truncate">{u.display_name || u.email?.split("@")[0]}</span>
        {updatingIds.has(u.id) && <Loader2 className="w-3 h-3 animate-spin text-mdt-accent" />}
      </span>
    )},
    { key: "email", label: "Email", width: 190 },
    { key: "role", label: "Admin Role", width: 120, render: (u) => (
      <button onClick={() => toggleAdmin(u)}>
        <StatusPill tone={u.role === "admin" ? "info" : "neutral"}><Crown className="w-2.5 h-2.5" /> {u.role === "admin" ? "Admin" : "User"}</StatusPill>
      </button>
    )},
    { key: "supervisor", label: "Supervisor", width: 120, sortable: false, render: (u) => {
      const cp = u.discord_id ? personnelByDiscordId[u.discord_id] : null;
      if (!cp) return <span className="text-mdt-dim">—</span>;
      return (
        <button onClick={() => toggleSupervisor(u)}>
          <StatusPill tone={cp.is_supervisor ? "ok" : "neutral"}><Eye className="w-2.5 h-2.5" /> {cp.is_supervisor ? "Supervisor" : "Standard"}</StatusPill>
        </button>
      );
    }},
    { key: "discord_id", label: "Discord", width: 100, render: (u) => (
      <StatusPill tone={u.discord_id ? "ok" : "neutral"}>{u.discord_id ? "Linked" : "None"}</StatusPill>
    )},
    { key: "created_date", label: "Joined", width: 100, mono: true, render: (u) => u.created_date ? new Date(u.created_date).toLocaleDateString() : "—" },
    { key: "remove", label: "", width: 46, sortable: false, render: (u) => (
      <Btn variant="danger" icon={Trash2} title="Remove user" disabled={updatingIds.has(u.id)} onClick={() => removeUser(u)} className="h-6 px-1.5" />
    )},
  ];

  return (
    <div className="flex flex-col h-full min-h-0 border border-mdt-line bg-mdt-surface">
      <div className="flex items-center gap-1.5 h-9 px-2 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mdt-dim" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Email, name, Discord ID" className={`${input} w-64 pl-7`} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={input}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <span className="text-[11px] font-mono text-mdt-dim ml-2">{users.length} REGISTERED · {linkedCount} LINKED</span>
        <Btn variant="primary" icon={UserPlus} className="ml-auto" onClick={() => setInviteOpen(true)}>Invite User</Btn>
      </div>

      <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
        {filtered.length === 0
          ? <EmptyState icon={Users} title="No users found" />
          : <DataTable columns={columns} rows={filtered} emptyMessage="No users found" />}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="mdt p-0 gap-0 max-w-md bg-mdt-surface border border-mdt-line text-mdt-text rounded-none">
          <div className="h-9 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
            <span className="text-[12.5px] font-semibold">Invite User</span>
          </div>
          <div className="p-2.5 space-y-2.5">
            <div>
              <label className={`${cap} block mb-1`}>Email Address</label>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className={`${input} w-full`} placeholder="user@example.com" />
            </div>
            <div>
              <label className={`${cap} block mb-1`}>Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className={`${input} w-full`}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 h-10 px-2.5 border-t border-mdt-line bg-mdt-surface-2">
            <Btn onClick={() => setInviteOpen(false)}>Cancel</Btn>
            <Btn variant="primary" icon={inviting ? Loader2 : Mail} disabled={!inviteEmail || inviting} onClick={handleInvite}>Send Invite</Btn>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}