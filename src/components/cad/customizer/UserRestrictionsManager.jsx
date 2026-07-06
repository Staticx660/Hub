import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Save, Users } from "lucide-react";

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

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-1">User Account Restrictions</h2>
      <p className="text-sm text-slate-400 mb-4">Limit how many civilian characters each user can create</p>
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center"><Users className="w-6 h-6 text-cyan-400" /></div>
          <div>
            <p className="text-sm font-medium text-white">Civilian Limit Per User</p>
            <p className="text-xs text-slate-500">Maximum number of civilian characters a user can create</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input type="number" min={1} value={limit} onChange={e => setLimit(e.target.value)} className="bg-slate-800 border-slate-700 text-white w-24" />
          <span className="text-sm text-slate-400">civilians per user</span>
        </div>
        <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 mt-4"><Save className="w-4 h-4 mr-2" /> Save</Button>
      </div>
    </div>
  );
}