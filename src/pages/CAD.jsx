import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Building2 } from "lucide-react";
import { ConsolePanel, ConsoleBtn, Tag } from "@/components/cad/console/ConsoleUI";
import ConsoleTable from "@/components/cad/console/ConsoleTable";
import NewCallDialog from "@/components/dispatch/NewCallDialog";
import CallDetailPane from "@/components/dispatch/CallDetailPane";
import UnitsRosterPanel from "@/components/dispatch/UnitsRosterPanel";
const emptyCallForm = { call_type: "", priority: "3 - Low", location: "", description: "", caller_name: "", caller_phone: "", department_id: "" };

export default function CAD() {
  const [calls, setCalls] = useState([]);
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [callForm, setCallForm] = useState(emptyCallForm);
  const [selectedId, setSelectedId] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [c, u, d, g] = await Promise.all([
        base44.entities.ActiveCall.list("-created_date"),
        base44.entities.CADUnit.list(),
        base44.entities.CADDepartment.list(),
        base44.entities.CADUnitGroup.list(),
      ]);
      setCalls(c); setUnits(u); setDepartments(d); setGroups(g);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const activeCalls = calls.filter(c => c.status !== "Closed");
  const deptName = (id) => departments.find(d => d.id === id)?.name || "Unassigned";
  const deptColor = (id) => departments.find(d => d.id === id)?.color || "#64748b";
  const unitName = (id) => units.find(u => u.id === id)?.name || "Unknown";
  const unitsByDept = (deptId) => units.filter(u => u.department_id === deptId);

  const handleCreateCall = async () => {
    try {
      await base44.entities.ActiveCall.create({ ...callForm, status: "Active" });
      const dept = departments.find(d => d.id === callForm.department_id);
      if (dept?.discord_webhook_url) {
        try {
          await base44.functions.invoke('sendDiscordNotification', {
            webhook_url: dept.discord_webhook_url,
            title: `🚨 New Call: ${callForm.call_type}`,
            description: callForm.description || `Location: ${callForm.location}`,
            color: callForm.priority === "1 - High" ? 15158332 : callForm.priority === "2 - Medium" ? 15844367 : 3447003,
            fields: [
              { name: "Priority", value: callForm.priority, inline: true },
              { name: "Location", value: callForm.location, inline: true },
              { name: "Department", value: dept.name, inline: true },
              ...(callForm.caller_name ? [{ name: "Caller", value: `${callForm.caller_name}${callForm.caller_phone ? ` · ${callForm.caller_phone}` : ""}`, inline: false }] : []),
            ]
          });
        } catch (e) { console.error("Discord notification failed:", e); }
      }
      toast({ title: "Call created" });
      setDialogOpen(false); setCallForm(emptyCallForm); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const assignUnit = async (callId, unitId) => {
    if (!unitId) return;
    try {
      const call = calls.find(c => c.id === callId);
      const newIds = [...(call.assigned_unit_ids || []), unitId];
      await base44.entities.ActiveCall.update(callId, { assigned_unit_ids: newIds });
      await base44.entities.CADUnit.update(unitId, { status: "On Call", assigned_call_id: callId });
      toast({ title: "Unit assigned" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const unassignUnit = async (callId, unitId) => {
    try {
      const call = calls.find(c => c.id === callId);
      const newIds = (call.assigned_unit_ids || []).filter(id => id !== unitId);
      await base44.entities.ActiveCall.update(callId, { assigned_unit_ids: newIds });
      await base44.entities.CADUnit.update(unitId, { status: "Available", assigned_call_id: "" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const closeCall = async (callId) => {
    try {
      const call = calls.find(c => c.id === callId);
      await base44.entities.ActiveCall.update(callId, { status: "Closed" });
      await Promise.all((call.assigned_unit_ids || []).map(uid =>
        base44.entities.CADUnit.update(uid, { status: "Available", assigned_call_id: "" })
      ));
      toast({ title: "Call closed" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const dispatchGroup = async (groupId, callId) => {
    if (!callId) return;
    try {
      const group = groups.find(g => g.id === groupId);
      const call = calls.find(c => c.id === callId);
      const newIds = [...new Set([...(call.assigned_unit_ids || []), ...(group.unit_ids || [])])];
      await base44.entities.ActiveCall.update(callId, { assigned_unit_ids: newIds });
      await Promise.all((group.unit_ids || []).map(uid =>
        base44.entities.CADUnit.update(uid, { status: "On Call", assigned_call_id: callId })
      ));
      toast({ title: "Group dispatched" });
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const openCreateCall = () => { setCallForm({ ...emptyCallForm, department_id: departments[0]?.id || "" }); setDialogOpen(true); };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-cad-border border-t-cad-accent rounded-full animate-spin" /></div>;

  if (departments.length === 0) {
    return (
      <div className="cad-font text-center py-16">
        <Building2 className="w-14 h-14 mx-auto mb-4 text-cad-dim" />
        <h2 className="text-lg font-semibold text-cad-text mb-1">No CAD Departments</h2>
        <p className="text-[13px] text-cad-muted mb-4">Create departments in the Admin Panel to start dispatching.</p>
        <div className="flex justify-center">
          <ConsoleBtn variant="primary" onClick={() => window.location.href = "/cad/admin"}>Go to Admin Panel</ConsoleBtn>
        </div>
      </div>
    );
  }

  const selectedCall = activeCalls.find((c) => c.id === selectedId) || null;
  const availableUnits = units.filter((u) => u.status === "Available" || u.status === "Off Duty");

  const columns = [
    { key: "priority", label: "Pri", width: 80, render: (c) => <Tag tone={c.priority === "1 - High" ? "crit" : c.priority === "2 - Medium" ? "warn" : "info"}>P{c.priority.split(" ")[0]}</Tag> },
    { key: "call_type", label: "Type" },
    { key: "location", label: "Location" },
    { key: "department_id", label: "Department", width: 160, render: (c) => deptName(c.department_id) },
    { key: "units", label: "Units", width: 70, align: "right", sortable: false, render: (c) => (c.assigned_unit_ids || []).length },
    { key: "status", label: "Status", width: 90 },
  ];

  return (
    <div className="cad-font">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-cad-text tracking-tight">Dispatch Console</h1>
          <p className="text-[13px] text-cad-muted">{activeCalls.length} active calls · {units.filter(u => u.status === "Available").length} units available</p>
        </div>
        <ConsoleBtn variant="primary" icon={Plus} onClick={openCreateCall}>New Call</ConsoleBtn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        <div className="lg:col-span-2 space-y-3">
          <ConsolePanel title="Call Queue" subtitle={`${activeCalls.length} active`} bodyClassName="max-h-[45vh]">
            <ConsoleTable
              columns={columns}
              rows={activeCalls}
              selectedKey={selectedId}
              onRowClick={(c) => setSelectedId(c.id)}
              rowTone={(c) => (c.priority === "1 - High" ? "#ef4444" : c.priority === "2 - Medium" ? "#f59e0b" : "#3b82f6")}
              emptyMessage="No active calls"
            />
          </ConsolePanel>
          <ConsolePanel title="Call Detail">
            <CallDetailPane
              call={selectedCall}
              deptName={deptName}
              unitName={unitName}
              availableUnits={availableUnits}
              onAssign={assignUnit}
              onUnassign={unassignUnit}
              onClose={(id) => { closeCall(id); setSelectedId(null); }}
            />
          </ConsolePanel>
        </div>

        <UnitsRosterPanel
          departments={departments}
          units={units}
          groups={groups}
          activeCalls={activeCalls}
          deptName={deptName}
          onDispatchGroup={dispatchGroup}
        />
      </div>

      <NewCallDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={callForm}
        setForm={setCallForm}
        departments={departments}
        onCreate={handleCreateCall}
      />
    </div>
  );
}