import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { FileText, Plus, Edit, Trash2, Pin, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import ReactQuill from "react-quill";

const docCategories = ["SOP", "Policy", "Training", "Guide", "Form", "Other"];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);
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
    if (!confirm("Delete this document?")) return;
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
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === "all" || d.department_id === filterDept;
    return matchSearch && matchDept;
  }).sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-sm text-slate-400 mt-1">SOPs, policies, and training materials</p>
        </div>
        {isAdmin && <Button onClick={() => { setEditing(null); setForm({ title: "", department_id: "", category: "SOP", content: "", file_url: "" }); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New Document
        </Button>}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-slate-900 border-slate-700 text-white" />
        </div>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No documents found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <div key={doc.id} className="bg-slate-900/80 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {doc.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                <div className="min-w-0">
                  <button onClick={() => setViewDoc(doc)} className="text-sm font-medium text-white hover:text-blue-400 truncate block">{doc.title}</button>
                  <p className="text-xs text-slate-500">{doc.category} · {getDeptName(doc.department_id)}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${isAdmin ? "opacity-0 group-hover:opacity-100 transition-opacity" : "hidden"}`}>
                <button onClick={() => togglePin(doc)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Pin className="w-3.5 h-3.5" /></button>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><ExternalLink className="w-3.5 h-3.5" /></a>
                )}
                <button onClick={() => { setEditing(doc); setForm({ title: doc.title, department_id: doc.department_id, category: doc.category || "SOP", content: doc.content || "", file_url: doc.file_url || "" }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewDoc?.title}</DialogTitle>
            <p className="text-xs text-slate-500">{viewDoc?.category} · {getDeptName(viewDoc?.department_id)}</p>
          </DialogHeader>
          {viewDoc?.content && (
            <div className="prose prose-sm prose-invert max-w-none mt-4" dangerouslySetInnerHTML={{ __html: viewDoc.content }} />
          )}
          {viewDoc?.file_url && (
            <a href={viewDoc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-4">
              <ExternalLink className="w-4 h-4" /> View Attached File
            </a>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Document" : "New Document"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Title *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Department</Label>
                <Select value={form.department_id} onValueChange={v => setForm({...form, department_id: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {docCategories.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Content</Label>
              <div className="mt-1 [&_.ql-toolbar]:bg-slate-800 [&_.ql-toolbar]:border-slate-700 [&_.ql-container]:bg-slate-800 [&_.ql-container]:border-slate-700 [&_.ql-editor]:text-white [&_.ql-editor]:min-h-[150px]">
                <ReactQuill value={form.content} onChange={v => setForm({...form, content: v})} />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Attach File</Label>
              <Input type="file" accept=".pdf,.doc,.docx,.txt,.xlsx" onChange={handleFileUpload} className="bg-slate-800 border-slate-700 text-white mt-1" />
              {form.file_url && <p className="text-xs text-emerald-400 mt-1">File attached ✓</p>}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleSave} disabled={!form.title} className="bg-blue-600 hover:bg-blue-700">{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}