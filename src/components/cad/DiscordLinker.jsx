import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Link2, Unlink, CheckCircle2, MessageCircle, AlertCircle } from "lucide-react";

export default function DiscordLinker() {
  const { user, checkUserAuth } = useAuth();
  const [discordId, setDiscordId] = useState("");
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [linkedInfo, setLinkedInfo] = useState(null);
  const { toast } = useToast();

  const isLinked = !!user?.discord_id;

  const handleLink = async () => {
    if (!discordId.trim()) return;
    setLinking(true);
    setLinkedInfo(null);
    try {
      const res = await base44.functions.invoke("linkDiscordAccount", { discord_id: discordId.trim() });
      const data = res.data;
      if (data.error) {
        toast({ title: "Linking failed", description: data.error, variant: "destructive" });
      } else {
        setLinkedInfo(data);
        setDiscordId("");
        await checkUserAuth();
        toast({ title: "Discord linked", description: `Connected as ${data.displayName}`, duration: 3000 });
      }
    } catch (e) {
      toast({ title: "Linking failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await base44.auth.updateMe({ discord_id: null, avatar_url: null });
      await checkUserAuth();
      setLinkedInfo(null);
      toast({ title: "Discord unlinked", description: "Your Discord account has been disconnected." });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="cad-card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#5865F2]/15 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-[#5865F2]" />
        </div>
        <div>
          <h3 className="font-semibold text-cad-text">Discord Account</h3>
          <p className="text-xs text-cad-muted mt-0.5">
            Link your Discord to sync your rank, callsign, and department automatically.
          </p>
        </div>
      </div>

      {isLinked ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-400">Account Linked</p>
              <p className="text-xs text-cad-muted font-mono truncate">
                ID: {user.discord_id}
              </p>
            </div>
            {user.avatar_url && (
              <img src={user.avatar_url} alt="Discord avatar" className="w-10 h-10 rounded-full ring-2 ring-emerald-500/30" />
            )}
          </div>

          {linkedInfo && (
            <div className="text-xs text-cad-muted bg-cad-surface-2/40 rounded-lg p-3 space-y-1">
              <p><span className="text-cad-dim">Username:</span> {linkedInfo.username}</p>
              {linkedInfo.rosterMember && (
                <p><span className="text-cad-dim">Roster:</span> {linkedInfo.rosterMember.rank || "—"} · {linkedInfo.rosterMember.callsign || "—"}</p>
              )}
            </div>
          )}

          <Button
            onClick={handleUnlink}
            disabled={unlinking}
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            {unlinking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlink className="w-4 h-4 mr-2" />}
            Unlink Discord
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>Enable <span className="font-medium">Developer Mode</span> in Discord (Settings → Advanced), then right-click your name → <span className="font-medium">Copy User ID</span>.</p>
          </div>
          <div className="flex gap-2">
            <Input
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !linking && discordId.trim() && handleLink()}
              placeholder="Paste your Discord ID..."
              className="flex-1 bg-cad-surface-2/50 border-cad-border/50 text-cad-text placeholder:text-cad-dim font-mono text-sm"
            />
            <Button
              onClick={handleLink}
              disabled={linking || !discordId.trim()}
              className="bg-[#5865F2] hover:bg-[#4752c4] text-white"
            >
              {linking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
              Link
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}