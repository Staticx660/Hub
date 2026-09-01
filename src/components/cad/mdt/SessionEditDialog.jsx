import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Btn } from "@/components/mdt/ui/primitives";

const inputCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const labelCls = "text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-dim";

export default function SessionEditDialog({ open, onOpenChange, session, onSaved }) {
  const [callsign, setCallsign] = useState("");
  const [userName, setUserName] = useState("");
  const [rank, setRank] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && session) {
      setCallsign(session.callsign || "");
      setUserName(session.user_name || "");
      setRank(session.rank || "");
    }
  }, [open, session]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.CADSession.update(session.id, { callsign, user_name: userName, rank });
      onSaved?.({ ...session, callsign, user_name: userName, rank });
      onOpenChange(false);
      toast({ title: "Unit info updated" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.06em]">Edit Unit Info</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div><Label className={labelCls}>Callsign</Label><Input value={callsign} onChange={e => setCallsign(e.target.value)} className={inputCls} /></div>
          <div><Label className={labelCls}>Name</Label><Input value={userName} onChange={e => setUserName(e.target.value)} className={inputCls} /></div>
          <div><Label className={labelCls}>Rank</Label><Input value={rank} onChange={e => setRank(e.target.value)} className={inputCls} /></div>
        </div>
        <DialogFooter>
          <Btn variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}