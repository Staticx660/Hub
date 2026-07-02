import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Car, Plus, Trash2, Flag } from "lucide-react";

const licenseFields = [
  { key: "drivers_license_status", label: "Driver's License" },
  { key: "pilot_license_status", label: "Pilot License" },
  { key: "weapon_license_status", label: "Weapon License" },
  { key: "hunting_license_status", label: "Hunting License" },
];
const licenseStatuses = ["Valid", "Suspended", "Revoked", "None"];
const statusColors = { Valid: "text-green-400 bg-green-500/10", Suspended: "text-yellow-400 bg-yellow-500/10", Revoked: "text-red-400 bg-red-500/10", None: "text-slate-400 bg-slate-700/50" };

export default function CivilianDMV({ character, department, user }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vehForm, setVehForm] = useState({ plate: "", model: "", color: "" });
  const { toast } = useToast();

  const load = async () => {
    try {
      const v = await base44.entities.CivilianVehicle.filter({ owner_id: character.id });
      setVehicles(v);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [character.id]);

  const setLicense = async (field, status) => {
    try {
      await base44.entities.Civilian.update(character.id, { [field]: status });
      toast({ title: `${licenseFields.find(f => f.key === field)?.label} set to ${status}` });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const addVehicle = async () => {
    if (!vehForm.plate) return;
    try {
      await base44.entities.CivilianVehicle.create({
        ...vehForm, owner_name: `${character.first_name} ${character.last_name}`, owner_id: character.id,
        owner_user_id: user.id, department_id: department.id, created_by_name: user.full_name,
      });
      toast({ title: "Vehicle registered" });
      setVehForm({ plate: "", model: "", color: "" }); setDialogOpen(false); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const reportStolen = async (veh) => {
    try {
      await base44.entities.CivilianVehicle.update(veh.id, { is_stolen: !veh.is_stolen });
      toast({ title: veh.is_stolen ? "Marked as recovered" : "Reported stolen" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const deleteVeh = async (id) => {
    if (!confirm("Delete this vehicle?")) return;
    await base44.entities.CivilianVehicle.delete(id);
    toast({ title: "Vehicle deleted" }); load();
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Licenses</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {licenseFields.map(lic => (
            <div key={lic.key} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">{lic.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[character[lic.key] || "None"]}`}>{character[lic.key] || "None"}</span>
              </div>
              <Select value={character[lic.key] || "None"} onValueChange={v => setLicense(lic.key, v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{licenseStatuses.map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Vehicles</h3>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5"><Plus className="w-3.5 h-3.5" /> Register Vehicle</Button>
        </div>
        {vehicles.length === 0 ? (
          <div className="text-center py-8 text-slate-600"><Car className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No vehicles registered</p></div>
        ) : (
          <div className="space-y-2">
            {vehicles.map(v => (
              <div key={v.id} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center"><Car className="w-5 h-5 text-slate-400" /></div>
                  <div>
                    <p className="text-white font-medium text-sm">{v.model || "Unknown"}</p>
                    <p className="text-xs text-slate-500">{v.color} · Plate: <span className="font-mono text-blue-400">{v.plate}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {v.is_stolen && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">STOLEN</span>}
                  <button onClick={() => reportStolen(v)} className={`p-1.5 rounded-lg hover:bg-slate-700 ${v.is_stolen ? "text-green-400" : "text-red-400"}`} title={v.is_stolen ? "Mark recovered" : "Report stolen"}><Flag className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteVeh(v.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">Register Vehicle</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-slate-300">Plate *</Label><Input value={vehForm.plate} onChange={e => setVehForm({ ...vehForm, plate: e.target.value.toUpperCase() })} className="bg-slate-800 border-slate-700 text-white font-mono" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Model</Label><Input value={vehForm.model} onChange={e => setVehForm({ ...vehForm, model: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div><Label className="text-slate-300">Color</Label><Input value={vehForm.color} onChange={e => setVehForm({ ...vehForm, color: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={addVehicle} disabled={!vehForm.plate} className="bg-blue-600 hover:bg-blue-700">Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}