import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, AlertCircle, Pill, Heart } from "lucide-react";

const calcAge = (dob) => {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return String(age);
};

export default function PCRPatientTab({ form, update }) {
  const [civilians, setCivilians] = useState([]);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    base44.entities.Civilian.list("-created_date", 300).then(setCivilians).catch(() => {});
  }, []);

  const results = search.length >= 2
    ? civilians.filter((c) => {
        const full = `${c.first_name} ${c.last_name}`.toLowerCase();
        return full.includes(search.toLowerCase()) || (c.last_name || "").toLowerCase().startsWith(search.toLowerCase());
      }).slice(0, 8)
    : [];

  const selectCivilian = (c) => {
    update("patient_civilian_id", c.id);
    update("patient_name", `${c.last_name}, ${c.first_name}`);
    update("patient_dob", c.dob || "");
    update("patient_age", c.dob ? calcAge(c.dob) : "");
    update("patient_gender", c.gender || "Unknown");
    update("patient_race", c.race || "");
    update("patient_address", c.address || "");
    update("patient_phone", c.phone || "");
    update("allergies", c.allergies || []);
    update("food_allergies", c.food_allergies || []);
    update("medications", c.medications || []);
    update("medical_history", c.medical_history || []);
    setSearch(`${c.last_name}, ${c.first_name}`);
    setShowResults(false);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
        <Label className="text-slate-400 text-xs flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Search Patient Database</Label>
        <div className="relative mt-1">
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setShowResults(true); }} onFocus={() => setShowResults(true)} className="bg-slate-800 border-slate-700 text-white" placeholder="Search by name to auto-fill from civilian records..." />
          {showResults && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {results.map((c) => (
                <button key={c.id} type="button" onClick={() => selectCivilian(c)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700 text-left border-b border-slate-700/50 last:border-0">
                  <div><p className="text-sm text-white font-medium">{c.last_name}, {c.first_name}</p><p className="text-xs text-slate-500">{c.dob ? `DOB ${new Date(c.dob).toLocaleDateString()}` : "No DOB"} · {c.gender || "Unknown"}</p></div>
                  {c.allergies?.length > 0 && <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" /> {c.allergies.length} allergies</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><UserPlus className="w-3 h-3" /> Selecting a patient auto-imports allergies, medications, and medical history. You can also type manually below.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="col-span-2"><Label className="text-slate-400 text-xs">Patient Name *</Label><Input value={form.patient_name || ""} onChange={(e) => update("patient_name", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Last, First" /></div>
        <div><Label className="text-slate-400 text-xs">Date of Birth</Label><Input type="date" value={form.patient_dob || ""} onChange={(e) => update("patient_dob", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
        <div><Label className="text-slate-400 text-xs">Age</Label><Input value={form.patient_age || ""} onChange={(e) => update("patient_age", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Auto from DOB" /></div>
        <div><Label className="text-slate-400 text-xs">Gender</Label><Select value={form.patient_gender || "Unknown"} onValueChange={(v) => update("patient_gender", v)}><SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700">{["Male", "Female", "Other", "Unknown"].map((g) => <SelectItem key={g} value={g} className="text-white">{g}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-slate-400 text-xs">Race</Label><Input value={form.patient_race || ""} onChange={(e) => update("patient_race", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
        <div><Label className="text-slate-400 text-xs">Blood Type</Label><Select value={form.blood_type || ""} onValueChange={(v) => update("blood_type", v)}><SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Unknown" /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700">{["", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((b) => <SelectItem key={b || "unk"} value={b || "Unknown"} className="text-white">{b || "Unknown"}</SelectItem>)}</SelectContent></Select></div>
        <div className="col-span-2"><Label className="text-slate-400 text-xs">Patient Home Address (Billing)</Label><Input value={form.patient_address || ""} onChange={(e) => update("patient_address", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Patient's residence for billing" /></div>
        <div><Label className="text-slate-400 text-xs">Phone</Label><Input value={form.patient_phone || ""} onChange={(e) => update("patient_phone", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
        <div className="col-span-3"><Label className="text-slate-400 text-xs">Incident / Scene Location</Label><Input value={form.incident_location || ""} onChange={(e) => update("incident_location", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Where the call occurred / patient found" /></div>
        <div className="col-span-3"><Label className="text-emerald-400 text-xs">Pickup Location (Billing)</Label><Input value={form.pickup_location || ""} onChange={(e) => update("pickup_location", e.target.value)} className="bg-slate-800 border-emerald-900/50 text-white" placeholder="Where patient was picked up for transport (may differ from scene)" /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <Label className="text-red-400 text-xs flex items-center gap-1.5 mb-2"><AlertCircle className="w-3.5 h-3.5" /> Allergies</Label>
          <Input value={(form.allergies || []).join(", ")} onChange={(e) => update("allergies", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="bg-slate-800 border-slate-700 text-white" placeholder="Penicillin, Latex..." />
          {form.food_allergies !== undefined && <Input value={(form.food_allergies || []).join(", ")} onChange={(e) => update("food_allergies", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="bg-slate-800 border-slate-700 text-white mt-2" placeholder="Food allergies: Peanuts, Shellfish..." />}
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <Label className="text-blue-400 text-xs flex items-center gap-1.5 mb-2"><Pill className="w-3.5 h-3.5" /> Current Medications</Label>
          <Input value={(form.medications || []).join(", ")} onChange={(e) => update("medications", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="bg-slate-800 border-slate-700 text-white" placeholder="Aspirin, Metformin, Insulin..." />
        </div>
        <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-lg p-3">
          <Label className="text-slate-400 text-xs flex items-center gap-1.5 mb-2"><Heart className="w-3.5 h-3.5" /> Past Medical History</Label>
          <Input value={(form.medical_history || []).join(", ")} onChange={(e) => update("medical_history", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="bg-slate-800 border-slate-700 text-white" placeholder="Hypertension, Diabetes, Asthma, Prior surgeries..." />
        </div>
      </div>
    </div>
  );
}