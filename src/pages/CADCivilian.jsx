import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, ChevronLeft, UserPlus, IdCard, Car, FileText, PhoneCall, Pencil } from "lucide-react";
import CharacterForm from "@/components/cad/civilian/CharacterForm";
import DMVPane from "@/components/cad/civilian/terminal/DMVPane";
import Call911Dialog from "@/components/cad/civilian/Call911Dialog";
import PersonaList from "@/components/cad/civilian/terminal/PersonaList";
import WorkspaceShell from "@/components/mdt/shell/WorkspaceShell";
import IdentityPane from "@/components/cad/civilian/terminal/IdentityPane";
import RecordsPane from "@/components/cad/civilian/terminal/RecordsPane";
import { Btn, EmptyState } from "@/components/mdt/ui/primitives";

export default function CADCivilian() {
  const { deptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [department, setDepartment] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panel, setPanel] = useState(null);
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
    <div className="mdt fixed inset-0 bg-mdt-bg flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" />
    </div>
  );

  if (error || !department) return (
    <div className="mdt fixed inset-0 bg-mdt-bg flex flex-col items-center justify-center gap-3">
      <AlertTriangle className="w-9 h-9 text-mdt-dim" />
      <h1 className="text-[15px] font-semibold text-mdt-text">{error ? "Something went wrong" : "Department not found"}</h1>
      {error && <p className="text-[12.5px] text-mdt-muted">{error}</p>}
      <Btn icon={ChevronLeft} onClick={() => window.history.back()}>Go Back</Btn>
    </div>
  );

  const fullName = selectedChar ? `${selectedChar.first_name} ${selectedChar.middle_name ? selectedChar.middle_name + " " : ""}${selectedChar.last_name}` : "";

  const navItems = [
    { key: "identity", label: "Identity", icon: IdCard },
    { key: "dmv", label: "DMV", icon: Car },
    { key: "records", label: "Records", icon: FileText },
  ];

  const menus = [
    {
      label: "Persona",
      items: [
        { label: "New Persona", icon: UserPlus, onSelect: () => { setEditingChar(null); setCharFormOpen(true); } },
        { label: "Edit Persona", icon: Pencil, disabled: !selectedChar, onSelect: () => { setEditingChar(selectedChar); setCharFormOpen(true); } },
        { label: "Call 911", icon: PhoneCall, disabled: !selectedChar, onSelect: () => setCall911Open(true) },
      ],
    },
  ];

  return (
    <>
      <WorkspaceShell
        agency="Civilian Device"
        subtitle={department.name}
        unit={fullName || "NO PERSONA"}
        metrics={[{ label: "Personas", value: characters.length }]}
        navItems={navItems}
        active={panel || "identity"}
        onNavigate={(key) => setPanel(key === "identity" ? null : key)}
        menus={menus}
        headerRight={<Btn icon={ChevronLeft} onClick={() => navigate("/cad")}>Exit</Btn>}
      >
        <div className="flex-1 min-h-0 flex">
          <PersonaList
            characters={characters}
            selectedChar={selectedChar}
            onSelect={(id) => { setSelectedChar(characters.find(c => c.id === id)); setPanel(null); }}
          />
          <div className="flex-1 min-w-0 overflow-auto mdt-scroll">
            {!selectedChar ? (
              <EmptyState icon={UserPlus} title="No persona on this device" hint="Create a persona to use the civilian terminal" />
            ) : panel === "records" ? (
              <RecordsPane fullName={fullName} warrants={warrants} bolos={bolos} reports={reports} />
            ) : panel === "dmv" ? (
              <DMVPane character={selectedChar} department={department} user={user} onUpdate={reloadCharacter} />
            ) : (
              <IdentityPane character={selectedChar} fullName={fullName} />
            )}
          </div>
        </div>
      </WorkspaceShell>

      <CharacterForm open={charFormOpen} onOpenChange={setCharFormOpen} editing={editingChar} department={department} user={user} onSaved={reloadCharacters} />

      <Call911Dialog
        open={call911Open}
        onOpenChange={setCall911Open}
        form={call911Form}
        setForm={setCall911Form}
        callerLabel={`${fullName}${selectedChar?.phone ? ` · ${selectedChar.phone}` : ""}`}
        onSubmit={handle911}
      />
    </>
  );
}