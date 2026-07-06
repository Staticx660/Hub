import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Trash2, Search, Car, User, Link2, ChevronDown, ChevronUp, Eye, FileText, Gavel, X } from "lucide-react";
import CivilianSearch from "@/components/cad/mdt/CivilianSearch";
import VehicleSearch from "@/components/cad/mdt/VehicleSearch";
import AddressSearch from "@/components/cad/mdt/AddressSearch";
import LinkedRecordsDialog from "@/components/cad/mdt/LinkedRecordsDialog";
import { logSystemEvent } from "@/lib/logSystemEvent";

const ALL_REPORT_TYPES = ["Incident", "Traffic Stop", "Field Contact", "Arrest", "Medical", "Fire", "Vehicle Accident", "Use of Force", "Evidence", "Other"];

function GridField({ label, children, span }) {
  return (
    <div className={span ? `col-span-${span}` : ""}>
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

const darkInput = "bg-[#0f1115] border-none text-white text-sm h-9 rounded-md focus-visible:ring-1 focus-visible:ring-slate-600 placeholder:text-slate-600";
const darkSelect = "bg-[#0f1115] border-none text-white text-sm h-9 rounded-md focus-visible:ring-1 focus-visible:ring-slate-600";

export default function ReportFormView({ department, session, initialType, templates, existingReport, onClose, onSaved }) {
  const fd = existingReport?.field_data || {};
  const loadedNarrative = fd.narrative != null ? fd.narrative : (existingReport?.description && existingReport.description !== "No narrative provided" ? existingReport.description : "");
  const loadedFieldData = (() => { const o = {}; Object.keys(fd).forEach(k => { if (!["flags", "civilian", "vehicle", "charges", "narrative", "linked_records", "signatures", "agency"].includes(k)) o[k] = fd[k]; }); return o; })();
  const linkedCivilian = existingReport?.linked_civilian_id ? { id: existingReport.linked_civilian_id, first_name: (existingReport.linked_civilian_name || "").split(" ")[0] || "", last_name: (existingReport.linked_civilian_name || "").split(" ").slice(1).join(" ") } : null;
  const [reportType, setReportType] = useState(existingReport?.report_type || initialType || "Incident");
  const [title, setTitle] = useState(existingReport?.title || "");
  const [location, setLocation] = useState(existingReport?.location || "");
  const [flags, setFlags] = useState(fd.flags || { armed: false, violent: false, mentally_ill: false });
  const [selectedCivilian, setSelectedCivilian] = useState(linkedCivilian);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [civilianData, setCivilianData] = useState(fd.civilian || {});
  const [vehicleData, setVehicleData] = useState(fd.vehicle || {});
  const [charges, setCharges] = useState(fd.charges || []);
  const [narrative, setNarrative] = useState(loadedNarrative || "");
  const [status, setStatus] = useState(existingReport?.status || "Draft");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [fieldData, setFieldData] = useState(loadedFieldData);
  const [chargeTypes, setChargeTypes] = useState([]);
  const [bondTypes, setBondTypes] = useState([]);
  const [penalCodes, setPenalCodes] = useState([]);
  const [showCivilianSearch, setShowCivilianSearch] = useState(false);
  const [showVehicleSearch, setShowVehicleSearch] = useState(false);
  const [showLinkedRecords, setShowLinkedRecords] = useState(false);
  const [linkedRecords, setLinkedRecords] = useState(fd.linked_records || []);
  const [saving, setSaving] = useState(false);
  const [recordNumber, setRecordNumber] = useState(existingReport?.run_number || "");
  const [officerName, setOfficerName] = useState(fd.signatures?.officer_name || "");
  const [observingSignature, setObservingSignature] = useState(fd.signatures?.observing_unit || "");
  const [supervisorSignature, setSupervisorSignature] = useState(fd.signatures?.supervisor || "");
  const { toast } = useToast();

  const reportTypes = department?.category === "Police" ? ["Incident", "Traffic Stop", "Field Contact", "Arrest", "Vehicle Accident", "Use of Force", "Evidence", "Other"]
    : department?.category === "Fire" ? ["Fire", "Vehicle Accident", "Other"]
    : department?.category === "EMS" ? ["Medical", "Vehicle Accident", "Other"]
    : ALL_REPORT_TYPES;

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [ct, bt, pc] = await Promise.all([
          base44.entities.ChargeType.list().catch(() => []),
          base44.entities.BondType.list().catch(() => []),
          base44.entities.PenalCode.list().catch(() => []),
        ]);
        setChargeTypes(ct); setBondTypes(bt); setPenalCodes(pc);
      } catch (e) { /* */ }
    };
    loadOptions();
  }, []);

  useEffect(() => { if (!existingReport) setTitle(`${reportType} Report`); }, [reportType]);

  useEffect(() => {
    const genRecordNum = async () => {
      if (existingReport) return;
      try {
        const existing = await base44.entities.CADReport.filter({ department_id: department.id });
        const num = String(existing.length + 1).padStart(4, "0");
        setRecordNumber(`REC-${num}`);
      } catch { setRecordNumber(`REC-${Date.now().toString().slice(-6)}`); }
    };
    genRecordNum();
  }, []);

  const handleCivilianSelected = (civilian) => {
    if (civilian) {
      setSelectedCivilian(civilian);
      setCivilianData({
        first_name: civilian.first_name || "",
        last_name: civilian.last_name || "",
        middle_name: civilian.middle_name || "",
        dob: civilian.dob || "",
        age: civilian.dob ? Math.floor((new Date() - new Date(civilian.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : "",
        gender: civilian.gender || "",
        aka: "",
        address: civilian.address || "",
        zip_code: civilian.zip_code || "",
        occupation: civilian.occupation || "",
        height: civilian.height || "",
        weight: civilian.weight || "",
        race: civilian.race || civilian.skin_color || "",
        hair_color: civilian.hair_color || "",
        eye_color: civilian.eye_color || "",
        emergency_contact: civilian.emergency_contact_name || "",
        emergency_relationship: civilian.emergency_contact_relationship || "",
        emergency_phone: civilian.emergency_contact_phone || "",
        phone: civilian.phone || "",
      });
      setShowCivilianSearch(false);
    } else {
      setSelectedCivilian(null);
      setCivilianData({});
    }
  };

  const handleVehicleSelected = (vehicle) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setVehicleData({
        plate: vehicle.plate || "",
        model: vehicle.model || "",
        color: vehicle.color || "",
        make: "",
        year: "",
        type: "",
      });
      setShowVehicleSearch(false);
    } else {
      setSelectedVehicle(null);
      setVehicleData({});
    }
  };

  const addCharge = () => {
    setCharges([...charges, { id: Date.now(), charge: "", charge_type: "", counts: 1, title_code: "", bond_type: "", bond_amount: 0, jail_time: "" }]);
  };

  const updateCharge = (id, key, val) => {
    setCharges(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c));
  };

  const removeCharge = (id) => {
    setCharges(charges.filter(c => c.id !== id));
  };

  const fineTotal = charges.reduce((sum, c) => sum + (Number(c.bond_amount) || 0), 0);

  const handleSave = async (asDraft) => {
    if (!title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const identifierValues = {};
      if (selectedTemplate?.fields) {
        selectedTemplate.fields.forEach(f => {
          if (IDENTIFIER_TYPES.includes(f.field_type)) {
            identifierValues[f.label] = getIdentifierValue(f.field_type);
          }
        });
      }
      const allFieldData = {
        ...identifierValues,
        ...fieldData,
        flags,
        civilian: civilianData,
        vehicle: vehicleData,
        charges,
        narrative,
        linked_records: linkedRecords,
        signatures: {
          officer_name: officerName,
          observing_unit: observingSignature,
          supervisor: supervisorSignature,
        },
        agency: {
          unit: session?.callsign || session?.user_name,
          unit_name: session?.user_name,
          department: department?.name,
          date: new Date().toLocaleDateString(),
        },
      };
      const payload = {
        title, report_type: reportType, description: narrative || "No narrative provided",
        location, department_id: department.id,
        filed_by_name: existingReport?.filed_by_name || (session.callsign || session.user_name),
        filed_by_id: existingReport?.filed_by_id || session.user_id,
        status: asDraft ? "Draft" : "Filed", run_number: recordNumber,
        template_id: selectedTemplate?.id || existingReport?.template_id || "",
        linked_civilian_id: selectedCivilian?.id || "",
        linked_civilian_name: selectedCivilian ? `${selectedCivilian.first_name} ${selectedCivilian.last_name}` : "",
        linked_vehicle_plate: vehicleData.plate || "",
        field_data: allFieldData,
      };
      if (existingReport) {
        await base44.entities.CADReport.update(existingReport.id, payload);
        logSystemEvent("Report Updated", "CAD", `Report "${title}" updated by ${session.callsign || session.user_name}`, { entity_type: "CADReport" });
        toast({ title: asDraft ? "Draft updated" : "Report updated" });
      } else {
        await base44.entities.CADReport.create(payload);
        logSystemEvent("Report Filed", "CAD", `Report "${title}" filed by ${session.callsign || session.user_name}`, { entity_type: "CADReport" });
        toast({ title: asDraft ? "Draft saved" : "Report filed" });
      }
      onSaved?.();
      } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
      setSaving(false);
      };

      const handleClose = async () => {
      if (!existingReport && title.trim() && !saving) {
      await handleSave(true);
      }
      onClose();
      };

      const IDENTIFIER_TYPES = ["id", "random", "UNIT_NUMBER", "UNIT_NAME", "UNIT_RANK", "UNIT_AGENCY", "UNIT_DEPARTMENT", "UNIT_SUBDIVISION", "UNIT_AGENCY_LOCATION", "UNIT_AGENCY_ZIP", "UNIT_LOCATION"];

  const getIdentifierValue = (fieldType) => {
    switch (fieldType) {
      case "UNIT_NUMBER": return session?.callsign || "";
      case "UNIT_NAME": return session?.user_name || "";
      case "UNIT_RANK": return session?.rank || "";
      case "UNIT_AGENCY": return "PUBLIC SAFETY";
      case "UNIT_DEPARTMENT": return department?.name || "";
      case "UNIT_SUBDIVISION": return "NOT SET";
      case "UNIT_AGENCY_LOCATION": return "";
      case "UNIT_AGENCY_ZIP": return "";
      case "UNIT_LOCATION": return location || "";
      case "id": return recordNumber || "";
      case "random": return `RND-${Date.now().toString().slice(-6)}`;
      default: return "";
    }
  };

  const availableTemplates = (templates || []).filter(t => {
    if (t.department_id && t.department_id !== department.id) return false;
    return reportTypes.includes(t.category);
  });

  return (
    <div className="h-full overflow-y-auto bg-[#1a1d21]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2c2f36] sticky top-0 bg-[#1a1d21] z-10">
        <button onClick={handleClose} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-lg font-bold text-white">{existingReport ? "Edit" : "New"} {reportType}</h2>
        <div className="ml-auto flex items-center gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className={`${darkSelect} w-40`}><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">{reportTypes.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}</SelectContent>
          </Select>
          {availableTemplates.length > 0 && (
            <Select onValueChange={(v) => { const t = availableTemplates.find(t => t.id === v); if (t) { setSelectedTemplate(t); setReportType(t.category); setTitle(t.name); } }}>
              <SelectTrigger className={`${darkSelect} w-40`}><SelectValue placeholder="Template..." /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">{availableTemplates.map(t => <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-5xl">
        {/* Flags */}
        <div className="bg-[#262a30] rounded-lg p-3">
          <div className="flex items-center gap-6">
            {[
              { key: "armed", label: "Armed" },
              { key: "violent", label: "Violent" },
              { key: "mentally_ill", label: "Mentally Ill" },
            ].map(f => (
              <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={flags[f.key]} onChange={e => setFlags({ ...flags, [f.key]: e.target.checked })} className="w-4 h-4 rounded border-2 border-red-500 bg-transparent accent-red-500" />
                <span className="text-sm text-white">{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Agency Information */}
        <div className="bg-[#262a30] rounded-lg p-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3">Agency Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <GridField label="Record #"><Input value={recordNumber} readOnly className={`${darkInput} font-mono text-cyan-400`} /></GridField>
            <GridField label="Agency"><Input value="PUBLIC SAFETY" readOnly className={darkInput} /></GridField>
            <GridField label="Department"><Input value={department?.name || ""} readOnly className={darkInput} /></GridField>
            <GridField label="Subdivision"><Input value="NOT SET" readOnly className={darkInput} /></GridField>
            <GridField label="Unit #"><Input value={session?.callsign || ""} readOnly className={darkInput} /></GridField>
            <GridField label="Unit Name"><Input value={session?.user_name || ""} readOnly className={darkInput} /></GridField>
            <GridField label="Date"><Input value={new Date().toLocaleDateString()} readOnly className={darkInput} /></GridField>
            <GridField label="Location"><AddressSearch value={location} onChange={setLocation} className={`w-full ${darkInput} pl-8`} placeholder="Search address..." /></GridField>
          </div>
        </div>

        {/* Linked Records */}
        <div className="bg-[#262a30] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Linked Records ({linkedRecords.length})</h3>
            <Button size="sm" onClick={() => setShowLinkedRecords(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"><Link2 className="w-3.5 h-3.5" /> Link Record</Button>
          </div>
          {linkedRecords.length > 0 && (
            <div className="space-y-1.5">
              {linkedRecords.map((rec, i) => (
                <div key={i} className="flex items-center justify-between bg-[#1a1d21] rounded-lg p-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {rec.type === "warrant" ? <Gavel className="w-3.5 h-3.5 text-red-400 flex-shrink-0" /> : rec.type === "bolo" ? <Eye className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" /> : <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{rec.title}</p>
                      <p className="text-[10px] text-slate-500">{rec.type}{rec.number ? ` · ${rec.number}` : ""}{rec.status ? ` · ${rec.status}` : ""}</p>
                    </div>
                  </div>
                  <button onClick={() => setLinkedRecords(linkedRecords.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
          {linkedRecords.length === 0 && <p className="text-xs text-slate-500">No records linked yet</p>}
        </div>

        {/* Civilian Information */}
        <div className="bg-[#262a30] rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Civilian Information</h3>
            <Button size="sm" onClick={() => setShowCivilianSearch(!showCivilianSearch)} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"><Search className="w-3.5 h-3.5" /> Search</Button>
          </div>
          {showCivilianSearch && (
            <div className="mb-3"><CivilianSearch selected={selectedCivilian} onSelected={handleCivilianSelected} /></div>
          )}
          {selectedCivilian && (
            <div className="mb-3 flex items-center gap-2 text-xs text-teal-400"><User className="w-3.5 h-3.5" /> Linked: {selectedCivilian.first_name} {selectedCivilian.last_name}</div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <GridField label="First"><Input value={civilianData.first_name || ""} onChange={e => setCivilianData({ ...civilianData, first_name: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Last"><Input value={civilianData.last_name || ""} onChange={e => setCivilianData({ ...civilianData, last_name: e.target.value })} className={darkInput} /></GridField>
            <GridField label="M.I."><Input value={civilianData.middle_name || ""} onChange={e => setCivilianData({ ...civilianData, middle_name: e.target.value })} className={darkInput} /></GridField>
            <GridField label="DOB"><Input type="date" value={civilianData.dob || ""} onChange={e => setCivilianData({ ...civilianData, dob: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Age"><Input value={civilianData.age || ""} readOnly className={darkInput} /></GridField>
            <GridField label="Sex">
              <Select value={civilianData.gender || ""} onValueChange={v => setCivilianData({ ...civilianData, gender: v })}>
                <SelectTrigger className={darkSelect}><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{["Male", "Female", "Other"].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
              </Select>
            </GridField>
            <div className="col-span-2 md:col-span-6"><GridField label="A.K.A. (Former/Known Alias)"><Input value={civilianData.aka || ""} onChange={e => setCivilianData({ ...civilianData, aka: e.target.value })} className={darkInput} /></GridField></div>
            <GridField label="Residence"><Input value={civilianData.address || ""} onChange={e => setCivilianData({ ...civilianData, address: e.target.value })} className={darkInput} /></GridField>
            <GridField label="ZIP Code"><Input value={civilianData.zip_code || ""} onChange={e => setCivilianData({ ...civilianData, zip_code: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Occupation"><Input value={civilianData.occupation || ""} onChange={e => setCivilianData({ ...civilianData, occupation: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Phone"><Input value={civilianData.phone || ""} onChange={e => setCivilianData({ ...civilianData, phone: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Height"><Input value={civilianData.height || ""} onChange={e => setCivilianData({ ...civilianData, height: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Weight"><Input value={civilianData.weight || ""} onChange={e => setCivilianData({ ...civilianData, weight: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Skin Tone"><Input value={civilianData.race || ""} onChange={e => setCivilianData({ ...civilianData, race: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Hair Color">
              <Select value={civilianData.hair_color || ""} onValueChange={v => setCivilianData({ ...civilianData, hair_color: v })}>
                <SelectTrigger className={darkSelect}><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{["Black", "Brown", "Blonde", "Red", "Gray", "White", "Other"].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
              </Select>
            </GridField>
            <GridField label="Eye Color">
              <Select value={civilianData.eye_color || ""} onValueChange={v => setCivilianData({ ...civilianData, eye_color: v })}>
                <SelectTrigger className={darkSelect}><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{["Brown", "Blue", "Green", "Hazel", "Gray", "Other"].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
              </Select>
            </GridField>
            <GridField label="Emergency Contact"><Input value={civilianData.emergency_contact || ""} onChange={e => setCivilianData({ ...civilianData, emergency_contact: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Relationship"><Input value={civilianData.emergency_relationship || ""} onChange={e => setCivilianData({ ...civilianData, emergency_relationship: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Contact Number"><Input value={civilianData.emergency_phone || ""} onChange={e => setCivilianData({ ...civilianData, emergency_phone: e.target.value })} className={darkInput} /></GridField>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-[#262a30] rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Vehicle Information</h3>
            <Button size="sm" onClick={() => setShowVehicleSearch(!showVehicleSearch)} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"><Search className="w-3.5 h-3.5" /> Search</Button>
          </div>
          {showVehicleSearch && (
            <div className="mb-3"><VehicleSearch selected={selectedVehicle} onSelected={handleVehicleSelected} /></div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <GridField label="Vehicle Type">
              <Select value={vehicleData.type || ""} onValueChange={v => setVehicleData({ ...vehicleData, type: v })}>
                <SelectTrigger className={darkSelect}><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{["Sedan", "SUV", "Truck", "Motorcycle", "Van", "Sports", "Other"].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
              </Select>
            </GridField>
            <GridField label="License Plate"><Input value={vehicleData.plate || ""} onChange={e => setVehicleData({ ...vehicleData, plate: e.target.value.toUpperCase() })} className={`${darkInput} font-mono`} /></GridField>
            <GridField label="Make"><Input value={vehicleData.make || ""} onChange={e => setVehicleData({ ...vehicleData, make: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Model"><Input value={vehicleData.model || ""} onChange={e => setVehicleData({ ...vehicleData, model: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Color"><Input value={vehicleData.color || ""} onChange={e => setVehicleData({ ...vehicleData, color: e.target.value })} className={darkInput} /></GridField>
            <GridField label="Year"><Input type="number" value={vehicleData.year || ""} onChange={e => setVehicleData({ ...vehicleData, year: e.target.value })} className={darkInput} /></GridField>
          </div>
        </div>

        {/* Charges */}
        <div className="bg-[#262a30] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-500">Charges</h3>
            <button onClick={addCharge} className="w-7 h-7 rounded-md bg-green-500 hover:bg-green-600 flex items-center justify-center"><Plus className="w-4 h-4 text-white" /></button>
          </div>
          <p className="text-xs text-slate-400 mb-3">Fine Total: ${fineTotal.toFixed(2)}</p>
          {charges.map((charge, idx) => (
            <div key={charge.id} className="bg-[#1a1d21] rounded-lg p-3 mb-2 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Charge #{idx + 1}</span>
                <button onClick={() => removeCharge(charge.id)} className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GridField label="Charge">
                  {penalCodes.length > 0 ? (
                    <Select value={charge.charge} onValueChange={v => { const pc = penalCodes.find(p => p.id === v); updateCharge(charge.id, "charge", pc ? `${pc.code} - ${pc.title}` : v); if (pc) { updateCharge(charge.id, "title_code", pc.code); updateCharge(charge.id, "bond_amount", pc.fine_amount || 0); updateCharge(charge.id, "jail_time", pc.jail_time_months ? `${pc.jail_time_months} month${pc.jail_time_months !== 1 ? 's' : ''}` : ""); } }}>
                      <SelectTrigger className={darkSelect}><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">{penalCodes.map(pc => <SelectItem key={pc.id} value={pc.id} className="text-white">{pc.code} - {pc.title}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <Input value={charge.charge} onChange={e => updateCharge(charge.id, "charge", e.target.value)} className={darkInput} placeholder="Charge..." />}
                </GridField>
                <GridField label="Charge Type">
                  {chargeTypes.length > 0 ? (
                    <Select value={charge.charge_type} onValueChange={v => updateCharge(charge.id, "charge_type", v)}>
                      <SelectTrigger className={darkSelect}><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">{chargeTypes.map(ct => <SelectItem key={ct.id} value={ct.name} className="text-white">{ct.name}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <Input value={charge.charge_type} onChange={e => updateCharge(charge.id, "charge_type", e.target.value)} className={darkInput} placeholder="Type..." />}
                </GridField>
                <GridField label="Counts"><Input type="number" value={charge.counts} onChange={e => updateCharge(charge.id, "counts", e.target.value)} className={darkInput} /></GridField>
                <GridField label="Title, Code"><Input value={charge.title_code} onChange={e => updateCharge(charge.id, "title_code", e.target.value)} className={darkInput} /></GridField>
                <GridField label="Bond Type">
                  {bondTypes.length > 0 ? (
                    <Select value={charge.bond_type} onValueChange={v => { const bt = bondTypes.find(b => b.name === v); updateCharge(charge.id, "bond_type", v); if (bt?.default_amount) updateCharge(charge.id, "bond_amount", bt.default_amount); }}>
                      <SelectTrigger className={darkSelect}><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">{bondTypes.map(bt => <SelectItem key={bt.id} value={bt.name} className="text-white">{bt.name}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <Input value={charge.bond_type} onChange={e => updateCharge(charge.id, "bond_type", e.target.value)} className={darkInput} placeholder="Bond..." />}
                </GridField>
                <GridField label="Bond/Fine Amount"><Input type="number" value={charge.bond_amount} onChange={e => updateCharge(charge.id, "bond_amount", e.target.value)} className={darkInput} /></GridField>
                <GridField label="Jail Time"><Input value={charge.jail_time} onChange={e => updateCharge(charge.id, "jail_time", e.target.value)} className={darkInput} placeholder="e.g. 30 days" /></GridField>
              </div>
            </div>
          ))}
          {charges.length === 0 && <p className="text-xs text-slate-500 text-center py-2">No charges added. Click + to add one.</p>}
        </div>

        {/* Narrative */}
        <div className="bg-[#262a30] rounded-lg p-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">Narrative</h3>
          <Textarea value={narrative} onChange={e => setNarrative(e.target.value)} className="bg-[#0f1115] border-none text-white min-h-[120px]" placeholder="Describe the incident in detail..." />
        </div>

        {/* Status */}
        <div className="bg-[#262a30] rounded-lg p-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <GridField label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={darkSelect}><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{["Draft", "Filed", "Reviewed", "Approved"].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
              </Select>
            </GridField>
            <GridField label="Officer Name"><Input value={officerName} onChange={e => setOfficerName(e.target.value)} className={darkInput} placeholder="Type officer name..." /></GridField>
            <GridField label="Supervisor/Judicial Signature"><Input value={supervisorSignature} onChange={e => setSupervisorSignature(e.target.value)} className={`${darkInput} ${supervisorSignature ? "text-green-400" : ""}`} placeholder="Type name to sign..." /></GridField>
            <GridField label="Observing Unit's Signature"><Input value={observingSignature} onChange={e => setObservingSignature(e.target.value)} className={`${darkInput} ${observingSignature ? "text-green-400" : ""}`} placeholder="Type name to sign..." /></GridField>
          </div>
        </div>

        {/* Template Fields */}
        {selectedTemplate?.fields?.length > 0 && (
          <div className="bg-[#262a30] rounded-lg p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Template Fields</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {selectedTemplate.fields.map((field, i) => {
                if (field.field_type === "label") {
                  return <div key={i} className="col-span-2 md:col-span-4"><h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700 pb-1">{field.label}</h4></div>;
                }
                if (IDENTIFIER_TYPES.includes(field.field_type)) {
                  return (
                    <GridField key={i} label={field.label}>
                      <Input value={getIdentifierValue(field.field_type)} readOnly className={`${darkInput} text-cyan-400 font-mono`} />
                    </GridField>
                  );
                }
                if (field.field_type === "status") {
                  return (
                    <GridField key={i} label={field.label}>
                      <Select value={fieldData[field.label] || ""} onValueChange={v => setFieldData({ ...fieldData, [field.label]: v })}>
                        <SelectTrigger className={darkSelect}><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">{["Draft", "Filed", "Reviewed", "Approved"].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </GridField>
                  );
                }
                return (
                  <GridField key={i} label={field.label}>
                    {field.field_type === "textarea" ? (
                      <Textarea value={fieldData[field.label] || ""} onChange={e => setFieldData({ ...fieldData, [field.label]: e.target.value })} className={`${darkInput} min-h-[60px]`} />
                    ) : field.field_type === "select" ? (
                      <Select value={fieldData[field.label] || ""} onValueChange={v => setFieldData({ ...fieldData, [field.label]: v })}>
                        <SelectTrigger className={darkSelect}><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">{(field.options || []).map(o => <SelectItem key={o} value={o} className="text-white">{o}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : field.field_type === "checkboxes" ? (
                      <div className="space-y-1">
                        {(field.options || []).map(opt => (
                          <label key={opt} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={(fieldData[field.label] || []).includes(opt)} onChange={e => { const cur = fieldData[field.label] || []; setFieldData({ ...fieldData, [field.label]: e.target.checked ? [...cur, opt] : cur.filter(c => c !== opt) }); }} className="rounded border-slate-600" />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : field.field_type === "address" ? (
                      <AddressSearch value={fieldData[field.label] || ""} onChange={v => setFieldData({ ...fieldData, [field.label]: v })} className="w-full bg-[#0f1115] border-none text-white text-sm h-9 rounded-md focus-visible:ring-1 focus-visible:ring-slate-600 placeholder:text-slate-600 pl-8" placeholder="Search address..." />
                    ) : field.field_type === "time" ? (
                      <Input type="time" value={fieldData[field.label] || ""} onChange={e => setFieldData({ ...fieldData, [field.label]: e.target.value })} className={darkInput} />
                    ) : field.field_type === "image" ? (
                      <div>
                        {fieldData[field.label] && <img src={fieldData[field.label]} alt="" className="w-full h-20 rounded object-cover mb-1" />}
                        <label className="cursor-pointer">
                          <span className="text-xs text-cyan-400 hover:text-cyan-300">Upload image</span>
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const { file_url } = await base44.integrations.Core.UploadFile({ file: f }); setFieldData({ ...fieldData, [field.label]: file_url }); } catch (err) { toast({ title: "Upload failed", variant: "destructive" }); } }} />
                        </label>
                      </div>
                    ) : (
                      <Input type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"} value={fieldData[field.label] || ""} onChange={e => setFieldData({ ...fieldData, [field.label]: e.target.value })} className={darkInput} />
                    )}
                  </GridField>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-[#1a1d21] border-t border-[#2c2f36] p-3 flex items-center justify-center gap-4">
        <button onClick={() => handleSave(false)} disabled={saving || !title.trim()} className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-40 flex items-center justify-center"><Plus className="w-6 h-6 text-white" /></button>
        <button onClick={handleClose} disabled={saving} className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-40 flex items-center justify-center"><X className="w-6 h-6 text-slate-300" /></button>
      </div>

      <LinkedRecordsDialog
        open={showLinkedRecords}
        onOpenChange={setShowLinkedRecords}
        department={department}
        linkedRecords={linkedRecords}
        onLink={(entry) => setLinkedRecords([...linkedRecords.filter(r => r.id !== entry.id), entry])}
      />
    </div>
  );
}