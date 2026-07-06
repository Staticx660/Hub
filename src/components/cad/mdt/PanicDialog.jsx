import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AddressSearch from "@/components/cad/mdt/AddressSearch";
import { startPanicSound } from "@/components/cad/mdt/panicSound";
import { AlertTriangle, X } from "lucide-react";

const CATEGORY_LABELS = {
  Police: "Panic Button / Officer Down",
  Dispatch: "Panic Button / Officer Down",
  Fire: "Panic Button / Firefighter Down",
  EMS: "Panic Button / Medic Down",
};

export default function PanicDialog({ open, department, session, onClose, onActivated }) {
  const defaultCallType = CATEGORY_LABELS[department?.category] || "Panic Button / Unit Down";
  const [form, setForm] = useState({
    call_type: defaultCallType,
    location: "",
    postal: "",
    cross_streets: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  if (!open) return null;

  const unitName = session?.callsign || session?.user_name || "Unknown Unit";

  const handleSubmit = async () => {
    if (!form.location.trim()) {
      toast({ title: "Location required", description: "Enter your current location so units can respond.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const runNum = `PNC-${Date.now().toString().slice(-6)}`;
      const description = form.description.trim() || `Panic button activated by ${unitName}. Immediate assistance required.`;

      const call = await base44.entities.ActiveCall.create({
        call_type: form.call_type || defaultCallType,
        priority: "1 - High",
        status: "Active",
        location: form.location,
        cross_streets: form.cross_streets,
        postal: form.postal,
        description,
        department_id: department.id,
        run_number: runNum,
        assigned_unit_ids: [],
        cad_notes: "",
        call_origin: "Panic",
        caller_name: unitName,
      });

      await base44.entities.CADSession.update(session.id, {
        panic_active: true,
        status: "Panic",
        active_call_id: call.id,
      });

      startPanicSound(unitName);

      toast({
        title: "🚨 PANIC ACTIVATED",
        description: `Call ${runNum} created. All units alert.`,
        variant: "destructive",
      });

      onActivated?.({ ...session, panic_active: true, status: "Panic", active_call_id: call.id });
      onClose?.();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4">
      <div className="bg-cad-surface border-2 border-red-500/60 rounded-xl p-5 w-full max-w-md cad-font cad-accent-glow" style={{ boxShadow: "0 0 40px rgba(239,68,68,0.3)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-5 h-5" /> PANIC ACTIVATION
          </h2>
          <button onClick={onClose} className="text-cad-muted hover:text-cad-text"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-cad-dim mb-4">Provide your location so dispatch can route help. The panic alert and call will be created on submit.</p>
        <div className="space-y-3">
          <div>
            <Label className="text-cad-muted text-xs">Call Type</Label>
            <Input value={form.call_type} onChange={e => setForm({ ...form, call_type: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" />
          </div>
          <div>
            <Label className="text-cad-muted text-xs">Location *</Label>
            <AddressSearch value={form.location} onChange={v => setForm({ ...form, location: v })} className="w-full bg-cad-surface-2 border border-cad-border text-cad-text text-sm h-9 rounded-md pl-8 pr-2 focus-visible:ring-1 focus-visible:ring-red-500/50 placeholder:text-cad-dim" placeholder="Enter your location..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-cad-muted text-xs">Postal</Label>
              <Input value={form.postal} onChange={e => setForm({ ...form, postal: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" placeholder="e.g. 123" />
            </div>
            <div>
              <Label className="text-cad-muted text-xs">Cross Streets</Label>
              <Input value={form.cross_streets} onChange={e => setForm({ ...form, cross_streets: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" placeholder="e.g. Main & 1st" />
            </div>
          </div>
          <div>
            <Label className="text-cad-muted text-xs">Details (optional)</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" rows={2} placeholder="Situation details (defaults to auto-message)" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleSubmit} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 animate-pulse">
            {saving ? "Activating..." : "🚨 ACTIVATE PANIC"}
          </Button>
          <Button onClick={onClose} variant="outline" className="border-cad-border text-cad-muted">Cancel</Button>
        </div>
      </div>
    </div>
  );
}