import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Car, Plus, Trash2, Flag, X, ChevronDown, ChevronUp, IdCard } from "lucide-react";

const licenseFields = [
  { key: "drivers_license_status", label: "Driver's License" },
  { key: "pilot_license_status", label: "Pilot License" },
  { key: "weapon_license_status", label: "Weapon License" },
  { key: "hunting_license_status", label: "Hunting License" },
];
const licenseStatuses = ["Valid", "Suspended", "Revoked", "None"];
const statusColors = { Valid: "text-green-400 bg-green-500/10", Suspended: "text-yellow-400 bg-yellow-500/10", Revoked: "text-red-400 bg-red-500/10", None: "text-slate-400 bg-slate-700/50" };
const LICENSE_TYPES = ["Standard", "CDL Class A", "CDL Class B", "CDL Class C", "Motorcycle", "Boat", "Commercial"];
const regStatuses = ["Valid", "Expired", "Suspended", "None"];
const insStatuses = ["Valid", "Expired", "None"];

export default function CivilianDMV({ character, department, user, onUpdate }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vehForm, setVehForm] = useState({ plate: "", make: "", model: "", color: "", year: "", registration_status: "Valid", insurance_status: "Valid" });
  const [licenseTypesOpen, setLicenseTypesOpen] = useState(false);
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
      if (onUpdate) await onUpdate();
      toast({ title: `${licenseFields.find(f => f.key === field)?.label} set to ${status}` });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const toggleLicenseType = async (type) => {
    const current = character.drivers_license_types || [];
    const updated = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
    try {
      await base44.entities.Civilian.update(character.id, { drivers_license_types: updated });
      if (onUpdate) await onUpdate();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const setVehicleStatus = async (vehId, field, status) => {
    try {
      await base44.entities.CivilianVehicle.update(vehId, { [field]: status });
      toast({ title: "Vehicle status updated" });
      load();
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
      setVehForm({ plate: "", make: "", model: "", color: "", year: "", registration_status: "Valid", insurance_status: "Valid" });
      setDialogOpen(false);
      load();
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
    toast({ title: "Vehicle deleted" });
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;

  const selectedTypes = character.drivers_license_types || [];

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

        {/* Driver's License Types Multi-Select */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mt-3">
          <button onClick={() => setLicenseTypesOpen(!licenseTypesOpen)} className="flex items-center justify-between w-full text-sm font-medium text-slate-300">
            <span className="flex items-center gap-2"><IdCard className="w-4 h-4" /> Driver's License Types ({selectedTypes.length})</span>
            {licenseTypesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {licenseTypesOpen && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {LICENSE_TYPES.map(type => (
                <label key={type} className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer hover:text-white">
                  <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleLicenseType(type)} className="rounded border-slate-600" />
                  {type}
                </label>
              ))}
            </div>
          )}
          {selectedTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedTypes.map(type => (
                <span key={type} className="inline-flex items-center gap-1 text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                  {type}
                  <button onClick={() => toggleLicenseType(type)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
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
              <div key={v.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center"><Car className="w-5 h-5 text-slate-400" /></div>
                    <div>
                      <p className="text-white font-medium text-sm">{v.year} {v.make} {v.model || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{v.color} · Plate: <span className="font-mono text-blue-400">{v.plate}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.is_stolen && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">STOLEN</span>}
                    <button onClick={() => reportStolen(v)} className={`p-1.5 rounded-lg hover:bg-slate-700 ${v.is_stolen ? "text-green-400" : "text-red-400"}`} title={v.is_stolen ? "Mark recovered" : "Report stolen"}><Flag className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteVeh(v.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
                  <div>
                    <Label className="text-slate-500 text-xs">Registration</Label>
                    <Select value={v.registration_status || "Valid"} onValueChange={val => setVehicleStatus(v.id, "registration_status", val)}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">{regStatuses.map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-xs">Insurance</Label>
                    <Select value={v.insurance_status || "Valid"} onValueChange={val => setVehicleStatus(v.id, "insurance_status", val)}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">{insStatuses.map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
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
              <div><Label className="text-slate-300">Make</Label><Input value={vehForm.make} onChange={e => setVehForm({ ...vehForm, make: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Toyota" /></div>
              <div><Label className="text-slate-300">Model</Label><Input value={vehForm.model} onChange={e => setVehForm({ ...vehForm, model: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Camry" /></div>
              <div><Label className="text-slate-300">Color</Label><Input value={vehForm.color} onChange={e => setVehForm({ ...vehForm, color: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Black" /></div>
              <div><Label className="text-slate-300">Year</Label><Input value={vehForm.year} onChange={e => setVehForm({ ...vehForm, year: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. 2023" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Registration</Label>
                <Select value={vehForm.registration_status} onValueChange={val => setVehForm({ ...vehForm, registration_status: val })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{regStatuses.map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-slate-300">Insurance</Label>
                <Select value={vehForm.insurance_status} onValueChange={val => setVehForm({ ...vehForm, insurance_status: val })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{insStatuses.map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
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