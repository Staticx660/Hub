import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { logSystemEvent } from "@/lib/logSystemEvent";
import CivilianSearch from "@/components/cad/mdt/CivilianSearch";
import VehicleSearch from "@/components/cad/mdt/VehicleSearch";

export default function BoloForm({ open, onOpenChange, department, session, onSaved }) {
  const [form, setForm] = useState({ title: "", description: "", bolo_type: "Person", person_name: "", vehicle_plate: "", vehicle_description: "", last_seen_location: "", priority: "Medium" });
  const [selectedCivilian, setSelectedCivilian] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setForm({ title: "", description: "", bolo_type: "Person", person_name: "", vehicle_plate: "", vehicle_description: "", last_seen_location: "", priority: "Medium" });
      setSelectedCivilian(null);
      setSelectedVehicle(null);
    }
  }, [open]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleCivilianSelected = (c) => {
    if (c) { setSelectedCivilian(c); set("person_name", `${c.first_name} ${c.last_name}`); }
    else { setSelectedCivilian(null); }
  };

  const handleVehicleSelected = (v) => {
    if (v) { setSelectedVehicle(v); set("vehicle_plate", v.plate || ""); set("vehicle_description", [v.model, v.color].filter(Boolean).join(" ")); }
    else { setSelectedVehicle(null); }
  };

  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast({ title: "Required fields missing", variant: "destructive" });
      return;
    }
    try {
      await base44.entities.BOLO.create({
        ...form, department_id: department.id, created_by_name: session.callsign || session.user_name, status: "Active",
      });
      logSystemEvent("BOLO Created", "CAD", `BOLO "${form.title}" created by ${session.callsign || session.user_name}`, { entity_type: "BOLO" });
      toast({ title: "BOLO created" });
      onSaved();
      onOpenChange(false);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader><DialogTitle className="text-white">New BOLO</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-slate-300">Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-slate-300">Type</Label>
              <Select value={form.bolo_type} onValueChange={v => set("bolo_type", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{["Person", "Vehicle", "Firearm", "Other"].map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Priority</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{["High", "Medium", "Low"].map(p => <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {form.bolo_type === "Person" && (
            <div>
              <div className="mb-2"><CivilianSearch selected={selectedCivilian} onSelected={handleCivilianSelected} /></div>
              <Label className="text-slate-300">Person Name</Label>
              <Input value={form.person_name} onChange={e => set("person_name", e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
          )}
          {form.bolo_type === "Vehicle" && (
            <div>
              <div className="mb-2"><VehicleSearch selected={selectedVehicle} onSelected={handleVehicleSelected} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-slate-300">Plate</Label><Input value={form.vehicle_plate} onChange={e => set("vehicle_plate", e.target.value.toUpperCase())} className="bg-slate-800 border-slate-700 text-white font-mono" /></div>
                <div><Label className="text-slate-300">Description</Label><Input value={form.vehicle_description} onChange={e => set("vehicle_description", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
              </div>
            </div>
          )}
          <div><Label className="text-slate-300">Last Seen Location</Label><Input value={form.last_seen_location} onChange={e => set("last_seen_location", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          <div><Label className="text-slate-300">Description *</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} className="bg-slate-800 border-slate-700 text-white" rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} className="bg-yellow-600 hover:bg-yellow-700">Create BOLO</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}