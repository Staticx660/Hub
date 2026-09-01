import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Trash2, Search, MoreHorizontal, UserCheck, UserX, Ban, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const statusColors = {
  "Active": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "On LOA": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Suspended": "bg-red-500/10 text-red-400 border-red-500/20",
  "Inactive": "bg-slate-500/10 text-mdt-muted border-slate-500/20",
  "Terminated": "bg-red-500/10 text-red-400 border-red-500/20",
};

const slotColors = {
  "Filled": "bg-blue-500/10 text-blue-400",
  "Open": "bg-emerald-500/10 text-emerald-400",
  "Unavailable": "bg-red-500/10 text-red-400",
  "Reserved": "bg-purple-500/10 text-purple-400",
};

export default function Roster() {
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "", discord_id: "", discord_username: "", badge_number: "",
    department_id: "", rank: "", callsign: "", join_date: "",
    notes: "", phone_number: "", status: "Active", slot_status: "Filled",
    is_admin: false,
    additional_department_ids: [],
    supervisor_id: "",
  });
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [m, d] = await Promise.all([
        base44.entities.RosterMember.list(),
        base44.entities.Department.list(),
      ]);
      setMembers(m);
      setDepartments(d);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({
      name: "", discord_id: "", discord_username: "", badge_number: "",
      department_id: "", rank: "", callsign: "", join_date: "",
      notes: "", phone_number: "", status: "Active", slot_status: "Filled",
      is_admin: false,
      additional_department_ids: [],
      supervisor_id: "",
    });
  };

  const toggleAdditionalDept = (deptId) => {
    const current = form.additional_department_ids || [];
    if (current.includes(deptId)) {
      setForm({...form, additional_department_ids: current.filter(d => d !== deptId)});
    } else {
      setForm({...form, additional_department_ids: [...current, deptId]});
    }
  };

  const handleSave = async () => {
    try {
      const dept = departments.find(d => d.id === form.department_id);
      const rankObj = dept?.ranks?.find(r => r.name === form.rank);
      const data = {
        ...form,
        rank_level: rankObj?.level || 0,
        is_admin: form.is_admin === true || form.is_admin === "true",
      };
      if (editing) {
        await base44.entities.RosterMember.update(editing.id, data);
        toast({ title: "Member updated" });
      } else {
        await base44.entities.RosterMember.create(data);
        toast({ title: "Member added" });
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this member from the roster?")) return;
    await base44.entities.RosterMember.delete(id);
    toast({ title: "Member removed" });
    loadData();
  };

  const updateStatus = async (id, status) => {
    await base44.entities.RosterMember.update(id, { status });
    toast({ title: `Status changed to ${status}` });
    loadData();
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({
      name: member.name || "",
      discord_id: member.discord_id || "",
      discord_username: member.discord_username || "",
      badge_number: member.badge_number || "",
      department_id: member.department_id || "",
      rank: member.rank || "",
      callsign: member.callsign || "",
      join_date: member.join_date || "",
      notes: member.notes || "",
      phone_number: member.phone_number || "",
      status: member.status || "Active",
      slot_status: member.slot_status || "Filled",
      is_admin: member.is_admin || false,
      additional_department_ids: member.additional_department_ids || [],
      supervisor_id: member.supervisor_id || "",
    });
    setShowForm(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-mdt-line-2 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || "Unknown";
  const selectedDept = departments.find(d => d.id === form.department_id);

  const filtered = members.filter(m => {
    const matchSearch = !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.badge_number?.toLowerCase().includes(search.toLowerCase()) ||
      m.callsign?.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === "all" || m.department_id === filterDept || (m.additional_department_ids || []).includes(filterDept);
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  }).sort((a, b) => (b.rank_level || 0) - (a.rank_level || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mdt-text">Full Roster</h1>
          <p className="text-sm text-mdt-muted mt-1">View and manage all members across departments</p>
        </div>
        <Button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }} className="bg-mdt-accent hover:brightness-110 text-mdt-text rounded-none">
          <Plus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mdt-dim" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-mdt-bg border-mdt-line-2 text-mdt-text"
          />
        </div>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48 bg-mdt-bg border-mdt-line-2 text-mdt-text">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent className="bg-mdt-surface-2 border-mdt-line-2">
            <SelectItem value="all" className="text-mdt-text">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-mdt-text">{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-mdt-bg border-mdt-line-2 text-mdt-text">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-mdt-surface-2 border-mdt-line-2">
            <SelectItem value="all" className="text-mdt-text">All Status</SelectItem>
            {["Active", "On LOA", "Suspended", "Inactive", "Terminated"].map(s => (
              <SelectItem key={s} value={s} className="text-mdt-text">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-mdt-dim">{filtered.length} member{filtered.length !== 1 ? "s" : ""}</p>

      <div className="bg-mdt-surface border border-mdt-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-mdt-line">
                <th className="text-left px-5 py-3 text-xs font-medium text-mdt-dim uppercase">Member</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-mdt-dim uppercase">Department</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-mdt-dim uppercase">Rank</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-mdt-dim uppercase">Badge</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-mdt-dim uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-mdt-dim uppercase">Slot</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-mdt-dim uppercase">Discord</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-mdt-dim uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mdt-line">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-mdt-dim">No members found</td></tr>
              )}
              {filtered.map((m) => {
                const dept = departments.find(d => d.id === m.department_id);
                const rankData = dept?.ranks?.find(r => r.name === m.rank);
                return (
                  <tr key={m.id} className="hover:bg-mdt-surface-2 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-mdt-surface-3 flex items-center justify-center text-xs font-bold text-mdt-text">
                          {m.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-mdt-text flex items-center gap-1.5">
                            {m.name}
                            {m.is_admin && <span className="text-amber-400 text-xs">★</span>}
                          </p>
                          {m.callsign && <p className="text-xs text-mdt-dim">{m.callsign}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Link to={`/departments/${m.department_id}`} className="text-sm text-mdt-accent hover:brightness-125">
                          {getDeptName(m.department_id)}
                        </Link>
                        {(m.additional_department_ids || []).map(depId => (
                          <Link key={depId} to={`/departments/${depId}`} className="text-sm text-teal-400 hover:text-teal-300">
                            {getDeptName(depId)}
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-mdt-text flex items-center gap-1.5">
                        {rankData?.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rankData.color }} />}
                        {m.rank || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-mdt-muted">{m.badge_number || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[m.status] || statusColors["Inactive"]}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${slotColors[m.slot_status] || slotColors["Filled"]}`}>
                        {m.slot_status || "Filled"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-mdt-muted">{m.discord_username || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-mdt-surface-3 text-mdt-muted">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-mdt-surface-2 border-mdt-line-2" align="end">
                          <DropdownMenuItem onClick={() => openEdit(m)} className="text-mdt-text">
                            <Edit className="w-3.5 h-3.5 mr-2" /> Edit Member
                          </DropdownMenuItem>
                          {m.status !== "Active" && (
                            <DropdownMenuItem onClick={() => updateStatus(m.id, "Active")} className="text-emerald-400">
                              <UserCheck className="w-3.5 h-3.5 mr-2" /> Set Active
                            </DropdownMenuItem>
                          )}
                          {m.status === "Active" && (
                            <DropdownMenuItem onClick={() => updateStatus(m.id, "Inactive")} className="text-mdt-muted">
                              <UserX className="w-3.5 h-3.5 mr-2" /> Mark Inactive
                            </DropdownMenuItem>
                          )}
                          {m.status === "Active" && (
                            <DropdownMenuItem onClick={() => updateStatus(m.id, "On LOA")} className="text-amber-400">
                              <Clock className="w-3.5 h-3.5 mr-2" /> Set LOA
                            </DropdownMenuItem>
                          )}
                          {m.status === "Active" && (
                            <DropdownMenuItem onClick={() => updateStatus(m.id, "Suspended")} className="text-red-400">
                              <Ban className="w-3.5 h-3.5 mr-2" /> Suspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(m.id)} className="text-red-400">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove from Roster
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-mdt-bg border-mdt-line-2 text-mdt-text max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Member" : "Add Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-mdt-text">Name *</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1" />
              </div>
              <div>
                <Label className="text-mdt-text">Badge Number</Label>
                <Input value={form.badge_number} onChange={e => setForm({...form, badge_number: e.target.value})} className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-mdt-text">Department *</Label>
              <Select value={form.department_id} onValueChange={v => setForm({...form, department_id: v, rank: ""})}>
                <SelectTrigger className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent className="bg-mdt-surface-2 border-mdt-line-2">
                  {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-mdt-text">{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-mdt-text">Rank</Label>
                <Select value={form.rank} onValueChange={v => setForm({...form, rank: v})}>
                  <SelectTrigger className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1"><SelectValue placeholder="Select rank" /></SelectTrigger>
                  <SelectContent className="bg-mdt-surface-2 border-mdt-line-2">
                    {(selectedDept?.ranks || []).sort((a,b) => b.level - a.level).map(r => (
                      <SelectItem key={r.name} value={r.name} className="text-mdt-text">{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-mdt-text">Callsign</Label>
                <Input value={form.callsign} onChange={e => setForm({...form, callsign: e.target.value})} className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1" placeholder="e.g. 1-Adam-12" />
              </div>
              <div>
                <Label className="text-mdt-text">Supervisor</Label>
                <Select value={form.supervisor_id} onValueChange={v => setForm({...form, supervisor_id: v})}>
                  <SelectTrigger className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent className="bg-mdt-surface-2 border-mdt-line-2">
                    <SelectItem value={null} className="text-mdt-text">None</SelectItem>
                    {members.filter(m => m.id !== editing?.id).map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-mdt-text">{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-mdt-text">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-mdt-surface-2 border-mdt-line-2">
                    {["Active", "On LOA", "Suspended", "Inactive", "Terminated"].map(s => (
                      <SelectItem key={s} value={s} className="text-mdt-text">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-mdt-text">Slot Status</Label>
                <Select value={form.slot_status} onValueChange={v => setForm({...form, slot_status: v})}>
                  <SelectTrigger className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-mdt-surface-2 border-mdt-line-2">
                    {["Filled", "Open", "Unavailable", "Reserved"].map(s => (
                      <SelectItem key={s} value={s} className="text-mdt-text">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-mdt-text">Discord Username</Label>
                <Input value={form.discord_username} onChange={e => setForm({...form, discord_username: e.target.value})} className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1" />
              </div>
              <div>
                <Label className="text-mdt-text">Discord ID</Label>
                <Input value={form.discord_id} onChange={e => setForm({...form, discord_id: e.target.value})} className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-mdt-text">Join Date</Label>
                <Input type="date" value={form.join_date} onChange={e => setForm({...form, join_date: e.target.value})} className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1" />
              </div>
              <div>
                <Label className="text-mdt-text">Phone Number</Label>
                <Input value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-mdt-text">Additional Departments</Label>
              <p className="text-xs text-mdt-dim mt-0.5 mb-2">Also show this member in other departments</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {departments.filter(d => d.id !== form.department_id).map(d => (
                  <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.additional_department_ids || []).includes(d.id)}
                      onChange={() => toggleAdditionalDept(d.id)}
                      className="rounded border-mdt-line-2"
                    />
                    <span className="text-sm text-mdt-text">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_admin_roster" checked={form.is_admin} onChange={e => setForm({...form, is_admin: e.target.checked})} className="rounded border-mdt-line-2" />
              <Label htmlFor="is_admin_roster" className="text-mdt-text">Department Admin</Label>
            </div>
            <div>
              <Label className="text-mdt-text">Notes</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text mt-1" placeholder="Additional notes..." />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-mdt-muted">Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name || !form.department_id} className="bg-mdt-accent hover:brightness-110 text-mdt-text rounded-none">
                {editing ? "Update" : "Add Member"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}