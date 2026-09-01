import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Save, Upload, Play, Loader2 } from "lucide-react";
import { setTonesCache, speak, dispatchVoiceText, speakPanicAlert } from "@/components/cad/mdt/panicSound";
import { MSection, MInput } from "@/components/mdt/ui/formFields";
import { Btn } from "@/components/mdt/ui/primitives";

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

const iconBtn = "inline-flex items-center justify-center w-7 h-7 border border-mdt-line-2 bg-mdt-surface-3 text-mdt-muted hover:text-mdt-text hover:bg-mdt-surface-4 disabled:opacity-30";

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

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  return (
    <div className="max-w-3xl space-y-2.5">
      <p className="text-[11.5px] text-mdt-dim">Upload MP3 files or paste links for dispatch and alert sounds.</p>
      <MSection title="Alert Tones">
        <div className="space-y-1.5">
          {TONES.map(tone => (
            <div key={tone.key} className="flex items-center gap-1.5">
              <span className="w-36 flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-dim">{tone.label}</span>
              <MInput value={tones[tone.key] || ""} onChange={e => setTones(prev => ({ ...prev, [tone.key]: e.target.value }))} placeholder="Paste MP3 URL or upload a file…" />
              <label className="cursor-pointer flex-shrink-0">
                <input type="file" accept="audio/*" className="hidden" onChange={e => e.target.files[0] && handleUpload(tone.key, e.target.files[0])} disabled={uploading === tone.key} />
                <span className={iconBtn}>
                  {uploading === tone.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                </span>
              </label>
              <button onClick={() => playTone(tones[tone.key])} disabled={!tones[tone.key]} className={`${iconBtn} flex-shrink-0`}>
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </MSection>
      <MSection title="AI Voice Announcements">
        <p className="text-[11.5px] text-mdt-dim mb-2">Voice plays after the tone when a unit is attached to a call (call type, location, postal) and after the panic siren.</p>
        <div className="flex gap-1.5">
          <Btn icon={Play} onClick={() => speak(dispatchVoiceText({ call_type: "Shots Fired", location: "Vinewood Blvd & Alta St", postal: "412", priority: "1 - High" }, { callsign: "1-Adam-12" }))}>Test Dispatch Voice</Btn>
          <Btn icon={Play} onClick={() => speakPanicAlert("1-Adam-12")}>Test Panic Voice</Btn>
        </div>
      </MSection>
      <Btn variant="primary" icon={Save} onClick={handleSave}>Save Tones</Btn>
    </div>
  );
}