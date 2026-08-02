import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Save, Loader2 } from "lucide-react";
import { MSection, MField, MInput } from "@/components/mdt/ui/formFields";
import { Btn } from "@/components/mdt/ui/primitives";

export default function UserRestrictionsManager() {
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const list = await base44.entities.CommunitySetting.list();
        if (list.length > 0) {
          setSetting(list[0]);
          setLimit(list[0].civilian_limit_per_user ?? 5);
        }
      } catch (e) { toast({ title: "Load error", description: e.message, variant: "destructive" }); }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      if (setting) { await base44.entities.CommunitySetting.update(setting.id, { civilian_limit_per_user: Number(limit) }); }
      else { const created = await base44.entities.CommunitySetting.create({ community_name: "My Community", is_setup: true, civilian_limit_per_user: Number(limit) }); setSetting(created); }
      toast({ title: "Restriction saved", description: `Users can have up to ${limit} civilians` });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  return (
    <div className="max-w-md space-y-2.5">
      <p className="text-[11.5px] text-mdt-dim">Limit how many civilian characters each user can create.</p>
      <MSection title="Civilian Limit Per User">
        <div className="flex items-end gap-2">
          <MField label="Maximum Characters" className="w-28">
            <MInput type="number" min={1} value={limit} onChange={e => setLimit(e.target.value)} />
          </MField>
          <span className="text-[11.5px] text-mdt-muted pb-1.5">civilians per user</span>
        </div>
      </MSection>
      <Btn variant="primary" icon={Save} onClick={handleSave}>Save</Btn>
    </div>
  );
}