import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Save, Upload, Loader2 } from "lucide-react";
import { refreshBranding } from "@/hooks/useCommunityBranding";
import { MSection, MField, MInput, MTextarea, MSelect } from "@/components/mdt/ui/formFields";
import { Btn } from "@/components/mdt/ui/primitives";

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

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  return (
    <div className="max-w-2xl space-y-2.5">
      <p className="text-[11.5px] text-mdt-dim">Server name, logo, branding and links used across the system.</p>

      <MSection title="Identity">
        <div className="space-y-2.5">
          <MField label="Server Name *">
            <MInput value={form.community_name} onChange={e => setForm({ ...form, community_name: e.target.value })} placeholder="e.g. OCRP" />
          </MField>
          <MField label="Logo">
            <div className="flex items-center gap-2.5">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="w-14 h-14 object-cover border border-mdt-line-2" />
              ) : (
                <div className="w-14 h-14 border border-mdt-line-2 bg-mdt-surface-3 flex items-center justify-center text-[10px] text-mdt-dim">No logo</div>
              )}
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 h-7 px-2 border border-mdt-line-2 bg-mdt-surface-3 text-[11.5px] text-mdt-text hover:bg-mdt-surface-4">
                  <Upload className="w-3.5 h-3.5" /> {uploading ? "Uploading…" : "Upload Logo"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              </label>
            </div>
            <MInput value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} className="mt-1.5" placeholder="Or paste an image URL…" />
          </MField>
          <MField label="Accent Color">
            <div className="flex items-center gap-1.5">
              <input type="color" value={form.accent_color || "#3b82f6"} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="w-9 h-7 border border-mdt-line-2 bg-mdt-surface cursor-pointer" />
              <MInput value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="font-mono" />
            </div>
          </MField>
        </div>
      </MSection>

      <MSection title="Links & Locale">
        <div className="grid grid-cols-2 gap-2.5">
          <MField label="Discord Link">
            <MInput value={form.discord_invite_url} onChange={e => setForm({ ...form, discord_invite_url: e.target.value })} placeholder="https://discord.gg/…" />
          </MField>
          <MField label="Website Link">
            <MInput value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://…" />
          </MField>
          <MField label="Time Zone" className="col-span-2">
            <MSelect options={TIMEZONES} value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} />
          </MField>
          <MField label="Description" className="col-span-2">
            <MTextarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          </MField>
        </div>
      </MSection>

      <Btn variant="primary" icon={Save} onClick={handleSave}>Save Settings</Btn>
    </div>
  );
}