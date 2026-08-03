import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { getReportFieldConfig } from "@/lib/reportTypes";
import { isAutoNumberField, generateRecordNumber } from "@/lib/recordNumbers";
import AddressSearch from "@/components/cad/mdt/AddressSearch";

const darkInput = "bg-[#0f1115] border-none text-white text-sm h-9 rounded-md focus-visible:ring-1 focus-visible:ring-slate-600 placeholder:text-slate-600";
const darkSelect = "bg-[#0f1115] border-none text-white text-sm h-9 rounded-md focus-visible:ring-1 focus-visible:ring-slate-600";
const labelCls = "text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block";

const isLocationField = (field) => field.type === "text" && /location/i.test(field.key);

export default function ReportTypeFields({ reportType, fieldData, updateField }) {
  const config = getReportFieldConfig(reportType);

  // Identifiers (booking #, case #, …) are generated for the officer, never typed.
  useEffect(() => {
    const autoField = (config?.customFields || []).find((f) => isAutoNumberField(f.key) && !fieldData[f.key]);
    if (autoField) updateField(autoField.key, generateRecordNumber(autoField.key));
  }, [reportType, fieldData, config]);

  if (!config?.customFields?.length) return null;

  return (
    <div className="bg-[#262a30] rounded-lg p-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">{reportType} Details</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {config.customFields.map((field) => {
          const value = fieldData[field.key] || "";
          if (field.type === "textarea") {
            return (
              <div key={field.key} className="col-span-2 md:col-span-4">
                <Label className={labelCls}>{field.label}</Label>
                <Textarea value={value} onChange={(e) => updateField(field.key, e.target.value)} className="bg-[#0f1115] border-none text-white text-sm min-h-[60px]" placeholder={field.label} />
              </div>
            );
          }
          if (field.type === "select") {
            return (
              <div key={field.key}>
                <Label className={labelCls}>{field.label}</Label>
                <Select value={value} onValueChange={(v) => updateField(field.key, v)}>
                  <SelectTrigger className={darkSelect}><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {field.options.map((opt) => <SelectItem key={opt} value={opt} className="text-white">{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (field.type === "checkbox") {
            return (
              <div key={field.key} className="flex items-center gap-2 mt-5">
                <input type="checkbox" checked={value === true || value === "Yes"} onChange={(e) => updateField(field.key, e.target.checked ? "Yes" : "No")} className="w-4 h-4 rounded accent-cyan-500" />
                <Label className="text-xs text-slate-300">{field.label}</Label>
              </div>
            );
          }
          if (field.type === "datetime") {
            return (
              <div key={field.key}>
                <Label className={labelCls}>{field.label}</Label>
                <Input type="datetime-local" value={value} onChange={(e) => updateField(field.key, e.target.value)} className={darkInput} />
              </div>
            );
          }
          if (isAutoNumberField(field.key)) {
            return (
              <div key={field.key}>
                <Label className={labelCls}>{field.label} (Auto)</Label>
                <div className="flex gap-1">
                  <Input value={value} readOnly className={`${darkInput} font-mono text-cyan-400 flex-1`} />
                  <button type="button" onClick={() => updateField(field.key, generateRecordNumber(field.key))} title="Regenerate" className="h-9 w-9 flex items-center justify-center rounded-md bg-[#0f1115] text-slate-400 hover:text-cyan-400">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          }
          if (isLocationField(field)) {
            return (
              <div key={field.key}>
                <Label className={labelCls}>{field.label}</Label>
                <AddressSearch value={value} onChange={(v) => updateField(field.key, v)} placeholder="Type or pick location..." className={`w-full ${darkInput} pl-8 pr-8`} />
              </div>
            );
          }
          return (
            <div key={field.key}>
              <Label className={labelCls}>{field.label}</Label>
              <Input value={value} onChange={(e) => updateField(field.key, e.target.value)} className={darkInput} placeholder={field.label} />
            </div>
          );
        })}
      </div>
    </div>
  );
}