export const ALL_REPORT_TYPES = [
  "Incident", "Arrest", "General Citation", "Vehicle Citation",
  "Use of Force", "MVA Report", "Fire", "Medical",
  "Use of Medications", "Traffic Stop", "Field Contact",
  "Evidence", "Other"
];

export const REPORT_TYPES_BY_CATEGORY = {
  Police: ["Arrest", "General Citation", "Vehicle Citation", "Use of Force", "MVA Report", "Incident", "Traffic Stop", "Field Contact", "Evidence", "Other"],
  Fire: ["Fire", "Incident", "MVA Report", "Other"],
  EMS: ["Incident", "Use of Medications", "Medical", "Other"],
  Dispatch: ["Incident", "Other"],
  Civilian: ["Other"],
  "Private Security": ["Incident", "Field Contact", "Other"],
  Other: ALL_REPORT_TYPES,
};

export const REPORT_TEMPLATE_CATEGORIES = ["Incident", "Arrest", "Traffic Stop", "Field Contact", "Use of Force", "Vehicle Accident", "Evidence", "Medical", "Fire", "Other"];

export function getReportTypes(category) {
  return REPORT_TYPES_BY_CATEGORY[category] || ALL_REPORT_TYPES;
}

// Whether a department category should show charges on reports
export function hasCharges(category) {
  return category === "Police" || category === "Private Security";
}