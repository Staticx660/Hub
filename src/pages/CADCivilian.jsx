import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, ChevronLeft, UserPlus } from "lucide-react";
import CharacterForm from "@/components/cad/civilian/CharacterForm";
import CivilianDMV from "@/components/cad/civilian/CivilianDMV";
import CivilianCharacterBar from "@/components/cad/civilian/CivilianCharacterBar";
import CivilianProfilePanel from "@/components/cad/civilian/CivilianProfilePanel";
import CivilianRecordsPanel from "@/components/cad/civilian/CivilianRecordsPanel";
import Call911Dialog from "@/components/cad/civilian/Call911Dialog";
import { ConsolePanel, ConsoleBtn, ConsoleEmpty } from "@/components/cad/console/ConsoleUI";
import { useCadTheme } from "@/hooks/useCadTheme";

const OCRP_LOGO = "https://media.base44.com/images/public/6a441f279b9d3cd678958799/5a43a1b46_OCRP20.png";

export default function CADCivilian() {
  const { deptId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [department, setDepartment] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panel, setPanel] = useState(null);
  const { theme } = useCadTheme();
  const retro = theme === "retro";
  const [charFormOpen, setCharFormOpen] = useState(false);
  const [editingChar, setEditingChar] = useState(null);
  const [call911Open, setCall911Open] = useState(false);
  const [call911Form, setCall911Form] = useState({ call_type: "Medical Emergency", location: "", cross_streets: "", postal: "", block: "", description: "", priority: "1 - High" });
  const [warrants, setWarrants] = useState([]);
  const [bolos, setBolos] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!deptId) { setLoading(false); setError("No department specified"); return; }
    let active = true;
    const load = async () => {
      try {
        const dept = await base44.entities.CADDepartment.get(deptId);
        if (!active) return;
        setDepartment(dept);
        if (user?.id) {
          const chars = await base44.entities.Civilian.filter({ owner_user_id: user.id });
          if (!active) return;
          setCharacters(chars);
          setSelectedChar(chars[0] || null);
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [deptId, user?.id]);

  const loadRecords = async () => {
    if (!selectedChar || !department) return;
    const name = `${selectedChar.first_name} ${selectedChar.last_name}`;
    try {
      const [w, b, r] = await Promise.all([
        base44.entities.Warrant.filter({ person_name: name }),
        base44.entities.BOLO.filter({ person_name: name }),
        base44.entities.CADReport.filter({ department_id: department.id }),
      ]);
      setWarrants(w);
      setBolos(b);
      setReports(r.filter(rep => rep.description?.includes(name) || rep.title?.includes(name) || rep.linked_civilian_name === name || rep.linked_civilian_id === selectedChar.id));
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  useEffect(() => { if (panel === "records" && selectedChar) loadRecords(); }, [panel, selectedChar]);

  const reloadCharacter = async () => {
    if (!selectedChar) return;
    try {
      const updated = await base44.entities.Civilian.get(selectedChar.id);
      setSelectedChar(updated);
    } catch (e) { /* silent */ }
  };

  const reloadCharacters = async () => {
    if (!user?.id) return;
    try {
      const chars = await base44.entities.Civilian.filter({ owner_user_id: user.id });
      setCharacters(chars);
      const updated = selectedChar ? chars.find(c => c.id === selectedChar.id) : null;
      setSelectedChar(updated || chars[0] || null);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handle911 = async () => {
    if (!call911Form.location || !selectedChar) return;
    try {
      const depts = await base44.entities.CADDepartment.list();
      const policeDept = depts.find(d => d.category === "Police");
      const dispatchDept = depts.find(d => d.category === "Dispatch") || policeDept || depts.find(d => d.id === deptId);
      const runNum = `911-${Date.now().toString().slice(-6)}`;
      await base44.entities.ActiveCall.create({
        call_type: call911Form.call_type, priority: call911Form.priority, status: "Pending",
        call_origin: "911",
        location: call911Form.location, cross_streets: call911Form.cross_streets,
        postal: call911Form.postal, block: call911Form.block,
        description: call911Form.description,
        caller_name: `${selectedChar.first_name} ${selectedChar.last_name}`,
        caller_phone: selectedChar.phone || "",
        department_id: dispatchDept?.id || deptId, run_number: runNum,
        assignment_log: [{ unit_name: "911 Caller", action: "call_placed", timestamp: new Date().toISOString(), message: `${call911Form.call_type}: ${call911Form.description}` }],
      });
      toast({ title: "911 call placed", description: runNum });
      setCall911Open(false);
      setCall911Form({ call_type: "Medical Emergency", location: "", cross_streets: "", postal: "", block: "", description: "", priority: "1 - High" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-2 border-cad-border border-t-cad-accent rounded-full animate-spin" />
    </div>
  );

  if (error || !department) return (
    <div className="cad-font flex flex-col items-center justify-center py-20 gap-3">
      <AlertTriangle className="w-12 h-12 text-cad-dim" />
      <h1 className="text-lg font-semibold text-cad-text">{error ? "Something went wrong" : "Department not found"}</h1>
      {error && <p className="text-[13px] text-cad-muted">{error}</p>}
      <ConsoleBtn icon={ChevronLeft} onClick={() => window.history.back()}>Go Back</ConsoleBtn>
    </div>
  );

  const fullName = selectedChar ? `${selectedChar.first_name} ${selectedChar.middle_name ? selectedChar.middle_name + " " : ""}${selectedChar.last_name}` : "";

  return (
    <div className={`min-h-screen cad-gradient-bg cad-font p-4 lg:p-6 space-y-3 ${retro ? "retro-shell" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={OCRP_LOGO} alt="OCRP" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className="text-xl font-bold text-cad-text tracking-tight">{department.name}</h1>
            <p className="text-[12.5px] text-cad-muted">Civilian Portal</p>
          </div>
        </div>
        <Link to="/cad">
          <ConsoleBtn icon={ChevronLeft}>Back to CAD</ConsoleBtn>
        </Link>
      </div>

      <CivilianCharacterBar
        characters={characters}
        selectedChar={selectedChar}
        onSelect={(id) => { setSelectedChar(characters.find(c => c.id === id)); setPanel(null); }}
        panel={panel}
        setPanel={setPanel}
        onNew={() => { setEditingChar(null); setCharFormOpen(true); }}
        onEdit={() => { setEditingChar(selectedChar); setCharFormOpen(true); }}
        on911={() => setCall911Open(true)}
      />

      {!selectedChar ? (
        <ConsolePanel title="Character">
          <ConsoleEmpty
            icon={UserPlus}
            title="No character selected"
            hint="Create a character to get started"
            action={<ConsoleBtn variant="primary" icon={UserPlus} onClick={() => { setEditingChar(null); setCharFormOpen(true); }}>New Character</ConsoleBtn>}
          />
        </ConsolePanel>
      ) : panel === "records" ? (
        <CivilianRecordsPanel fullName={fullName} warrants={warrants} bolos={bolos} reports={reports} />
      ) : panel === "dmv" ? (
        <CivilianDMV character={selectedChar} department={department} user={user} onUpdate={reloadCharacter} />
      ) : (
        <CivilianProfilePanel character={selectedChar} fullName={fullName} />
      )}

      <CharacterForm open={charFormOpen} onOpenChange={setCharFormOpen} editing={editingChar} department={department} user={user} onSaved={reloadCharacters} />

      <Call911Dialog
        open={call911Open}
        onOpenChange={setCall911Open}
        form={call911Form}
        setForm={setCall911Form}
        callerLabel={`${fullName}${selectedChar?.phone ? ` · ${selectedChar.phone}` : ""}`}
        onSubmit={handle911}
      />
    </div>
  );
}