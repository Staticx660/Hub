import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Building2 } from "lucide-react";
import { Btn } from "@/components/mdt/ui/primitives";
import StationCommandBar from "@/components/dispatch/station/StationCommandBar";
import StationStatusStrip from "@/components/dispatch/station/StationStatusStrip";
import StationHeader from "@/components/dispatch/station/StationHeader";
import CallQueuePane from "@/components/dispatch/station/CallQueuePane";
import IncidentPane from "@/components/dispatch/station/IncidentPane";
import UnitsPane from "@/components/dispatch/station/UnitsPane";
import ActivityPane from "@/components/dispatch/station/ActivityPane";
import NewCallModal from "@/components/dispatch/station/NewCallModal";
import LookupPane from "@/components/dispatch/station/LookupPane";

const emptyCallForm = { call_type: "", priority: "3 - Low", status: "Active", location: "", cross_streets: "", postal: "", block: "", call_origin: "", run_number: "", description: "", cad_notes: "", notes: "", caller_name: "", caller_phone: "", department_id: "" };

export default function CAD() {
  const [calls, setCalls] = useState([]);
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [callForm, setCallForm] = useState(emptyCallForm);
  const [selectedId, setSelectedId] = useState(null);
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [dockTab, setDockTab] = useState("activity");
  const { toast } = useToast();

  const load = async () => {
    try {
      const [c, u, d, g, s] = await Promise.all([
        base44.entities.ActiveCall.list("-created_date"),
        base44.entities.CADUnit.list(),
        base44.entities.CADDepartment.list(),
        base44.entities.CADUnitGroup.list(),
        base44.entities.CADSession.filter({ is_active: true }),
      ]);
      setCalls(c); setUnits(u); setDepartments(d); setGroups(g);
      const dispatchDeptIds = d.filter(x => x.category === "Dispatch").map(x => x.id);
      setDispatchers(s.filter(x => dispatchDeptIds.includes(x.department_id)));
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const activeCalls = calls.filter(c => c.status !== "Closed");
  const deptName = (id) => departments.find(d => d.id === id)?.name || "Unassigned";
  const unitName = (id) => units.find(u => u.id === id)?.name || "Unknown";

  const handleCreateCall = async () => {
    try {
      await base44.entities.ActiveCall.create({ ...callForm, status: callForm.status || "Active" });
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
      setSelectedId(null);
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

  if (loading) {
    return <div className="mdt fixed inset-0 bg-mdt-bg flex items-center justify-center"><div className="w-8 h-8 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }

  if (departments.length === 0) {
    return (
      <div className="mdt fixed inset-0 bg-mdt-bg flex flex-col items-center justify-center gap-3 text-center px-6">
        <Building2 className="w-10 h-10 text-mdt-dim" />
        <h2 className="text-[15px] font-semibold text-mdt-text">No CAD Departments</h2>
        <p className="text-[12.5px] text-mdt-muted">Create departments in the Admin Panel to start dispatching.</p>
        <Link to="/cad/admin"><Btn variant="primary">Go to Admin Panel</Btn></Link>
      </div>
    );
  }

  const selectedCall = activeCalls.find((c) => c.id === selectedId) || null;
  const availableUnits = units.filter((u) => u.status === "Available" || u.status === "Off Duty");

  return (
    <div className="mdt fixed inset-0 flex flex-col bg-mdt-bg text-mdt-text">
      <StationCommandBar
        onNewCall={openCreateCall}
        onRefresh={load}
        onCloseCall={() => selectedCall && closeCall(selectedCall.id)}
        canClose={!!selectedCall}
        logCollapsed={logCollapsed}
        onToggleLog={() => setLogCollapsed(v => !v)}
        onLookups={() => { setLogCollapsed(false); setDockTab("lookups"); }}
      />
      <StationHeader
        pending={activeCalls.filter(c => c.status === "Pending").length}
        active={activeCalls.filter(c => c.status === "Active").length}
        available={units.filter(u => u.status === "Available").length}
        onDuty={units.filter(u => u.status !== "Off Duty").length}
        unitsTotal={units.length}
      />

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-px bg-mdt-line p-px">
        <div className="col-span-5 min-h-0 flex [&>section]:flex-1 [&>section]:min-w-0">
          <CallQueuePane
            calls={activeCalls}
            selectedId={selectedId}
            onSelect={setSelectedId}
            deptName={deptName}
            onNewCall={openCreateCall}
          />
        </div>
        <div className="col-span-4 min-h-0 flex [&>section]:flex-1 [&>section]:min-w-0">
          <IncidentPane
            call={selectedCall}
            deptName={deptName}
            unitName={unitName}
            availableUnits={availableUnits}
            onAssign={assignUnit}
            onUnassign={unassignUnit}
            onCloseCall={closeCall}
          />
        </div>
        <div className="col-span-3 min-h-0 flex [&>section]:flex-1 [&>section]:min-w-0">
          <UnitsPane
            departments={departments}
            units={units}
            groups={groups}
            deptName={deptName}
            selectedCallId={selectedId}
            onDispatchGroup={dispatchGroup}
          />
        </div>
      </div>

      {!logCollapsed && (
        <div className="h-[300px] flex-shrink-0 border-t border-mdt-line flex flex-col min-h-0">
          <div className="flex items-center gap-1.5 h-8 px-2 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
            <Btn variant={dockTab === "activity" ? "primary" : "ghost"} onClick={() => setDockTab("activity")}>Activity Log</Btn>
            <Btn variant={dockTab === "lookups" ? "primary" : "ghost"} onClick={() => setDockTab("lookups")}>Lookups</Btn>
          </div>
          <div className="flex-1 min-h-0">
            {dockTab === "activity"
              ? <ActivityPane calls={activeCalls} deptName={deptName} />
              : <LookupPane />}
          </div>
        </div>
      )}

      <StationStatusStrip
        items={[
          `${activeCalls.length} calls in queue`,
          `${activeCalls.filter(c => c.priority?.startsWith("1")).length} priority 1`,
          `${units.filter(u => u.status === "Available").length}/${units.length} units available`,
          selectedCall ? `Incident ${selectedCall.run_number || selectedCall.id.slice(-6).toUpperCase()}` : "No incident selected",
        ]}
        dispatchers={dispatchers}
      />

      <NewCallModal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        form={callForm}
        setForm={setCallForm}
        departments={departments}
        onCreate={handleCreateCall}
      />
    </div>
  );
}