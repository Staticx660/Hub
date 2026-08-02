import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Camera } from "lucide-react";
import AddressSearch from "@/components/cad/mdt/AddressSearch";
import { MField, MInput, MSelect, MSection } from "@/components/mdt/ui/formFields";
import { Btn } from "@/components/mdt/ui/primitives";
import MOptionSelect from "@/components/cad/civilian/terminal/MOptionSelect";

const HAIR_COLORS = ["", "Black", "Brown", "Blonde", "Red", "Gray", "White", "Bald", "Blue", "Green", "Pink", "Purple"];
const EYE_COLORS = ["", "Brown", "Blue", "Green", "Hazel", "Gray", "Amber", "Black"];
const RACES = ["", "White", "Black", "Hispanic", "Asian", "Native American", "Middle Eastern", "Pacific Islander", "Mixed", "Other"];
const SKIN_TONES = ["", "Fair", "Light", "Medium", "Tan", "Olive", "Brown", "Dark Brown", "Deep"];
const ALLERGY_OPTIONS = ["Penicillin", "Amoxicillin", "Aspirin", "Ibuprofen", "Sulfa Drugs", "Latex", "Bee Stings", "Wasp Stings", "Pollen", "Dust Mites", "Pet Dander", "Mold", "Codeine", "Morphine", "Iodine", "Contrast Dye", "Local Anesthetics", "NSAIDs", "Antibiotics", "Anticonvulsants", "Insulin", "Chemotherapy", "Adhesive Tape", "Nickel", "Gold", "Copper"];
const MEDICATION_OPTIONS = ["Insulin", "Albuterol", "EpiPen", "Blood Pressure Meds", "Pain Relievers", "Antidepressants", "Antibiotics", "Blood Thinners", "Steroids", "Inhaler", "Adderall", "Xanax", "Zoloft", "Prozac", "Lisinopril", "Metformin", "Atorvastatin", "Omeprazole", "Levothyroxine", "Gabapentin", "Hydrocodone", "Tramadol", "Warfarin", "Clopidogrel", "Amlodipine", "Metoprolol", "Losartan", "Pantoprazole", "Sertraline", "Lorazepam", "Diazepam", "Methylphenidate", "Insulin Pump", "Nitroglycerin", "Sumatriptan"];
const MEDICAL_HISTORY_OPTIONS = ["Diabetes Type 1", "Diabetes Type 2", "Asthma", "Heart Disease", "High Blood Pressure", "High Cholesterol", "Epilepsy", "Anxiety", "Depression", "PTSD", "Bipolar Disorder", "ADHD", "Arthritis", "Cancer", "Stroke", "Sleep Apnea", "COPD", "Kidney Disease", "Liver Disease", "Thyroid Condition", "Migraines", "Seizures", "Autoimmune Disease", "HIV/AIDS", "Hepatitis", "Osteoporosis", "Alzheimer's", "Parkinson's", "Sickle Cell", "Hemophilia", "Coronary Artery Disease", "Arrhythmia", "Cirrhosis", "Celiac Disease", "Crohn's Disease", "Ulcerative Colitis"];
const FOOD_ALLERGY_OPTIONS = ["Peanuts", "Shellfish", "Dairy", "Gluten", "Eggs", "Soy", "Tree Nuts", "Wheat", "Fish", "Sesame", "Corn", "Rice", "Oats", "Barley", "Rye", "Beef", "Pork", "Chicken", "Lamb", "Tomato", "Potato", "Carrot", "Celery", "Mustard", "Garlic", "Onion", "Apple", "Banana", "Strawberry", "Citrus", "Chocolate", "Caffeine", "Mushroom", "Avocado", "Coconut"];

function formatPhone(value) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function calculateAge(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : "";
}

const emptyForm = {
  first_name: "", middle_name: "", last_name: "", dob: "", gender: "Male",
  hair_color: "", eye_color: "", height: "", weight: "", race: "", skin_tone: "",
  occupation: "", address: "", zip_code: "", phone: "",
  emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: "",
  photo_url: "", allergies: [], medications: [], medical_history: [], food_allergies: [],
  drivers_license_types: [], notes: ""
};

export default function CharacterForm({ open, onOpenChange, editing, department, user, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && editing) setForm({ ...emptyForm, ...editing });
    else if (open) setForm(emptyForm);
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
        toast({ title: "Persona updated" });
      } else {
        await base44.entities.Civilian.create(data);
        toast({ title: "Persona created" });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mdt bg-mdt-bg border-mdt-line text-mdt-text max-w-3xl max-h-[90vh] overflow-y-auto mdt-scroll">
        <DialogHeader>
          <DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.09em] text-mdt-muted">
            {editing ? "Edit Persona" : "New Persona"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5">
          <MSection title="Identity">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-16 h-16 border border-mdt-line-2 bg-mdt-surface-3 overflow-hidden flex items-center justify-center flex-shrink-0">
                {form.photo_url ? <img src={form.photo_url} alt="" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-mdt-dim" />}
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 h-7 px-2 border border-mdt-line-2 bg-mdt-surface-3 text-[11.5px] text-mdt-text hover:bg-mdt-surface-4">
                  <Upload className="w-3.5 h-3.5" /> {uploading ? "Uploading..." : "Upload Photo"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <MField label="First Name *"><MInput value={form.first_name} onChange={e => set("first_name", e.target.value)} /></MField>
              <MField label="Middle Name"><MInput value={form.middle_name} onChange={e => set("middle_name", e.target.value)} /></MField>
              <MField label="Last Name *"><MInput value={form.last_name} onChange={e => set("last_name", e.target.value)} /></MField>
              <MField label="DOB *"><MInput type="date" value={form.dob} onChange={e => set("dob", e.target.value)} /></MField>
              <MField label="Age"><MInput value={calculateAge(form.dob) ? `${calculateAge(form.dob)} yrs` : ""} disabled /></MField>
              <MField label="Sex *"><MSelect value={form.gender} options={["Male", "Female", "Other"]} onChange={e => set("gender", e.target.value)} /></MField>
            </div>
          </MSection>

          <MSection title="Physical Description">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              <MField label="Hair"><MSelect value={form.hair_color} options={HAIR_COLORS} onChange={e => set("hair_color", e.target.value)} /></MField>
              <MField label="Eyes"><MSelect value={form.eye_color} options={EYE_COLORS} onChange={e => set("eye_color", e.target.value)} /></MField>
              <MField label="Race"><MSelect value={form.race} options={RACES} onChange={e => set("race", e.target.value)} /></MField>
              <MField label="Skin Tone"><MSelect value={form.skin_tone} options={SKIN_TONES} onChange={e => set("skin_tone", e.target.value)} /></MField>
              <MField label="Height"><MInput value={form.height} onChange={e => set("height", e.target.value)} placeholder="5ft 10in" /></MField>
              <MField label="Weight"><MInput value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="180 lbs" /></MField>
            </div>
          </MSection>

          <MSection title="Residence & Contact">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <MField label="Address" className="sm:col-span-2">
                <AddressSearch
                  value={form.address}
                  onChange={v => set("address", v)}
                  className="h-7 pl-8 pr-2 w-full bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent"
                  placeholder="Search address..."
                />
              </MField>
              <MField label="Zip Code"><MInput value={form.zip_code} onChange={e => set("zip_code", e.target.value)} /></MField>
              <MField label="Phone"><MInput value={form.phone} onChange={e => set("phone", formatPhone(e.target.value))} placeholder="(555) 123-4567" /></MField>
              <MField label="Occupation"><MInput value={form.occupation} onChange={e => set("occupation", e.target.value)} /></MField>
              <MField label="Emergency Contact"><MInput value={form.emergency_contact_name} onChange={e => set("emergency_contact_name", e.target.value)} /></MField>
              <MField label="EC Phone"><MInput value={form.emergency_contact_phone} onChange={e => set("emergency_contact_phone", formatPhone(e.target.value))} placeholder="(555) 123-4567" /></MField>
              <MField label="EC Relationship"><MInput value={form.emergency_contact_relationship} onChange={e => set("emergency_contact_relationship", e.target.value)} /></MField>
            </div>
          </MSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            <MOptionSelect label="Allergies" options={ALLERGY_OPTIONS} selected={form.allergies} onChange={v => set("allergies", v)} />
            <MOptionSelect label="Food Allergies" options={FOOD_ALLERGY_OPTIONS} selected={form.food_allergies} onChange={v => set("food_allergies", v)} />
            <MOptionSelect label="Medications" options={MEDICATION_OPTIONS} selected={form.medications} onChange={v => set("medications", v)} />
            <MOptionSelect label="Medical History" options={MEDICAL_HISTORY_OPTIONS} selected={form.medical_history} onChange={v => set("medical_history", v)} />
          </div>
        </div>

        <DialogFooter>
          <Btn variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>{editing ? "Update Persona" : "Create Persona"}</Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}