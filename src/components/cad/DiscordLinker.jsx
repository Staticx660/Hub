import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Unlink, ShieldCheck, MessageCircle, AlertCircle, Send, ArrowLeft, Check } from "lucide-react";

const THEMES = {
  cad: {
    card: "cad-card p-5",
    iconWrap: "w-10 h-10 rounded-xl bg-[#5865F2]/15 flex items-center justify-center flex-shrink-0",
    title: "text-cad-text",
    subtitle: "text-xs text-cad-muted mt-0.5",
    linkedBg: "flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20",
    infoBox: "text-xs text-cad-muted bg-cad-surface-2/40 rounded-lg p-3 space-y-1",
    input: "flex-1 bg-cad-surface-2/50 border-cad-border/50 text-cad-text placeholder:text-cad-dim font-mono text-sm",
    codeInput: "bg-cad-surface-2/50 border-cad-border/50 text-cad-text placeholder:text-cad-dim font-mono text-lg tracking-[0.5em] text-center",
    notice: "flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5",
    divider: "flex-grow border-t border-cad-border/40",
    dividerLabel: "mx-3 text-xs text-cad-dim uppercase tracking-wide",
    hint: "text-cad-dim",
    hintText: "text-xs text-cad-muted bg-cad-surface-2/40 rounded-lg p-2.5",
    resend: "w-full text-xs text-cad-dim hover:text-cad-muted underline",
    backBtn: "flex-1 border-cad-border/50 text-cad-muted",
    primaryBtn: "bg-[#5865F2] hover:bg-[#4752c4] text-white",
    oauthBtn: "w-full border-[#5865F2]/40 text-[#5865F2] hover:bg-[#5865F2]/10",
    unlinkBtn: "w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
  },
  slate: {
    card: "bg-slate-900/80 border border-slate-800 rounded-xl p-6",
    iconWrap: "w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0",
    title: "text-white",
    subtitle: "text-sm text-slate-400 mt-1",
    linkedBg: "flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg",
    infoBox: "text-xs text-slate-400 bg-slate-800/40 rounded-lg p-3 space-y-1 mt-3",
    input: "flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 font-mono text-sm",
    codeInput: "bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 font-mono text-lg tracking-[0.5em] text-center",
    notice: "flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5",
    divider: "flex-grow border-t border-slate-800",
    dividerLabel: "mx-3 text-xs text-slate-600 uppercase tracking-wide",
    hint: "text-slate-500",
    hintText: "text-xs text-slate-400 bg-slate-800/40 rounded-lg p-2.5",
    resend: "w-full text-xs text-slate-500 hover:text-slate-400 underline",
    backBtn: "flex-1 border-slate-700 text-slate-300 hover:bg-slate-800",
    primaryBtn: "bg-indigo-600 hover:bg-indigo-700 text-white",
    oauthBtn: "w-full border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10",
    unlinkBtn: "border-slate-700 text-slate-300 hover:bg-slate-800"
  }
};

export default function DiscordLinker({ variant = "cad" }) {
  const t = THEMES[variant] || THEMES.cad;
  const { user, checkUserAuth } = useAuth();
  const [step, setStep] = useState("enter-id");
  const [discordId, setDiscordId] = useState("");
  const [code, setCode] = useState("");
  const [dmDisplayName, setDmDisplayName] = useState(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [linkedInfo, setLinkedInfo] = useState(null);
  const { toast } = useToast();

  const isLinked = !!user?.discord_id;

  const handleSendCode = async () => {
    if (!discordId.trim()) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendDiscordVerification", { discord_id: discordId.trim() });
      if (res.data?.error) {
        toast({ title: "Failed to send", description: res.data.error, variant: "destructive" });
      } else {
        setDmDisplayName(res.data?.displayName);
        setStep("enter-code");
        toast({ title: "Code sent", description: "Check your Discord DMs for the 6-digit code.", duration: 4000 });
      }
    } catch (e) {
      toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) return;
    setVerifying(true);
    try {
      const res = await base44.functions.invoke("verifyDiscordCode", { code: code.trim(), discord_id: discordId.trim() });
      if (res.data?.error) {
        toast({ title: "Verification failed", description: res.data.error, variant: "destructive" });
      } else {
        setLinkedInfo(res.data);
        setCode("");
        setDiscordId("");
        setStep("enter-id");
        await checkUserAuth();
        toast({ title: "Discord verified", description: `Connected as ${res.data.displayName}`, duration: 3000 });
      }
    } catch (e) {
      toast({ title: "Verification failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const handleOAuth = async () => {
    setOauthLoading(true);
    try {
      const redirectUri = window.location.origin + window.location.pathname;
      const res = await base44.functions.invoke("getDiscordOAuthUrl", { redirect_uri: redirectUri });
      if (res.data?.error) {
        toast({ title: "Failed", description: res.data.error, variant: "destructive" });
        setOauthLoading(false);
      } else {
        window.location.href = res.data.authUrl;
      }
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
      setOauthLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthCode = params.get("code");
    const oauthState = params.get("state");
    if (oauthCode && !isLinked) {
      (async () => {
        setOauthLoading(true);
        try {
          const redirectUri = window.location.origin + window.location.pathname;
          const res = await base44.functions.invoke("completeDiscordOAuth", {
            code: oauthCode,
            redirect_uri: redirectUri,
            state: oauthState
          });
          if (res.data?.error) {
            toast({ title: "OAuth failed", description: res.data.error, variant: "destructive" });
          } else {
            setLinkedInfo(res.data);
            await checkUserAuth();
            toast({ title: "Discord verified", description: `Connected as ${res.data.displayName}`, duration: 3000 });
          }
        } catch (e) {
          toast({ title: "OAuth failed", description: e.response?.data?.error || e.message, variant: "destructive" });
        } finally {
          setOauthLoading(false);
          window.history.replaceState({}, "", window.location.pathname);
        }
      })();
    }
  }, [isLinked]);

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
    <div className={t.card}>
      <div className="flex items-start gap-3 mb-4">
        <div className={t.iconWrap}>
          <MessageCircle className="w-5 h-5 text-[#5865F2]" />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${t.title}`}>Discord Account</h3>
          <p className={t.subtitle}>
            Verify your Discord to link securely — this prevents anyone from using your Discord ID to gain access.
          </p>
        </div>
      </div>

      {oauthLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#5865F2] animate-spin" />
          <span className="ml-3 text-sm text-slate-400">Completing Discord verification…</span>
        </div>
      )}

      {!oauthLoading && isLinked && (
        <div className="space-y-4">
          <div className={t.linkedBg}>
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium text-emerald-400`}>Verified & Linked</span>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <p className={`text-xs ${variant === "slate" ? "text-slate-400" : "text-cad-muted"} font-mono truncate`}>
                ID: {user.discord_id}
              </p>
            </div>
            {user.avatar_url && (
              <img src={user.avatar_url} alt="Discord avatar" className="w-10 h-10 rounded-full ring-2 ring-emerald-500/30" />
            )}
          </div>

          {linkedInfo && (
            <div className={t.infoBox}>
              <p><span className="opacity-60">Username:</span> {linkedInfo.username}</p>
              {linkedInfo.rosterMember && (
                <p><span className="opacity-60">Roster:</span> {linkedInfo.rosterMember.rank || "—"} · {linkedInfo.rosterMember.callsign || "—"}</p>
              )}
            </div>
          )}

          <Button onClick={handleUnlink} disabled={unlinking} variant="outline" className={t.unlinkBtn}>
            {unlinking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlink className="w-4 h-4 mr-2" />}
            Unlink Discord
          </Button>
        </div>
      )}

      {!oauthLoading && !isLinked && step === "enter-id" && (
        <div className="space-y-4">
          <div className={t.notice}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>Enable <span className="font-medium">Developer Mode</span> in Discord (Settings → Advanced), then right-click your name → <span className="font-medium">Copy User ID</span>. We'll DM a code to verify you own the account.</p>
          </div>
          <div className="flex gap-2">
            <Input
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !sending && discordId.trim() && handleSendCode()}
              placeholder="Paste your Discord ID..."
              className={t.input}
            />
            <Button onClick={handleSendCode} disabled={sending || !discordId.trim()} className={t.primaryBtn}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send Code
            </Button>
          </div>

          <div className="relative flex items-center my-1">
            <div className={t.divider}></div>
            <span className={t.dividerLabel}>or</span>
            <div className={t.divider}></div>
          </div>

          <Button onClick={handleOAuth} disabled={oauthLoading} variant="outline" className={t.oauthBtn}>
            {oauthLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
            Verify with Discord Login
          </Button>
        </div>
      )}

      {!oauthLoading && !isLinked && step === "enter-code" && (
        <div className="space-y-4">
          <div className={t.hintText}>
            <div className="flex items-start gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-[#5865F2] flex-shrink-0 mt-0.5" />
              <p>Enter the 6-digit code sent to <span className="font-medium text-white">{dmDisplayName || "your Discord DMs"}</span>. It expires in 10 minutes.</p>
            </div>
          </div>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && !verifying && code.trim() && handleVerify()}
            placeholder="000000"
            inputMode="numeric"
            className={t.codeInput}
          />
          <div className="flex gap-2">
            <Button onClick={() => setStep("enter-id")} variant="outline" className={t.backBtn}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={handleVerify} disabled={verifying || !code.trim()} className={`flex-1 ${t.primaryBtn}`}>
              {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Verify
            </Button>
          </div>
          <button onClick={handleSendCode} disabled={sending} className={t.resend}>
            Didn't get a code? Resend
          </button>
        </div>
      )}
    </div>
  );
}