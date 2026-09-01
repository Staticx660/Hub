import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { FileText, Plus, Edit, Trash2, Pin, ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Panel, Btn, EmptyState } from "@/components/mdt/ui/primitives";
import ConfirmDialog from "@/components/mdt/ui/ConfirmDialog";
import ReactQuill from "react-quill";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const docCategories = ["SOP", "Policy", "Training", "Guide", "Form", "Other"];

const inputCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selContentCls = "bg-mdt-surface-2 border-mdt-line-2 text-mdt-text rounded-sm";
const labelCls = "text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-dim";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [form, setForm] = useState({ title: "", department_id: "", category: "SOP", content: "", file_url: "" });
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const loadData = async () => {
    try {
      const [d, depts] = await Promise.all([
        base44.entities.Document.list("-created_date"),
        base44.entities.Department.list(),
      ]);
      setDocuments(d);
      setDepartments(depts);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await base44.entities.Document.update(editing.id, form);
        toast({ title: "Document updated" });
      } else {
        await base44.entities.Document.create(form);
        toast({ title: "Document created" });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ title: "", department_id: "", category: "SOP", content: "", file_url: "" });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.Document.delete(id);
    toast({ title: "Deleted" });
    loadData();
  };

  const togglePin = async (doc) => {
    await base44.entities.Document.update(doc.id, { is_pinned: !doc.is_pinned });
    loadData();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, file_url });
    toast({ title: "File uploaded" });
  };

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || "—";

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === "all" || d.department_id === filterDept;
    return matchSearch && matchDept;
  }).sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-mdt-text tracking-tight">Documents</h1>
          <p className="text-[11.5px] text-mdt-dim">SOPs, policies, and training materials</p>
        </div>
        {isAdmin && <Btn variant="primary" icon={Plus} onClick={() => { setEditing(null); setForm({ title: "", department_id: "", category: "SOP", content: "", file_url: "" }); setShowForm(true); }}>New Document</Btn>}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mdt-dim" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className={`pl-8 ${inputCls} mt-0`} />
        </div>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className={`w-48 ${selCls} mt-0`}><SelectValue /></SelectTrigger>
          <SelectContent className={selContentCls}>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Panel title={`Documents · ${filtered.length}`} scroll={false}>
        {filtered.length === 0 ? (
          <div className="py-6"><EmptyState icon={FileText} title="No documents found" /></div>
        ) : (
          <div className="divide-y divide-mdt-line/60">
            {filtered.map((doc) => (
              <div key={doc.id} className="px-3 h-10 flex items-center justify-between group hover:bg-mdt-surface-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {doc.is_pinned && <Pin className="w-3 h-3 text-amber-300 flex-shrink-0" />}
                  <div className="min-w-0 flex items-baseline gap-2">
                    <button onClick={() => setViewDoc(doc)} className="text-[12px] font-medium text-mdt-text hover:text-mdt-accent truncate">{doc.title}</button>
                    <p className="text-[10.5px] text-mdt-dim whitespace-nowrap">{doc.category} · {getDeptName(doc.department_id)}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-0.5 ${isAdmin ? "opacity-0 group-hover:opacity-100 transition-opacity" : "hidden"}`}>
                  <button onClick={() => togglePin(doc)} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-mdt-surface-3 hover:text-mdt-text"><Pin className="w-3.5 h-3.5" /></button>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-mdt-surface-3 hover:text-mdt-text"><ExternalLink className="w-3.5 h-3.5" /></a>
                  )}
                  <button onClick={() => { setEditing(doc); setForm({ title: doc.title, department_id: doc.department_id, category: doc.category || "SOP", content: doc.content || "", file_url: doc.file_url || "" }); setShowForm(true); }} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-mdt-surface-3 hover:text-mdt-text"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteTarget(doc)} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-red-500/10 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* View Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text max-w-2xl max-h-[80vh] overflow-y-auto mdt-scroll rounded-none sm:rounded-none">
          <DialogHeader>
            <DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.06em]">{viewDoc?.title}</DialogTitle>
            <p className="text-[10.5px] text-mdt-dim">{viewDoc?.category} · {getDeptName(viewDoc?.department_id)}</p>
          </DialogHeader>
          {viewDoc?.content && (
            <div className="prose prose-sm prose-invert max-w-none mt-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewDoc.content) }} />
          )}
          {viewDoc?.file_url && (
            <a href={viewDoc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-mdt-accent hover:brightness-110 text-[12px] mt-2">
              <ExternalLink className="w-3.5 h-3.5" /> View Attached File
            </a>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text max-w-2xl max-h-[90vh] overflow-y-auto mdt-scroll rounded-none sm:rounded-none">
          <DialogHeader><DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.06em]">{editing ? "Edit Document" : "New Document"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className={labelCls}>Title *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={labelCls}>Department</Label>
                <Select value={form.department_id} onValueChange={v => setForm({...form, department_id: v})}>
                  <SelectTrigger className={selCls}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className={selContentCls}>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelCls}>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger className={selCls}><SelectValue /></SelectTrigger>
                  <SelectContent className={selContentCls}>
                    {docCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className={labelCls}>Content</Label>
              <div className="mt-1 [&_.ql-toolbar]:bg-mdt-surface-2 [&_.ql-toolbar]:border-mdt-line-2 [&_.ql-container]:bg-mdt-surface-2 [&_.ql-container]:border-mdt-line-2 [&_.ql-editor]:text-mdt-text [&_.ql-editor]:min-h-[150px]">
                <ReactQuill value={form.content} onChange={v => setForm({...form, content: v})} />
              </div>
            </div>
            <div>
              <Label className={labelCls}>Attach File</Label>
              <Input type="file" accept=".pdf,.doc,.docx,.txt,.xlsx" onChange={handleFileUpload} className={inputCls} />
              {form.file_url && <p className="text-[10.5px] text-emerald-300 mt-1">File attached ✓</p>}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSave} disabled={!form.title}>{editing ? "Update" : "Create"}</Btn>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Document"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => handleDelete(deleteTarget.id)}
      />
    </div>
  );
}