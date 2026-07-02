import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, ChevronDown, ChevronUp, Camera } from "lucide-react";

const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Gray", "White", "Bald", "Blue", "Green", "Pink", "Purple"];
const EYE_COLORS = ["Brown", "Blue", "Green", "Hazel", "Gray", "Amber", "Black"];
const SKIN_TONES = ["Fair", "Light", "Medium", "Tan", "Dark", "Deep"];
const ALLERGY_OPTIONS = ["Penicillin", "Aspirin", "Ibuprofen", "Latex", "Bee Stings", "Pollen", "Dust Mites", "Pet Dander", "Mold", "Sulfa Drugs"];
const MEDICATION_OPTIONS = ["Insulin", "Albuterol", "EpiPen", "Blood Pressure Meds", "Pain Relievers", "Antidepressants", "Antibiotics", "Blood Thinners", "Steroids", "Inhaler"];
const MEDICAL_HISTORY_OPTIONS = ["Diabetes", "Asthma", "Heart Disease", "High Blood Pressure", "Epilepsy", "Anxiety", "Depression", "PTSD", "Arthritis", "Cancer", "Stroke", "Sleep Apnea"];
const FOOD_ALLERGY_OPTIONS = ["Peanuts", "Shellfish", "Dairy", "Gluten", "Eggs", "Soy", "Tree Nuts", "Wheat", "Fish", "Sesame"];

function calculateAge(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : "";
}

function TagSelector({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-slate-800/40 rounded-lg p-3">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-sm font-medium text-slate-300">
        {label} ({selected.length})
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer hover:text-white">
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])} className="rounded border-slate-600" />
              {opt}
            </label>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
              {tag}
              <button onClick={() => onChange(selected.filter(s => s !== tag))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  first_name: "", middle_name: "", last_name: "", dob: "", gender: "Male",
  hair_color: "", eye_color: "", height: "", weight: "", skin_color: "",
  occupation: "", address: "", zip_code: "", phone: "",
  emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: "",
  photo_url: "", allergies: [], medications: [], medical_history: [], food_allergies: [], notes: ""
};

export default function CharacterForm({ open, onOpenChange, editing, department, user, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && editing) {
      setForm({ ...emptyForm, ...editing });
    } else if (open) {
      setForm(emptyForm);
    }
  }, [open, editing]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("photo_url", file_url);
    } catch (err) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.dob || !form.gender) {
      toast({ title: "Required fields missing", description: "First name, last name, DOB, and sex are required", variant: "destructive" });
      return;
    }
    try {
      const data = { ...form, department_id: department.id, owner_user_id: user.id, created_by_name: user.full_name };
      if (editing) {
        await base44.entities.Civilian.update(editing.id, data);
        toast({ title: "Character updated" });
      } else {
        await base44.entities.Civilian.create(data);
        toast({ title: "Character created" });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Character" : "New Character"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
              {form.photo_url ? <img src={form.photo_url} alt="" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-slate-600" />}
            </div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 border border-slate-700">
                <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload Photo"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>

          {/* Identity */}
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-slate-300">First Name *</Label><Input value={form.first_name} onChange={e => set("first_name", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">Middle Name</Label><Input value={form.middle_name} onChange={e => set("middle_name", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">Last Name *</Label><Input value={form.last_name} onChange={e => set("last_name", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-slate-300">DOB *</Label><Input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">Age</Label><Input value={calculateAge(form.dob) ? `${calculateAge(form.dob)} years` : ""} disabled className="bg-slate-800/50 border-slate-700 text-slate-500" /></div>
            <div><Label className="text-slate-300">Sex *</Label>
              <Select value={form.gender} onValueChange={v => set("gender", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{["Male", "Female", "Other"].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Physical */}
          <div className="grid grid-cols-4 gap-3">
            <div><Label className="text-slate-300">Hair</Label>
              <Select value={form.hair_color} onValueChange={v => set("hair_color", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{HAIR_COLORS.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Eyes</Label>
              <Select value={form.eye_color} onValueChange={v => set("eye_color", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{EYE_COLORS.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Skin</Label>
              <Select value={form.skin_color} onValueChange={v => set("skin_color", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{SKIN_TONES.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Height</Label><Input value={form.height} onChange={e => set("height", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="5ft 10in" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-slate-300">Weight</Label><Input value={form.weight} onChange={e => set("weight", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="180 lbs" /></div>
            <div><Label className="text-slate-300">Occupation</Label><Input value={form.occupation} onChange={e => set("occupation", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">Zip Code</Label><Input value={form.zip_code} onChange={e => set("zip_code", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-slate-300">Address</Label><Input value={form.address} onChange={e => set("address", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-slate-300">Emergency Contact</Label><Input value={form.emergency_contact_name} onChange={e => set("emergency_contact_name", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">EC Phone</Label><Input value={form.emergency_contact_phone} onChange={e => set("emergency_contact_phone", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">EC Relationship</Label><Input value={form.emergency_contact_relationship} onChange={e => set("emergency_contact_relationship", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>

          {/* Medical */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm font-semibold">Medical Information</Label>
            <TagSelector label="Allergies" options={ALLERGY_OPTIONS} selected={form.allergies} onChange={v => set("allergies", v)} />
            <TagSelector label="Medications" options={MEDICATION_OPTIONS} selected={form.medications} onChange={v => set("medications", v)} />
            <TagSelector label="Medical History" options={MEDICAL_HISTORY_OPTIONS} selected={form.medical_history} onChange={v => set("medical_history", v)} />
            <TagSelector label="Food Allergies" options={FOOD_ALLERGY_OPTIONS} selected={form.food_allergies} onChange={v => set("food_allergies", v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">{editing ? "Update Character" : "Create Character"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}