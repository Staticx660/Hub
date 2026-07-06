import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Save, Upload } from "lucide-react";
import { refreshBranding } from "@/hooks/useCommunityBranding";

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "Pacific/Honolulu", "UTC",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Australia/Sydney", "Asia/Tokyo"
];

export default function CommunityInfoManager() {
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    community_name: "", logo_url: "", accent_color: "#3b82f6",
    discord_invite_url: "", website_url: "", timezone: "America/New_York", description: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const list = await base44.entities.CommunitySetting.list();
        if (list.length > 0) {
          const s = list[0];
          setSetting(s);
          setForm({
            community_name: s.community_name || "",
            logo_url: s.logo_url || "",
            accent_color: s.accent_color || "#3b82f6",
            discord_invite_url: s.discord_invite_url || "",
            website_url: s.website_url || "",
            timezone: s.timezone || "America/New_York",
            description: s.description || "",
          });
        }
      } catch (e) { toast({ title: "Load error", description: e.message, variant: "destructive" }); }
      setLoading(false);
    };
    load();
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, logo_url: file_url });
      toast({ title: "Logo uploaded" });
    } catch (err) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.community_name?.trim()) { toast({ title: "Community name is required", variant: "destructive" }); return; }
    try {
      if (setting) { await base44.entities.CommunitySetting.update(setting.id, form); }
      else { const created = await base44.entities.CommunitySetting.create({ ...form, is_setup: true }); setSetting(created); }
      await refreshBranding();
      toast({ title: "Community settings saved", description: "Branding updated across the system" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-1">Community Info</h2>
      <p className="text-sm text-slate-400 mb-4">Set your server name, logo, branding, and links</p>
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 max-w-xl">
        <div>
          <Label className="text-slate-300">Server Name *</Label>
          <Input value={form.community_name || ""} onChange={e => setForm({ ...form, community_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. OCRP" />
        </div>
        <div>
          <Label className="text-slate-300">Logo</Label>
          <div className="flex items-center gap-3">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-slate-700" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600 text-xs">No logo</div>
            )}
            <label>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 border border-slate-700 cursor-pointer">
                <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload Logo"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-1">Or paste a URL below</p>
          <Input value={form.logo_url || ""} onChange={e => setForm({ ...form, logo_url: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="https://..." />
        </div>
        <div>
          <Label className="text-slate-300">Accent Color</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.accent_color || "#3b82f6"} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="w-10 h-9 rounded border border-slate-700 bg-slate-800" />
            <Input value={form.accent_color || ""} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="bg-slate-800 border-slate-700 text-white flex-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-300">Discord Link</Label>
            <Input value={form.discord_invite_url || ""} onChange={e => setForm({ ...form, discord_invite_url: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="https://discord.gg/..." />
          </div>
          <div>
            <Label className="text-slate-300">Website Link</Label>
            <Input value={form.website_url || ""} onChange={e => setForm({ ...form, website_url: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="https://..." />
          </div>
        </div>
        <div>
          <Label className="text-slate-300">Time Zone</Label>
          <Select value={form.timezone || "America/New_York"} onValueChange={v => setForm({ ...form, timezone: v })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">{TIMEZONES.map(tz => <SelectItem key={tz} value={tz} className="text-white">{tz}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-slate-300">Description</Label>
          <Textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={3} />
        </div>
        <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700"><Save className="w-4 h-4 mr-2" /> Save Settings</Button>
      </div>
    </div>
  );
}