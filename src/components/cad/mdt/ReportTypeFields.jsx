import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getReportFieldConfig } from "@/lib/reportTypes";

const darkInput = "bg-[#0f1115] border-none text-white text-sm h-9 rounded-md focus-visible:ring-1 focus-visible:ring-slate-600 placeholder:text-slate-600";
const darkSelect = "bg-[#0f1115] border-none text-white text-sm h-9 rounded-md focus-visible:ring-1 focus-visible:ring-slate-600";

export default function ReportTypeFields({ reportType, fieldData, updateField }) {
  const config = getReportFieldConfig(reportType);
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
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">{field.label}</Label>
                <Textarea value={value} onChange={(e) => updateField(field.key, e.target.value)} className="bg-[#0f1115] border-none text-white text-sm min-h-[60px]" placeholder={field.label} />
              </div>
            );
          }
          if (field.type === "select") {
            return (
              <div key={field.key}>
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">{field.label}</Label>
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
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">{field.label}</Label>
                <Input type="datetime-local" value={value} onChange={(e) => updateField(field.key, e.target.value)} className={darkInput} />
              </div>
            );
          }
          return (
            <div key={field.key}>
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">{field.label}</Label>
              <Input value={value} onChange={(e) => updateField(field.key, e.target.value)} className={darkInput} placeholder={field.label} />
            </div>
          );
        })}
      </div>
    </div>
  );
}