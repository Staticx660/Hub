import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Settings as SettingsIcon, Users, Shield, Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      const appName = "RPCommand";
      const roleLabel = inviteRole === "admin" ? "Administrator" : "Staff Member";
      const loginUrl = window.location.origin + "/login";
      await base44.integrations.Core.SendEmail({
        to: inviteEmail,
        subject: `You've been invited to ${appName}`,
        body: `Hello,\n\nYou have been invited to join ${appName} as a ${roleLabel}.\n\nTo accept your invitation, please visit the link below to register or log in:\n${loginUrl}\n\nIf you did not expect this invitation, you can safely ignore this email.\n\n— ${appName} Team`
      });
      toast({ title: "Invitation sent", description: `Invited ${inviteEmail} as ${inviteRole} — notification email sent` });
      setInviteEmail("");
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account and invite team members</p>
      </div>

      {/* Current User */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" /> Your Account
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-400">Name</span>
            <span className="text-sm text-white">{currentUser?.full_name || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-slate-800">
            <span className="text-sm text-slate-400">Email</span>
            <span className="text-sm text-white">{currentUser?.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-slate-800">
            <span className="text-sm text-slate-400">Role</span>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">{currentUser?.role || "—"}</span>
          </div>
        </div>
      </div>

      {/* Invite Users */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-400" /> Invite Team Members
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Invite admins or staff to manage rosters. Admins have full access, users have view-only.
        </p>
        <div className="flex gap-3">
          <Input
            type="email"
            placeholder="email@example.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white flex-1"
          />
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="admin" className="text-white">Admin</SelectItem>
              <SelectItem value="user" className="text-white">User</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleInvite} disabled={!inviteEmail} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Invite
          </Button>
        </div>
      </div>

      {/* Discord Integration Info */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-purple-400" /> Discord Integration
        </h2>
        <p className="text-sm text-slate-400 mb-3">
          To send notifications to Discord, add a webhook URL to each department in the Departments page.
        </p>
        <p className="text-sm text-slate-400">
          Steps: Open Discord → Server Settings → Integrations → Webhooks → New Webhook → Copy URL → Paste in department settings.
        </p>
      </div>
    </div>
  );
}