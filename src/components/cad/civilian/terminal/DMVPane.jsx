import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Car, Plus, Trash2, Flag, IdCard, Plane, Crosshair, Leaf } from "lucide-react";
import { Btn, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";
import { MField, MSelect } from "@/components/mdt/ui/formFields";
import MOptionSelect from "./MOptionSelect";
import VehicleDialog from "./VehicleDialog";

const LICENSES = [
  { key: "drivers_license_status", label: "Driver's License" },
  { key: "pilot_license_status", label: "Pilot License" },
  { key: "weapon_license_status", label: "Weapon License" },
  { key: "hunting_license_status", label: "DCNR / Fish & Game" },
];
const STATUSES = ["Valid", "Suspended", "Revoked", "None"];
const TONE = { Valid: "ok", Suspended: "warn", Revoked: "crit", None: "neutral" };
const LICENSE_TYPES = ["Standard", "CDL Class A", "CDL Class B", "CDL Class C", "Motorcycle", "Boat", "Commercial"];
const PILOT_ENDORSEMENTS = ["Private Pilot", "Commercial Pilot", "Instrument Rating", "Multi-Engine", "Helicopter", "Seaplane", "Flight Instructor", "ATP"];
const WEAPON_LICENSE_TYPES = ["Concealed Carry", "Open Carry", "Class 3/NFA", "FFL Dealer"];
const HUNTING_TYPES = ["Hunting", "Fishing", "Trapping", "Commercial Fishing", "Archery"];
const HUNTING_STAMPS = ["Deer", "Turkey", "Waterfowl", "Bear", "Elk", "Migratory Bird", "Archery", "Muzzleloader", "Small Game", "Big Game"];
const REG = ["Valid", "Expired", "Suspended", "None"];
const INS = ["Valid", "Expired", "None"];
const EMPTY_VEH = { plate: "", make: "", model: "", color: "", year: "", type: "", registration_status: "Valid", insurance_status: "Valid" };

export default function DMVPane({ character, department, user, onUpdate }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vehForm, setVehForm] = useState(EMPTY_VEH);
  const { toast } = useToast();

  const load = async () => {
    try {
      const v = await base44.entities.CivilianVehicle.filter({ owner_id: character.id });
      setVehicles(v);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [character.id]);

  const saveField = async (field, value) => {
    try {
      await base44.entities.Civilian.update(character.id, { [field]: value });
      if (onUpdate) await onUpdate();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const setVehicleStatus = async (vehId, field, status) => {
    try {
      await base44.entities.CivilianVehicle.update(vehId, { [field]: status });
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
      setVehForm(EMPTY_VEH);
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
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;

  return (
    <div className="p-2.5 space-y-2.5">
      <section className="border border-mdt-line bg-mdt-surface">
        <header className="h-7 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">Licensing</h3>
        </header>
        <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {LICENSES.map((l) => (
            <MField key={l.key} label={l.label}>
              <div className="flex items-center gap-1.5">
                <MSelect value={character[l.key] || "None"} options={STATUSES} onChange={(e) => saveField(l.key, e.target.value)} />
                <StatusPill tone={TONE[character[l.key] || "None"]}>{character[l.key] || "None"}</StatusPill>
              </div>
            </MField>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <MOptionSelect label="Driver's License Types" icon={IdCard} options={LICENSE_TYPES} selected={character.drivers_license_types || []} onChange={(v) => saveField("drivers_license_types", v)} />
        <MOptionSelect label="Pilot Endorsements" icon={Plane} options={PILOT_ENDORSEMENTS} selected={character.pilot_license_endorsements || []} onChange={(v) => saveField("pilot_license_endorsements", v)} />
        <MOptionSelect label="Weapon License Types" icon={Crosshair} options={WEAPON_LICENSE_TYPES} selected={character.weapon_license_types || []} onChange={(v) => saveField("weapon_license_types", v)} />
        <MOptionSelect label="DCNR / Fish & Game Types" icon={Leaf} options={HUNTING_TYPES} selected={character.hunting_license_types || []} onChange={(v) => saveField("hunting_license_types", v)} />
        <MOptionSelect label="DCNR / Fish & Game Stamps" icon={Leaf} options={HUNTING_STAMPS} selected={character.hunting_license_stamps || []} onChange={(v) => saveField("hunting_license_stamps", v)} />
      </div>

      <section className="border border-mdt-line bg-mdt-surface">
        <header className="h-7 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">Registered Vehicles</h3>
          <span className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-mono text-mdt-dim">{vehicles.length}</span>
            <Btn icon={Plus} onClick={() => setDialogOpen(true)}>Register</Btn>
          </span>
        </header>

        {vehicles.length === 0 ? (
          <EmptyState icon={Car} title="No vehicles registered" hint="Register a vehicle to appear in DMV lookups" />
        ) : (
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-mdt-surface-2">
                {["Plate", "Vehicle", "Type", "Color", "Registration", "Insurance", ""].map((h) => (
                  <th key={h} className="h-7 px-2 text-left border-b border-mdt-line text-[10px] font-semibold uppercase tracking-[0.08em] text-mdt-dim">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-mdt-line/60 hover:bg-mdt-surface-3/50">
                  <td className="px-2 h-8 font-mono text-mdt-text">
                    {v.plate} {v.is_stolen && <StatusPill tone="crit" className="ml-1">Stolen</StatusPill>}
                  </td>
                  <td className="px-2 h-8 text-mdt-text truncate">{v.year} {v.make} {v.model}</td>
                  <td className="px-2 h-8 text-mdt-muted">{v.type || "—"}</td>
                  <td className="px-2 h-8 text-mdt-muted">{v.color || "—"}</td>
                  <td className="px-2 h-8 w-[130px]"><MSelect value={v.registration_status || "Valid"} options={REG} onChange={(e) => setVehicleStatus(v.id, "registration_status", e.target.value)} /></td>
                  <td className="px-2 h-8 w-[120px]"><MSelect value={v.insurance_status || "Valid"} options={INS} onChange={(e) => setVehicleStatus(v.id, "insurance_status", e.target.value)} /></td>
                  <td className="px-2 h-8 text-right whitespace-nowrap">
                    <button onClick={() => reportStolen(v)} title={v.is_stolen ? "Mark recovered" : "Report stolen"} className={`p-1 ${v.is_stolen ? "text-emerald-400" : "text-red-400"} hover:bg-mdt-surface-3`}><Flag className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteVeh(v.id)} className="p-1 text-mdt-dim hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <VehicleDialog open={dialogOpen} onOpenChange={setDialogOpen} form={vehForm} setForm={setVehForm} onSubmit={addVehicle} />
    </div>
  );
}