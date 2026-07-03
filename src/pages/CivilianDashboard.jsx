import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { UserPlus, FileText, Car, Phone, AlertTriangle, ChevronRight, Users, Shield } from "lucide-react";
import CharacterForm from "@/components/cad/civilian/CharacterForm";

export default function CivilianDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [department, setDepartment] = useState(null);
  const [characters, setCharacters] = useState([]);
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
  };

  const goToMDT = () => { if (department) navigate(`/cad/civilian/${department.id}`); };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6 text-cyan-400" /> Civilian Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your characters, view criminal records, and access DMV services</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-cyan-400" /><span className="text-xs text-slate-500 uppercase">Characters</span></div>
          <p className="text-2xl font-bold text-white">{characters.length}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-slate-500 uppercase">Active Warrants</span></div>
          <p className="text-2xl font-bold text-red-400">{warrants.length}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Car className="w-4 h-4 text-green-400" /><span className="text-xs text-slate-500 uppercase">Civilian MDT</span></div>
          <Button onClick={goToMDT} size="sm" className="bg-cyan-600 hover:bg-cyan-700 gap-1.5 mt-1">Open MDT <ChevronRight className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Your Characters</h2>
          <Button onClick={() => { setEditingChar(null); setCharFormOpen(true); }} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5"><UserPlus className="w-3.5 h-3.5" /> New Character</Button>
        </div>
        {characters.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-xl">
            <UserPlus className="w-16 h-16 mx-auto mb-3 text-slate-700" />
            <p className="text-slate-500">No characters yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map(c => {
              const fullName = `${c.first_name} ${c.middle_name ? c.middle_name + " " : ""}${c.last_name}`;
              const charWarrants = warrants.filter(w => w.person_name === fullName);
              return (
                <div key={c.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-slate-600">{c.first_name?.[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{fullName}</h3>
                      <p className="text-xs text-slate-500">DOB: {c.dob || "N/A"}</p>
                      <p className="text-xs text-slate-500">{c.occupation || "No occupation"}</p>
                    </div>
                  </div>
                  {charWarrants.length > 0 && (
                    <div className="mb-2 text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {charWarrants.length} active warrant{charWarrants.length > 1 ? "s" : ""}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => { setEditingChar(c); setCharFormOpen(true); }} size="sm" variant="outline" className="border-slate-700 text-slate-300 flex-1">Edit</Button>
                    <Button onClick={goToMDT} size="sm" variant="outline" className="border-slate-700 text-slate-300 flex-1">MDT</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {warrants.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Active Warrants</h2>
          <div className="space-y-2">
            {warrants.map(w => (
              <div key={w.id} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">{w.person_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">{w.status}</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">{w.reason}</p>
                {w.charges?.length > 0 && <p className="text-xs text-slate-500 mt-1">Charges: {w.charges.join(", ")}</p>}
                {w.bail_amount > 0 && <p className="text-xs text-yellow-400 mt-1">Bail: ${w.bail_amount}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {department && (
        <CharacterForm open={charFormOpen} onOpenChange={setCharFormOpen} editing={editingChar} department={department} user={user} onSaved={reloadCharacters} />
      )}
    </div>
  );
}