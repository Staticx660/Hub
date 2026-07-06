export const ALL_REPORT_TYPES = ["Incident", "Traffic Stop", "Field Contact", "Arrest", "Medical", "Fire", "Vehicle Accident", "Use of Force", "Evidence", "Other"];

export const REPORT_TYPES_BY_CATEGORY = {
  Police: ["Incident", "Traffic Stop", "Field Contact", "Arrest", "Vehicle Accident", "Use of Force", "Evidence", "Other"],
  Fire: ["Fire", "Vehicle Accident", "Other"],
  EMS: ["Medical", "Vehicle Accident", "Other"],
  Dispatch: ["Incident", "Traffic Stop", "Other"],
  Civilian: ["Other"],
  "Private Security": ["Incident", "Field Contact", "Other"],
  Other: ALL_REPORT_TYPES,
};

export const REPORT_TEMPLATE_CATEGORIES = ["Incident", "Arrest", "Traffic Stop", "Field Contact", "Use of Force", "Vehicle Accident", "Evidence", "Medical", "Fire", "Other"];

export function getReportTypes(category) {
  return REPORT_TYPES_BY_CATEGORY[category] || ALL_REPORT_TYPES;
}