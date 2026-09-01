import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import DataTable from "@/components/mdt/ui/DataTable";
import RecordDetail from "@/components/mdt/workspaces/police/RecordDetail";
import { Btn, StatusPill } from "@/components/mdt/ui/primitives";
import BoloForm from "@/components/cad/mdt/BoloForm";
import WarrantForm from "@/components/cad/mdt/WarrantForm";
import ReportFormView from "@/components/cad/mdt/ReportFormView";
import { getReportTypes } from "@/lib/reportTypes";
import { Plus, X, Loader2, ChevronDown } from "lucide-react";
import ConfirmDialog from "@/components/mdt/ui/ConfirmDialog";

const INPUT = "h-7 px-2 bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";
const TONE = { Draft: "warn", Active: "crit", Closed: "neutral", Filed: "ok", Reviewed: "info", Approved: "ok", Served: "neutral" };

/** Records workspace — file categories, dense record table, detail pane. */
export default function RecordsWorkspace({ department, session, newFileRequest = 0 }) {
  const { toast } = useToast();
  const [tab, setTab] = useState("myfiles");
  const [reports, setReports] = useState([]);
  const [warrants, setWarrants] = useState([]);
  const [bolos, setBolos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [closedCalls, setClosedCalls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [boloOpen, setBoloOpen] = useState(false);
  const [warrantOpen, setWarrantOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("Incident");
  const [editingReport, setEditingReport] = useState(null);
  const [newMenu, setNewMenu] = useState(false);

  const load = async () => {
    try {
      const [r, w, b, t, cc] = await Promise.all([
        base44.entities.CADReport.filter({ department_id: department.id }),
        base44.entities.Warrant.filter({ department_id: department.id }),
        base44.entities.BOLO.filter({ department_id: department.id }),
        base44.entities.ReportTemplate.list(),
        base44.entities.ActiveCall.filter({ department_id: department.id, status: "Closed" }),
      ]);
      setReports(r); setWarrants(w); setBolos(b); setTemplates(t); setClosedCalls(cc);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (newFileRequest > 0) { setEditingReport(null); setFormType("Incident"); setShowForm(true); }
  }, [newFileRequest]);

  const myReports = reports.filter((r) => r.filed_by_id === session.user_id);
  const myDrafts = myReports.filter((r) => r.status === "Draft");
  const isSupervisor = session.rank?.toLowerCase().match(/sergeant|lieutenant|captain|chief|supervisor|commander|sheriff/);
  const reportTypes = getReportTypes(department.category);

  const tabs = [
    { id: "myfiles", label: "My Files", count: myReports.length },
    { id: "drafts", label: "My Drafts", count: myDrafts.length },
    { id: "warrants", label: "Warrants", count: warrants.filter((w) => w.status === "Active").length },
    { id: "bolos", label: "BOLOs", count: bolos.filter((b) => b.status === "Active").length },
    { id: "closedcalls", label: "Closed Calls", count: closedCalls.length },
    ...(isSupervisor ? [{ id: "supervisor", label: "All Dept Files", count: reports.length }] : []),
  ];

  const list = tab === "myfiles" ? myReports : tab === "drafts" ? myDrafts : tab === "warrants" ? warrants
    : tab === "bolos" ? bolos : tab === "closedcalls" ? closedCalls : reports;

  const rows = search
    ? list.filter((i) => `${i.title || i.call_type || i.reason || i.person_name || ""} ${i.report_type || i.bolo_type || ""}`.toLowerCase().includes(search.toLowerCase()))
    : list;

  const openNewFile = (type) => { setFormType(type); setEditingReport(null); setShowForm(true); setSelected(null); setNewMenu(false); };
  const openEditFile = (report) => { setEditingReport(report); setFormType(report.report_type || "Incident"); setShowForm(true); };
  // window.confirm freezes inside the in-game tablet iframe — use a dialog.
  const [pendingDelete, setPendingDelete] = useState(null);
  const deleteReport = (id) => setPendingDelete(id);
  const confirmDelete = async () => {
    try {
      await base44.entities.CADReport.delete(pendingDelete);
      setSelected(null);
      setPendingDelete(null);
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (showForm) {
    return <ReportFormView department={department} session={session} initialType={formType} templates={templates} existingReport={editingReport} onClose={() => { setShowForm(false); setEditingReport(null); }} onSaved={() => { setShowForm(false); setEditingReport(null); load(); }} />;
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-mdt-dim animate-spin" /></div>;

  const columns = [
    { key: "title", label: "Title", width: 240, render: (r) => r.title || r.call_type || r.reason || r.person_name || "—" },
    { key: "report_type", label: "Type", width: 150, render: (r) => r.report_type || r.bolo_type || (r.call_type ? "Closed Call" : r.reason ? "Warrant" : "—") },
    { key: "run_number", label: "Run #", width: 110, mono: true },
    { key: "filed_by_name", label: "Filed By", width: 150, render: (r) => r.filed_by_name || r.issued_by_name || "—" },
    { key: "status", label: "Status", width: 96, render: (r) => (r.status ? <StatusPill tone={TONE[r.status] || "neutral"}>{r.status}</StatusPill> : "—") },
    { key: "created_date", label: "Date", width: 110, render: (r) => (r.created_date ? new Date(r.created_date).toLocaleDateString() : "—") },
  ];

  return (
    <>
      <div className="flex items-center gap-2 h-9 px-3 border-b border-mdt-line bg-mdt-bg flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSelected(null); }}
            className={`h-6 px-2.5 border text-[12.5px] ${tab === t.id ? "bg-mdt-accent/15 border-mdt-accent/60 text-mdt-accent" : "bg-mdt-surface border-mdt-line text-mdt-text hover:bg-mdt-surface-3"}`}
          >
            {t.label} <span className="text-mdt-dim">{t.count}</span>
          </button>
        ))}
        <div className="flex-1" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter records..." className={`${INPUT} w-48`} />
        {tab === "bolos" && <Btn variant="primary" icon={Plus} onClick={() => setBoloOpen(true)}>New BOLO</Btn>}
        {tab === "warrants" && <Btn variant="primary" icon={Plus} onClick={() => setWarrantOpen(true)}>New Warrant</Btn>}
        {["myfiles", "drafts", "supervisor"].includes(tab) && (
          <div className="relative">
            <Btn variant="primary" icon={Plus} onClick={() => setNewMenu(!newMenu)}>New File <ChevronDown className="w-3 h-3" /></Btn>
            {newMenu && (
              <div className="absolute right-0 top-8 z-50 w-56 border border-mdt-line-2 bg-mdt-surface shadow-lg max-h-72 overflow-auto mdt-scroll">
                {reportTypes.map((rt) => (
                  <button key={rt} onClick={() => openNewFile(rt)} className="w-full text-left px-3 py-1.5 text-[12.5px] text-mdt-text hover:bg-mdt-surface-3">{rt}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {selected && <Btn icon={X} onClick={() => setSelected(null)}>Close Record</Btn>}
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 overflow-auto mdt-scroll border-r border-mdt-line">
          <DataTable
            columns={columns}
            rows={rows}
            selectedKey={selected?.id}
            onRowClick={(r) => setSelected(r.id === selected?.id ? null : r)}
            sort={{ key: "created_date", dir: "desc" }}
            emptyMessage="No records found"
          />
        </div>
        {selected && (
          <div className="w-[46%] min-w-[380px] bg-mdt-bg">
            <RecordDetail
              record={selected}
              canEdit={selected.filed_by_id === session.user_id || !!isSupervisor}
              onEdit={openEditFile}
              onDelete={deleteReport}
            />
          </div>
        )}
      </div>

      <BoloForm open={boloOpen} onOpenChange={setBoloOpen} department={department} session={session} onSaved={load} />
      <WarrantForm open={warrantOpen} onOpenChange={setWarrantOpen} department={department} session={session} onSaved={load} />
      <ConfirmDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)} title="Delete Report" description="Permanently delete this report?" confirmLabel="Delete" onConfirm={confirmDelete} />
    </>
  );
}