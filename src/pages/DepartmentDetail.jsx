import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { 
  Users, Plus, Edit, Trash2, ArrowLeft, Clock, Award, 
  Shield, MoreHorizontal, UserCheck, UserX, Ban, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import RankOrderManager from "@/components/roster/RankOrderManager";
import { useUserPermissions } from "@/hooks/useUserPermissions";

const statusColors = {
  "Active": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "On LOA": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Suspended": "bg-red-500/10 text-red-400 border-red-500/20",
  "Inactive": "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "Terminated": "bg-red-500/10 text-red-400 border-red-500/20",
};

const slotColors = {
  "Filled": "bg-blue-500/10 text-blue-400",
  "Open": "bg-emerald-500/10 text-emerald-400",
  "Unavailable": "bg-red-500/10 text-red-400",
  "Reserved": "bg-purple-500/10 text-purple-400",
};

export default function DepartmentDetail() {
  const { id } = useParams();
  const [department, setDepartment] = useState(null);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", discord_id: "", discord_username: "", badge_number: "",
    rank: "", callsign: "", join_date: "", notes: "", phone_number: "",
    status: "Active", slot_status: "Filled", is_admin: false,
    additional_department_ids: [],
  });
  const { toast } = useToast();
  const { isPlatformAdmin, deptAdminIds, loading: permsLoading } = useUserPermissions();
  const canManage = isPlatformAdmin || (deptAdminIds || []).includes(id);

  // Department admins can't write RosterMember directly (RLS) — route through
  // the department-scoped backend function instead.
  const rosterAction = (payload) =>
    base44.functions.invoke("manageDepartmentRoster", { departmentId: id, ...payload });

  const loadData = async () => {
    try {
      const [dept, allMems, allDepts] = await Promise.all([
        base44.entities.Department.get(id),
        base44.entities.RosterMember.list(),
        base44.entities.Department.list(),
      ]);
      setDepartment(dept);
      setDepartments(allDepts);
      const deptMems = allMems.filter(m => m.department_id === id || (m.additional_department_ids || []).includes(id));
      setMembers(deptMems.sort((a, b) => (b.rank_level || 0) - (a.rank_level || 0)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleSave = async () => {
    try {
      const rankObj = department?.ranks?.find(r => r.name === form.rank);
      const data = {
        ...form,
        department_id: id,
        rank_level: rankObj?.level || 0,
        is_admin: form.is_admin === true || form.is_admin === "true",
      };
      await rosterAction({ action: "saveMember", memberId: editing?.id, data });
      toast({ title: editing ? "Member updated" : "Member added" });
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setForm({ name: "", discord_id: "", discord_username: "", badge_number: "", rank: "", callsign: "", join_date: "", notes: "", phone_number: "", status: "Active", slot_status: "Filled", is_admin: false, additional_department_ids: [] });
  };

  const toggleAdditionalDept = (deptId) => {
    const current = form.additional_department_ids || [];
    if (current.includes(deptId)) {
      setForm({...form, additional_department_ids: current.filter(d => d !== deptId)});
    } else {
      setForm({...form, additional_department_ids: [...current, deptId]});
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDelete = async (memberId) => {
    try {
      await rosterAction({ action: "deleteMember", memberId });
      toast({ title: "Member removed" });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const updateStatus = async (memberId, status) => {
    await rosterAction({ action: "saveMember", memberId, data: { status } });
    toast({ title: `Status changed to ${status}` });
    loadData();
  };

  const updateSlotStatus = async (memberId, slot_status) => {
    await rosterAction({ action: "saveMember", memberId, data: { slot_status } });
    toast({ title: `Slot marked as ${slot_status}` });
    loadData();
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({
      name: member.name || "", discord_id: member.discord_id || "", discord_username: member.discord_username || "",
      badge_number: member.badge_number || "", rank: member.rank || "", callsign: member.callsign || "",
      join_date: member.join_date || "", notes: member.notes || "", phone_number: member.phone_number || "",
      status: member.status || "Active", slot_status: member.slot_status || "Filled", is_admin: member.is_admin || false,
      additional_department_ids: member.additional_department_ids || [],
    });
    setShowForm(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  if (!department) {
    return <div className="text-center py-16 text-slate-400">Department not found</div>;
  }

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.badge_number?.toLowerCase().includes(search.toLowerCase()) ||
    m.callsign?.toLowerCase().includes(search.toLowerCase()) ||
    m.rank?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/departments" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{department.name}</h1>
          <p className="text-sm text-slate-400">{department.category} · {members.length}{department.max_slots ? `/${department.max_slots} slots` : " members"}</p>
        </div>
        {canManage && (
          <Button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Member
          </Button>
        )}
      </div>

      <Input
        placeholder="Search by name, badge, callsign, or rank..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="bg-slate-900 border-slate-700 text-white max-w-md"
      />

      {filtered.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 text-center">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No members found</p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Badge</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Slot</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Discord</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((member) => {
                  const rankData = department.ranks?.find(r => r.name === member.rank);
                  return (
                    <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                            {member.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white flex items-center gap-1.5">
                              {member.name}
                              {member.is_admin && <Shield className="w-3 h-3 text-amber-400" />}
                            </p>
                            {member.callsign && <p className="text-xs text-slate-500">{member.callsign}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-300 flex items-center gap-1.5">
                          {rankData?.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rankData.color }} />}
                          {member.rank || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{member.badge_number || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[member.status] || statusColors["Inactive"]}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-1 rounded-full ${slotColors[member.slot_status] || slotColors["Filled"]}`}>
                          {member.slot_status || "Filled"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{member.discord_username || "—"}</td>
                      <td className="px-5 py-3.5 text-right">
                        {!canManage ? <span className="text-xs text-slate-600">—</span> : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                            <DropdownMenuItem onClick={() => openEdit(member)} className="text-slate-300">
                              <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                            </DropdownMenuItem>
                            {member.status !== "Active" && (
                              <DropdownMenuItem onClick={() => updateStatus(member.id, "Active")} className="text-emerald-400">
                                <UserCheck className="w-3.5 h-3.5 mr-2" /> Set Active
                              </DropdownMenuItem>
                            )}
                            {member.status === "Active" && (
                              <DropdownMenuItem onClick={() => updateStatus(member.id, "Inactive")} className="text-slate-400">
                                <UserX className="w-3.5 h-3.5 mr-2" /> Mark Inactive
                              </DropdownMenuItem>
                            )}
                            {member.status === "Active" && (
                              <DropdownMenuItem onClick={() => updateStatus(member.id, "On LOA")} className="text-amber-400">
                                <Clock className="w-3.5 h-3.5 mr-2" /> Set LOA
                              </DropdownMenuItem>
                            )}
                            {member.status === "Active" && (
                              <DropdownMenuItem onClick={() => updateStatus(member.id, "Suspended")} className="text-red-400">
                                <Ban className="w-3.5 h-3.5 mr-2" /> Suspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => updateSlotStatus(member.id, "Open")} className="text-emerald-400">
                              <Eye className="w-3.5 h-3.5 mr-2" /> Mark Slot Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateSlotStatus(member.id, "Unavailable")} className="text-red-400">
                              <UserX className="w-3.5 h-3.5 mr-2" /> Mark Unavailable
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget(member)} className="text-red-400">
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove from Roster
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {canManage && (
        <RankOrderManager
          department={department}
          onSaved={loadData}
          saveRanks={(ranks) => rosterAction({ action: "saveRanks", ranks })}
        />
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            Remove <span className="text-white font-medium">{deleteTarget?.name}</span> from this roster? This can't be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="text-slate-400">Cancel</Button>
            <Button
              onClick={() => { const t = deleteTarget; setDeleteTarget(null); handleDelete(t.id); }}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Member" : "Add Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Name *</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-slate-300">Badge Number</Label>
                <Input value={form.badge_number} onChange={e => setForm({...form, badge_number: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Rank</Label>
                <Select value={form.rank} onValueChange={v => setForm({...form, rank: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Select rank" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {(department.ranks || []).sort((a,b) => b.level - a.level).map(r => (
                      <SelectItem key={r.name} value={r.name} className="text-white">{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Callsign</Label>
                <Input value={form.callsign} onChange={e => setForm({...form, callsign: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="e.g. 1-Adam-12" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {["Active", "On LOA", "Suspended", "Inactive", "Terminated"].map(s => (
                      <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Slot Status</Label>
                <Select value={form.slot_status} onValueChange={v => setForm({...form, slot_status: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {["Filled", "Open", "Unavailable", "Reserved"].map(s => (
                      <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Discord Username</Label>
                <Input value={form.discord_username} onChange={e => setForm({...form, discord_username: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-slate-300">Discord ID</Label>
                <Input value={form.discord_id} onChange={e => setForm({...form, discord_id: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Join Date</Label>
                <Input type="date" value={form.join_date} onChange={e => setForm({...form, join_date: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-slate-300">Phone Number</Label>
                <Input value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_admin" checked={form.is_admin} onChange={e => setForm({...form, is_admin: e.target.checked})} className="rounded border-slate-600" />
              <Label htmlFor="is_admin" className="text-slate-300">Department Admin</Label>
            </div>
            <div>
              <Label className="text-slate-300">Additional Departments</Label>
              <p className="text-xs text-slate-500 mt-0.5 mb-2">Also show this member in other departments</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {departments.filter(d => d.id !== id).map(d => (
                  <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.additional_department_ids || []).includes(d.id)}
                      onChange={() => toggleAdditionalDept(d.id)}
                      className="rounded border-slate-600"
                    />
                    <span className="text-sm text-slate-300">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Notes</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="Additional notes..." />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name} className="bg-blue-600 hover:bg-blue-700">
                {editing ? "Update" : "Add Member"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}