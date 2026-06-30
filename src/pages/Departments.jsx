import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { 
  Plus, Shield, Flame, HeartPulse, Landmark, Lock, Bike, Radio,
  Edit, Trash2, Settings, X, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const categories = ["Police & Sheriff", "Fire & EMS", "Hospitals & Medical", "Government & State", "Private Security", "Motorcycle Clubs", "Civilians", "Communications", "Other"];

const categoryIcons = {
  "Police & Sheriff": Shield,
  "Fire & EMS": Flame,
  "Hospitals & Medical": HeartPulse,
  "Government & State": Landmark,
  "Private Security": Lock,
  "Motorcycle Clubs": Bike,
  "Civilians": Users,
  "Communications": Radio,
  "Other": Shield,
};

const defaultRanks = {
  "Police & Sheriff": [
    { name: "Chief", level: 10, color: "#FFD700" },
    { name: "Assistant Chief", level: 9, color: "#C0C0C0" },
    { name: "Captain", level: 8, color: "#CD7F32" },
    { name: "Lieutenant", level: 7, color: "#3B82F6" },
    { name: "Sergeant", level: 6, color: "#8B5CF6" },
    { name: "Corporal", level: 5, color: "#10B981" },
    { name: "Senior Officer", level: 4, color: "#6366F1" },
    { name: "Officer", level: 3, color: "#64748B" },
    { name: "Probationary Officer", level: 2, color: "#94A3B8" },
    { name: "Cadet", level: 1, color: "#CBD5E1" },
  ],
  "Fire & EMS": [
    { name: "Fire Chief", level: 10, color: "#FFD700" },
    { name: "Deputy Chief", level: 9, color: "#C0C0C0" },
    { name: "Battalion Chief", level: 8, color: "#CD7F32" },
    { name: "Captain", level: 7, color: "#EF4444" },
    { name: "Lieutenant", level: 6, color: "#F97316" },
    { name: "Engineer", level: 5, color: "#EAB308" },
    { name: "Firefighter/Paramedic", level: 4, color: "#22C55E" },
    { name: "Firefighter/EMT", level: 3, color: "#3B82F6" },
    { name: "Probationary FF", level: 2, color: "#94A3B8" },
    { name: "Recruit", level: 1, color: "#CBD5E1" },
  ],
  "Hospitals & Medical": [
    { name: "Chief Medical Officer", level: 10, color: "#FFD700" },
    { name: "Medical Director", level: 9, color: "#C0C0C0" },
    { name: "Attending Physician", level: 8, color: "#CD7F32" },
    { name: "Senior Surgeon", level: 7, color: "#EF4444" },
    { name: "Surgeon", level: 6, color: "#F97316" },
    { name: "Registered Nurse", level: 5, color: "#EAB308" },
    { name: "Paramedic", level: 4, color: "#22C55E" },
    { name: "EMT", level: 3, color: "#3B82F6" },
    { name: "Medical Intern", level: 2, color: "#94A3B8" },
    { name: "Volunteer", level: 1, color: "#CBD5E1" },
  ],
  "Government & State": [
    { name: "Governor", level: 10, color: "#FFD700" },
    { name: "Lieutenant Governor", level: 9, color: "#C0C0C0" },
    { name: "Secretary of State", level: 8, color: "#CD7F32" },
    { name: "State Senator", level: 7, color: "#EF4444" },
    { name: "State Representative", level: 6, color: "#F97316" },
    { name: "Mayor", level: 5, color: "#EAB308" },
    { name: "City Council Member", level: 4, color: "#22C55E" },
    { name: "Judge", level: 3, color: "#3B82F6" },
    { name: "Clerk", level: 2, color: "#94A3B8" },
    { name: "Intern", level: 1, color: "#CBD5E1" },
  ],
  "Private Security": [
    { name: "Director of Security", level: 10, color: "#FFD700" },
    { name: "Assistant Director", level: 9, color: "#C0C0C0" },
    { name: "Security Captain", level: 8, color: "#CD7F32" },
    { name: "Security Lieutenant", level: 7, color: "#EF4444" },
    { name: "Senior Sergeant", level: 6, color: "#F97316" },
    { name: "Sergeant", level: 5, color: "#EAB308" },
    { name: "Senior Officer", level: 4, color: "#22C55E" },
    { name: "Security Officer", level: 3, color: "#3B82F6" },
    { name: "Probationary Officer", level: 2, color: "#94A3B8" },
    { name: "Trainee", level: 1, color: "#CBD5E1" },
  ],
  "Motorcycle Clubs": [
    { name: "President", level: 10, color: "#FFD700" },
    { name: "Vice President", level: 9, color: "#C0C0C0" },
    { name: "Sergeant-at-Arms", level: 8, color: "#CD7F32" },
    { name: "Road Captain", level: 7, color: "#EF4444" },
    { name: "Treasurer", level: 6, color: "#F97316" },
    { name: "Secretary", level: 5, color: "#EAB308" },
    { name: "Full Patch Member", level: 4, color: "#22C55E" },
    { name: "Prospect", level: 3, color: "#3B82F6" },
    { name: "Hangaround", level: 2, color: "#94A3B8" },
    { name: "Guest", level: 1, color: "#CBD5E1" },
  ],
  "Civilians": [
    { name: "Civilian Coordinator", level: 5, color: "#22C55E" },
    { name: "Registered Civilian", level: 4, color: "#3B82F6" },
    { name: "Active Civilian", level: 3, color: "#64748B" },
    { name: "New Civilian", level: 2, color: "#94A3B8" },
    { name: "Visitor", level: 1, color: "#CBD5E1" },
  ],
  "Communications": [
    { name: "Director of Communications", level: 10, color: "#FFD700" },
    { name: "Deputy Director", level: 9, color: "#C0C0C0" },
    { name: "Communications Chief", level: 8, color: "#CD7F32" },
    { name: "Senior Dispatcher", level: 7, color: "#EF4444" },
    { name: "Dispatcher", level: 6, color: "#F97316" },
    { name: "Senior Operator", level: 5, color: "#EAB308" },
    { name: "Communications Operator", level: 4, color: "#22C55E" },
    { name: "Trainee Operator", level: 3, color: "#3B82F6" },
    { name: "Probationary", level: 2, color: "#94A3B8" },
    { name: "Recruit", level: 1, color: "#CBD5E1" },
  ],
  "Other": [
    { name: "Director", level: 5, color: "#22C55E" },
    { name: "Manager", level: 4, color: "#3B82F6" },
    { name: "Member", level: 3, color: "#64748B" },
    { name: "Associate", level: 2, color: "#94A3B8" },
    { name: "New Member", level: 1, color: "#CBD5E1" },
  ],
};

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", description: "", max_slots: "", discord_webhook_url: "", shift_quota_weekly: "", ranks: [] });
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [d, m] = await Promise.all([
        base44.entities.Department.list(),
        base44.entities.RosterMember.list(),
      ]);
      setDepartments(d);
      setMembers(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    try {
      const data = {
        ...form,
        max_slots: form.max_slots ? parseInt(form.max_slots) : null,
        shift_quota_weekly: form.shift_quota_weekly ? parseInt(form.shift_quota_weekly) : null,
      };
      data.ranks = form.ranks || [];
      if (editing) {
        await base44.entities.Department.update(editing.id, data);
        toast({ title: "Department updated" });
      } else {
        await base44.entities.Department.create(data);
        toast({ title: "Department created" });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", category: "", description: "", max_slots: "", discord_webhook_url: "", shift_quota_weekly: "", ranks: [] });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this department and all associated data?")) return;
    try {
      await base44.entities.Department.delete(id);
      toast({ title: "Department deleted" });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({
      name: dept.name || "",
      category: dept.category || "",
      description: dept.description || "",
      max_slots: dept.max_slots?.toString() || "",
      discord_webhook_url: dept.discord_webhook_url || "",
      shift_quota_weekly: dept.shift_quota_weekly?.toString() || "",
      ranks: dept.ranks || [],
    });
    setShowForm(true);
  };

  const addRank = () => {
    setForm({...form, ranks: [...(form.ranks || []), { name: "", level: 1, color: "#64748B" }]});
  };

  const updateRank = (idx, field, value) => {
    const ranks = [...(form.ranks || [])];
    ranks[idx] = { ...ranks[idx], [field]: field === "level" ? (parseInt(value) || 0) : value };
    setForm({...form, ranks});
  };

  const removeRank = (idx) => {
    setForm({...form, ranks: (form.ranks || []).filter((_, i) => i !== idx)});
  };

  const loadDefaultRanks = () => {
    if (form.category && defaultRanks[form.category]) {
      setForm({...form, ranks: defaultRanks[form.category]});
      toast({ title: "Default ranks loaded" });
    } else {
      toast({ title: "Select a category first", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Departments</h1>
          <p className="text-slate-400 text-sm mt-1">Manage all department rosters</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: "", category: "", description: "", max_slots: "", discord_webhook_url: "", shift_quota_weekly: "", ranks: [] }); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-16 text-center">
          <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No departments yet</h3>
          <p className="text-slate-400 mb-4">Create your first department to start building rosters</p>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Create Department
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const Icon = categoryIcons[dept.category] || Shield;
            const deptMembers = members.filter(m => m.department_id === dept.id || (m.additional_department_ids || []).includes(dept.id));
            return (
              <div key={dept.id} className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden group">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{dept.name}</h3>
                        <p className="text-xs text-slate-500">{dept.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(dept.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {dept.description && (
                    <p className="text-sm text-slate-400 mt-3 line-clamp-2">{dept.description}</p>
                  )}
                  <div className="mt-4 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{deptMembers.length}{dept.max_slots ? `/${dept.max_slots}` : ""}</span>
                    </div>
                  </div>
                </div>
                <Link
                  to={`/departments/${dept.id}`}
                  className="block px-5 py-3 bg-slate-800/50 text-sm text-blue-400 hover:text-blue-300 hover:bg-slate-800 transition-colors text-center font-medium"
                >
                  View Roster →
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Department" : "New Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="e.g. Los Santos Police" />
            </div>
            <div>
              <Label className="text-slate-300">Category *</Label>
              <Select value={form.category} onValueChange={v => {
                if (!editing && (!form.ranks || form.ranks.length === 0) && defaultRanks[v]) {
                  setForm({...form, category: v, ranks: defaultRanks[v]});
                } else {
                  setForm({...form, category: v});
                }
              }}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {categories.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="Brief description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Max Slots</Label>
                <Input type="number" value={form.max_slots} onChange={e => setForm({...form, max_slots: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="e.g. 20" />
              </div>
              <div>
                <Label className="text-slate-300">Weekly Shift Quota</Label>
                <Input type="number" value={form.shift_quota_weekly} onChange={e => setForm({...form, shift_quota_weekly: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="e.g. 3" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Discord Webhook URL</Label>
              <Input value={form.discord_webhook_url} onChange={e => setForm({...form, discord_webhook_url: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="https://discord.com/api/webhooks/..." />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Ranks</Label>
                <button type="button" onClick={loadDefaultRanks} className="text-xs text-blue-400 hover:text-blue-300">Load Defaults</button>
              </div>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {(form.ranks || []).map((rank, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={rank.color || "#64748B"}
                      onChange={e => updateRank(idx, "color", e.target.value)}
                      className="w-8 h-8 rounded border border-slate-600 bg-slate-800 cursor-pointer shrink-0"
                    />
                    <Input
                      value={rank.name}
                      onChange={e => updateRank(idx, "name", e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white flex-1 h-8"
                      placeholder="Rank name"
                    />
                    <Input
                      type="number"
                      value={rank.level}
                      onChange={e => updateRank(idx, "level", e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white w-20 h-8"
                      placeholder="Level"
                    />
                    <button type="button" onClick={() => removeRank(idx)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <Button variant="outline" size="sm" type="button" onClick={addRank} className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Rank
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name || !form.category} className="bg-blue-600 hover:bg-blue-700">
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}