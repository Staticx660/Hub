import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Unit Info</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-slate-400 text-xs">Callsign</Label><Input value={callsign} onChange={e => setCallsign(e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          <div><Label className="text-slate-400 text-xs">Name</Label><Input value={userName} onChange={e => setUserName(e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          <div><Label className="text-slate-400 text-xs">Rank</Label><Input value={rank} onChange={e => setRank(e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}