import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Save, Upload, Play, Bell } from "lucide-react";
import { setTonesCache } from "@/components/cad/mdt/panicSound";

const TONES = [
  { key: "new_dispatch", label: "New Dispatch" },
  { key: "dispatch_closes", label: "Dispatch Closes" },
  { key: "dispatch_updated", label: "Dispatch Updated" },
  { key: "signal", label: "Signal" },
  { key: "status_change", label: "Status Change" },
  { key: "dispatch_notes", label: "Dispatch Notes" },
  { key: "panic", label: "Panic" },
  { key: "timers", label: "Timers" },
];

export default function NotificationTonesManager() {
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tones, setTones] = useState({});
  const [uploading, setUploading] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const list = await base44.entities.CommunitySetting.list();
        if (list.length > 0) {
          setSetting(list[0]);
          setTones(list[0].notification_tones || {});
        }
      } catch (e) { toast({ title: "Load error", description: e.message, variant: "destructive" }); }
      setLoading(false);
    };
    load();
  }, []);

  const handleUpload = async (toneKey, file) => {
    setUploading(toneKey);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setTones(prev => ({ ...prev, [toneKey]: file_url }));
      toast({ title: "Tone uploaded", description: TONES.find(t => t.key === toneKey)?.label });
    } catch (e) { toast({ title: "Upload error", description: e.message, variant: "destructive" }); }
    setUploading(null);
  };

  const playTone = (url) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(() => toast({ title: "Cannot play tone", variant: "destructive" }));
  };

  const handleSave = async () => {
    try {
      if (setting) { await base44.entities.CommunitySetting.update(setting.id, { notification_tones: tones }); }
      else { const created = await base44.entities.CommunitySetting.create({ community_name: "My Community", is_setup: true, notification_tones: tones }); setSetting(created); }
      setTonesCache(tones);
      toast({ title: "Notification tones saved" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-1">Notification Tones</h2>
      <p className="text-sm text-slate-400 mb-4">Upload MP3 files or paste links for dispatch and alert sounds</p>
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 max-w-2xl space-y-3">
        {TONES.map(tone => (
          <div key={tone.key} className="flex items-center gap-3">
            <div className="w-40 flex-shrink-0">
              <Label className="text-slate-300 text-sm flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-slate-500" /> {tone.label}</Label>
            </div>
            <Input value={tones[tone.key] || ""} onChange={e => setTones(prev => ({ ...prev, [tone.key]: e.target.value }))} className="bg-slate-800 border-slate-700 text-white flex-1" placeholder="Paste MP3 URL or upload file..." />
            <label className="cursor-pointer">
              <input type="file" accept="audio/*" className="hidden" onChange={e => e.target.files[0] && handleUpload(tone.key, e.target.files[0])} disabled={uploading === tone.key} />
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 ${uploading === tone.key ? "opacity-50" : ""}`}>
                {uploading === tone.key ? <div className="w-4 h-4 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              </span>
            </label>
            <button onClick={() => playTone(tones[tone.key])} disabled={!tones[tone.key]} className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
              <Play className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 mt-4"><Save className="w-4 h-4 mr-2" /> Save Tones</Button>
      </div>
    </div>
  );
}