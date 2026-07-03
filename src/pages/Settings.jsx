import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield, Plus, UserPlus, ArrowLeft,
  MessageCircle, Check, Unlink, Upload, Loader2, User, Lock, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discordIdInput, setDiscordIdInput] = useState("");
  const [linking, setLinking] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setDisplayName(user.display_name || user.full_name || "");
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleLinkDiscord = async () => {
    if (!discordIdInput.trim()) return;
    setLinking(true);
    try {
      const res = await base44.functions.invoke('linkDiscordAccount', { discord_id: discordIdInput.trim() });
      if (res.data.error) {
        toast({ title: "Linking failed", description: res.data.error, variant: "destructive" });
      } else {
        const updated = await base44.auth.me();
        setCurrentUser(updated);
        setDiscordIdInput("");
        toast({
          title: "Discord linked!",
          description: res.data.rosterMember
            ? `Linked as ${res.data.rosterMember.name} (${res.data.rosterMember.rank})`
            : `Linked to ${res.data.displayName}`
        });
      }
    } catch (e) { toast({ title: "Linking failed", description: e.message, variant: "destructive" }); }
    setLinking(false);
  };

  const handleUnlinkDiscord = async () => {
    try {
      await base44.auth.updateMe({ discord_id: null, avatar_url: null });
      const updated = await base44.auth.me();
      setCurrentUser(updated);
      await checkUserAuth();
      toast({ title: "Discord unlinked", description: "Your Discord account has been disconnected." });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await base44.auth.updateMe({ display_name: displayName });
      const updated = await base44.auth.me();
      setCurrentUser(updated);
      await checkUserAuth();
      toast({ title: "Name saved", description: "Your display name has been updated." });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSavingName(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: uploadRes.file_url });
      const updated = await base44.auth.me();
      setCurrentUser(updated);
      await checkUserAuth();
      toast({ title: "Profile picture updated" });
    } catch (err) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    setUploadingAvatar(false);
  };

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
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const isAdmin = currentUser?.role === "admin";
  const hasDiscord = !!currentUser?.discord_id;
  const avatar = currentUser?.avatar_url;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto p-6 lg:p-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-slate-400 mt-1">Manage your account, Discord link, and profile</p>
          </div>

          {/* Discord Linking */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-indigo-400" /> Discord Linking
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Link your Discord account to get access to your CAD departments, roles, and callsigns. The system reads your Discord roles to determine which departments you can access.
            </p>

            {hasDiscord ? (
              <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-4">
                {avatar ? (
                  <img src={avatar} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-indigo-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">Connected</span>
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-xs text-slate-400 truncate">Discord ID: {currentUser.discord_id}</p>
                </div>
                <Button onClick={handleUnlinkDiscord} variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Unlink className="w-3.5 h-3.5 mr-1.5" /> Unlink
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-300 text-sm">Your Discord ID</Label>
                  <Input
                    placeholder="e.g. 1459547602230968330"
                    value={discordIdInput}
                    onChange={e => setDiscordIdInput(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    To find your Discord ID: enable Developer Mode in Discord Settings → Advanced, then right-click your username → Copy User ID.
                  </p>
                </div>
                <Button onClick={handleLinkDiscord} disabled={linking || !discordIdInput.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                  {linking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
                  Link Discord
                </Button>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" /> Profile
            </h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-slate-500">
                    {(currentUser?.display_name || currentUser?.full_name || "U")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <Label className="text-slate-300 text-sm cursor-pointer inline-flex items-center">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </Label>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG up to 5MB</p>
              </div>
            </div>

            <div className="mb-4">
              <Label className="text-slate-300 text-sm">Display Name</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white flex-1"
                  placeholder="Your display name"
                />
                <Button onClick={handleSaveName} disabled={savingName || !displayName.trim()} className="bg-blue-600 hover:bg-blue-700">
                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-800">
              <div>
                <span className="text-sm text-slate-400">Email</span>
                <p className="text-sm text-white">{currentUser?.email || "—"}</p>
              </div>
              <Lock className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>

          {/* Security */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Security
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-white">Password</span>
                <p className="text-xs text-slate-400">Reset your password via email</p>
              </div>
              <Button onClick={() => navigate("/forgot-password")} variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <Mail className="w-3.5 h-3.5 mr-1.5" /> Reset Password
              </Button>
            </div>
          </div>

          {/* Admin: Invite Users */}
          {isAdmin && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" /> Invite Team Members
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Invite admins or staff. Admins have full access, users have limited access.
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
          )}
        </div>
      </div>
    </div>
  );
}