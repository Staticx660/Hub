import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Save } from "lucide-react";

export default function CommunitySettings() {
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ community_name: "", logo_url: "", accent_color: "#3b82f6", discord_invite_url: "", description: "" });
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const list = await base44.entities.CommunitySetting.list();
        if (list.length > 0) { setSetting(list[0]); setForm(list[0]); }
      } catch (e) { /* */ }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form.community_name?.trim()) { toast({ title: "Community name is required", variant: "destructive" }); return; }
    try {
      if (setting) { await base44.entities.CommunitySetting.update(setting.id, form); }
      else { const created = await base44.entities.CommunitySetting.create({ ...form, is_setup: true }); setSetting(created); }
      toast({ title: "Community settings saved" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-1">Community Customization</h2>
      <p className="text-sm text-slate-400 mb-4">Set your community name, logo, and branding</p>
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 max-w-xl">
        <div>
          <Label className="text-slate-300">Community Name *</Label>
          <Input value={form.community_name || ""} onChange={e => setForm({ ...form, community_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. OCRP" />
        </div>
        <div>
          <Label className="text-slate-300">Logo URL</Label>
          <Input value={form.logo_url || ""} onChange={e => setForm({ ...form, logo_url: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="https://..." />
          {form.logo_url && <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover mt-2" />}
        </div>
        <div>
          <Label className="text-slate-300">Accent Color</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.accent_color || "#3b82f6"} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="w-10 h-9 rounded border border-slate-700 bg-slate-800" />
            <Input value={form.accent_color || ""} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="bg-slate-800 border-slate-700 text-white flex-1" />
          </div>
        </div>
        <div>
          <Label className="text-slate-300">Discord Invite URL</Label>
          <Input value={form.discord_invite_url || ""} onChange={e => setForm({ ...form, discord_invite_url: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="https://discord.gg/..." />
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