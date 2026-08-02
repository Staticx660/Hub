import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import CharacterForm from "@/components/cad/civilian/CharacterForm";
import PersonaRail from "@/components/civilian/hub/PersonaRail";
import PersonaSummary from "@/components/civilian/hub/PersonaSummary";

export default function CivilianDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [department, setDepartment] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [charFormOpen, setCharFormOpen] = useState(false);
  const [editingChar, setEditingChar] = useState(null);
  const [warrants, setWarrants] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const depts = await base44.entities.CADDepartment.list();
        const civDept = depts.find(d => d.category === "Civilian") || depts[0];
        setDepartment(civDept);
        if (user?.id) {
          const chars = await base44.entities.Civilian.filter({ owner_user_id: user.id });
          setCharacters(chars);
          setSelectedId(chars[0]?.id || null);
          const allWarrants = await base44.entities.Warrant.filter({ status: "Active" });
          const charNames = new Set(chars.map(c => `${c.first_name} ${c.last_name}`));
          setWarrants(allWarrants.filter(w => charNames.has(w.person_name)));
        }
      } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const reloadCharacters = async () => {
    if (!user?.id) return;
    const chars = await base44.entities.Civilian.filter({ owner_user_id: user.id });
    setCharacters(chars);
    if (!chars.find(c => c.id === selectedId)) setSelectedId(chars[0]?.id || null);
  };

  const goToTerminal = () => { if (department) navigate(`/cad/civilian/${department.id}`); };
  const warrantsFor = (c) => warrants.filter(w => w.person_name === `${c.first_name} ${c.last_name}`);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }

  const selected = characters.find(c => c.id === selectedId) || null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 h-10 px-3 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
        <span className="text-[12.5px] font-semibold">Civilian Records Hub</span>
        <span className="ml-auto text-[11px] font-mono text-mdt-dim">
          {characters.length} IDENTITIES · {warrants.length} ACTIVE WARRANTS
        </span>
      </div>

      <div className="flex-1 min-h-0 flex">
        <PersonaRail
          characters={characters}
          selectedId={selectedId}
          onSelect={setSelectedId}
          warrantsFor={warrantsFor}
          onNew={() => { setEditingChar(null); setCharFormOpen(true); }}
        />
        <PersonaSummary
          character={selected}
          warrants={selected ? warrantsFor(selected) : []}
          onEdit={() => { setEditingChar(selected); setCharFormOpen(true); }}
          onOpenTerminal={goToTerminal}
        />
      </div>

      {department && (
        <CharacterForm open={charFormOpen} onOpenChange={setCharFormOpen} editing={editingChar} department={department} user={user} onSaved={reloadCharacters} />
      )}
    </div>
  );
}