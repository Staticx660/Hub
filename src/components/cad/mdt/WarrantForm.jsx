import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { logSystemEvent } from "@/lib/logSystemEvent";
import CivilianSearch from "@/components/cad/mdt/CivilianSearch";

export default function WarrantForm({ open, onOpenChange, department, session, onSaved, prefillPerson }) {
  const [form, setForm] = useState({ person_name: "", person_id: "", reason: "", charges: [], bail_amount: 0, notes: "" });
  const [chargeInput, setChargeInput] = useState("");
  const [selectedCivilian, setSelectedCivilian] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setForm({ person_name: prefillPerson?.name || "", person_id: prefillPerson?.id || "", reason: "", charges: [], bail_amount: 0, notes: "" });
      setChargeInput("");
      setSelectedCivilian(null);
    }
  }, [open, prefillPerson]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleCivilianSelected = (c) => {
    if (c) { setSelectedCivilian(c); set("person_name", `${c.first_name} ${c.last_name}`); set("person_id", c.id || ""); }
    else { setSelectedCivilian(null); }
  };

  const addCharge = () => {
    if (chargeInput.trim()) {
      set("charges", [...form.charges, chargeInput.trim()]);
      setChargeInput("");
    }
  };

  const handleSave = async () => {
    if (!form.person_name || !form.reason) {
      toast({ title: "Required fields missing", variant: "destructive" });
      return;
    }
    try {
      await base44.entities.Warrant.create({
        ...form, bail_amount: Number(form.bail_amount) || 0, department_id: department.id,
        issued_by_name: session.callsign || session.user_name, issued_by_id: session.user_id,
        issued_date: new Date().toISOString(), status: "Active",
      });
      logSystemEvent("Warrant Issued", "CAD", `Warrant for ${form.person_name} issued by ${session.callsign || session.user_name}`, { entity_type: "Warrant" });
      toast({ title: "Warrant issued" });
      onSaved();
      onOpenChange(false);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader><DialogTitle className="text-white">New Warrant</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="mb-2"><CivilianSearch selected={selectedCivilian} onSelected={handleCivilianSelected} /></div>
            <Label className="text-slate-300">Person Name *</Label>
            <Input value={form.person_name} onChange={e => set("person_name", e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div><Label className="text-slate-300">Reason *</Label><Textarea value={form.reason} onChange={e => set("reason", e.target.value)} className="bg-slate-800 border-slate-700 text-white" rows={2} /></div>
          <div>
            <Label className="text-slate-300">Charges</Label>
            <div className="flex gap-2">
              <Input value={chargeInput} onChange={e => setChargeInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCharge(); } }} className="bg-slate-800 border-slate-700 text-white" placeholder="Add charge..." />
              <Button onClick={addCharge} size="sm" variant="outline" className="border-slate-700 text-slate-300">Add</Button>
            </div>
            {form.charges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.charges.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">
                    {c}
                    <button onClick={() => set("charges", form.charges.filter((_, idx) => idx !== i))}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div><Label className="text-slate-300">Bail Amount ($)</Label><Input type="number" value={form.bail_amount} onChange={e => set("bail_amount", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          <div><Label className="text-slate-300">Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} className="bg-slate-800 border-slate-700 text-white" rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">Issue Warrant</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}