import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const priorityOptions = ["1 - High", "2 - Medium", "3 - Low"];
const emptyForm = { call_type: "", priority: "2 - Medium", location: "", description: "", caller_name: "", caller_phone: "", cad_notes: "" };

export default function SelfDispatchDialog({ open, onOpenChange, onCreate }) {
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = () => {
    onCreate(form);
    setForm(emptyForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader><DialogTitle className="text-white">Self-Dispatch — Create Call</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Call Type</Label>
              <Input value={form.call_type} onChange={(e) => setForm({ ...form, call_type: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Traffic Stop" />
            </div>
            <div>
              <Label className="text-slate-300">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{priorityOptions.map((p) => <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-slate-300">Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Vinewood Blvd & Alta St" /></div>
          <div><Label className="text-slate-300">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-slate-300">Caller Name</Label><Input value={form.caller_name} onChange={(e) => setForm({ ...form, caller_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">Caller Phone</Label><Input value={form.caller_phone} onChange={(e) => setForm({ ...form, caller_phone: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>
          <div><Label className="text-slate-300">CAD Notes</Label><Textarea value={form.cad_notes} onChange={(e) => setForm({ ...form, cad_notes: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={3} placeholder="Initial notes for this call..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.call_type || !form.location} className="bg-blue-600 hover:bg-blue-700">Create & Attach</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}