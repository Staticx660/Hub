import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Layers, Plus, Trash2, Users } from "lucide-react";

export default function GroupsView({ department, session }) {
  const [groups, setGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const { toast } = useToast();

  const load = async () => {
    try {
      const [g, s] = await Promise.all([
        base44.entities.CADUnitGroup.filter({ department_id: department.id }),
        base44.entities.CADSession.filter({ department_id: department.id, is_active: true }),
      ]);
      setGroups(g); setSessions(s);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createGroup = async () => {
    if (!groupName) return;
    try {
      await base44.entities.CADUnitGroup.create({ name: groupName, department_id: department.id, unit_ids: [session.id] });
      toast({ title: "Custom group created" });
      setGroupName(""); setDialogOpen(false); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const disbandGroup = async (id) => {
    if (!confirm("Disband this group?")) return;
    await base44.entities.CADUnitGroup.delete(id);
    toast({ title: "Group disbanded" });
    load();
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Layers className="w-4 h-4" /> Active Groups</h2>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5"><Plus className="w-3.5 h-3.5" /> Create Group</Button>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600"><Layers className="w-12 h-12 mb-3 opacity-30" /><p>No active groups</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groups.map((g) => {
              const members = sessions.filter((s) => g.unit_ids?.includes(s.id));
              return (
                <div key={g.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div><h3 className="font-semibold text-white">{g.name}</h3><p className="text-xs text-slate-500">{members.length} members</p></div>
                    <button onClick={() => disbandGroup(g.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  {g.description && <p className="text-xs text-slate-400 mb-2">{g.description}</p>}
                  <div className="space-y-1">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300 flex items-center gap-1.5"><Users className="w-3 h-3" /> {m.callsign || m.user_name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${m.status === "Available" ? "bg-green-500/15 text-green-400" : m.status === "On Call" ? "bg-red-500/15 text-red-400" : "bg-slate-700 text-slate-400"}`}>{m.status}</span>
                      </div>
                    ))}
                    {members.length === 0 && <p className="text-xs text-slate-600">No active members</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">Create Custom Group</DialogTitle></DialogHeader>
          <div><Label className="text-slate-300">Group Name</Label><Input value={groupName} onChange={(e) => setGroupName(e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Traffic Unit, Air Support" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={createGroup} disabled={!groupName} className="bg-blue-600 hover:bg-blue-700">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}