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

// Type-specific field definitions for each report type.
// Each entry defines which standard sections to show + custom fields.
// Custom field types: text, textarea, select, checkbox, datetime
export const REPORT_FIELD_CONFIG = {
  "Arrest": {
    sections: ["flags", "civilian", "vehicle", "charges", "signatures"],
    customFields: [
      { key: "arrest_date_time", label: "Date & Time of Arrest", type: "datetime" },
      { key: "arrest_location", label: "Location of Arrest", type: "text" },
      { key: "miranda_read", label: "Miranda Rights Read", type: "select", options: ["Yes", "No", "N/A - Not Questioned"] },
      { key: "miranda_read_by", label: "Miranda Read By", type: "text" },
      { key: "miranda_time", label: "Miranda Read Time", type: "text" },
      { key: "subject_compliant", label: "Subject Compliant", type: "select", options: ["Yes", "No", "Initially Resistant"] },
      { key: "booking_number", label: "Booking Number", type: "text" },
      { key: "booking_facility", label: "Booking Facility", type: "text" },
      { key: "evidence_seized", label: "Evidence/Property Seized", type: "textarea" },
      { key: "witnesses", label: "Witnesses", type: "textarea" },
    ],
  },
  "General Citation": {
    sections: ["civilian", "charges", "signatures"],
    customFields: [
      { key: "violation_date_time", label: "Date & Time of Violation", type: "datetime" },
      { key: "violation_location", label: "Location of Violation", type: "text" },
      { key: "court_date", label: "Court Date", type: "datetime" },
      { key: "court_location", label: "Court Location", type: "text" },
      { key: "total_fine", label: "Total Fine Amount", type: "text" },
      { key: "violator_signature", label: "Violator Signature (Type Name)", type: "text" },
    ],
  },
  "Vehicle Citation": {
    sections: ["civilian", "vehicle", "charges", "signatures"],
    customFields: [
      { key: "violation_date_time", label: "Date & Time of Violation", type: "datetime" },
      { key: "violation_location", label: "Location of Violation", type: "text" },
      { key: "vin", label: "VIN Number", type: "text" },
      { key: "registered_owner", label: "Registered Owner", type: "text" },
      { key: "court_date", label: "Court Date", type: "datetime" },
      { key: "total_fine", label: "Total Fine Amount", type: "text" },
    ],
  },
  "Use of Force": {
    sections: ["flags", "civilian", "signatures"],
    customFields: [
      { key: "incident_date_time", label: "Date & Time of Incident", type: "datetime" },
      { key: "incident_location", label: "Location", type: "text" },
      { key: "force_type", label: "Force Type", type: "select", options: ["Verbal Commands", "Physical Control", "OC Spray", "Taser", "Baton", "Firearm", "K9", "Less-Lethal Munition", "Other"] },
      { key: "force_justification", label: "Force Justification", type: "textarea" },
      { key: "officers_involved", label: "Officers Involved (Names)", type: "textarea" },
      { key: "officer_count", label: "Number of Officers Involved", type: "text" },
      { key: "subject_injured", label: "Subject Injured", type: "select", options: ["No", "Yes - Minor", "Yes - Major", "Yes - Fatal"] },
      { key: "officer_injured", label: "Officer Injured", type: "select", options: ["No", "Yes - Minor", "Yes - Major"] },
      { key: "weapon_involved", label: "Weapon Involved", type: "select", options: ["No", "Firearm", "Edged Weapon", "Blunt Object", "Other"] },
      { key: "weapon_description", label: "Weapon Description", type: "text" },
      { key: "medical_aid", label: "Medical Aid Rendered", type: "select", options: ["None Needed", "By EMS", "At Hospital", "Refused"] },
    ],
  },
  "MVA Report": {
    sections: ["flags", "civilian", "vehicle", "signatures"],
    customFields: [
      { key: "accident_date_time", label: "Date & Time of Accident", type: "datetime" },
      { key: "accident_location", label: "Location", type: "text" },
      { key: "weather_conditions", label: "Weather Conditions", type: "select", options: ["Clear", "Rain", "Fog", "Snow", "Overcast", "Other"] },
      { key: "road_conditions", label: "Road Conditions", type: "select", options: ["Dry", "Wet", "Icy", "Snow", "Debris", "Other"] },
      { key: "lighting", label: "Lighting Conditions", type: "select", options: ["Daylight", "Dusk", "Dawn", "Night - Street Lit", "Night - Dark"] },
      { key: "vehicle_count", label: "Number of Vehicles", type: "text" },
      { key: "vehicle2_plate", label: "Vehicle 2 Plate", type: "text" },
      { key: "vehicle2_desc", label: "Vehicle 2 Description", type: "text" },
      { key: "driver2_name", label: "Driver 2 Name", type: "text" },
      { key: "passengers", label: "Passengers", type: "textarea" },
      { key: "injuries", label: "Injuries", type: "textarea" },
      { key: "damage_assessment", label: "Damage Assessment", type: "textarea" },
      { key: "tow_required", label: "Tow Required", type: "select", options: ["No", "Yes"] },
      { key: "tow_company", label: "Tow Company", type: "text" },
      { key: "diagram", label: "Diagram Description", type: "textarea" },
    ],
  },
  "Traffic Stop": {
    sections: ["flags", "civilian", "vehicle", "charges", "signatures"],
    customFields: [
      { key: "stop_date_time", label: "Date & Time of Stop", type: "datetime" },
      { key: "stop_location", label: "Location of Stop", type: "text" },
      { key: "stop_reason", label: "Reason for Stop", type: "textarea" },
      { key: "outcome", label: "Outcome", type: "select", options: ["Warning", "Citation", "Arrest", "Released", "Investigation"] },
      { key: "consent_search", label: "Consent to Search", type: "select", options: ["N/A", "Yes", "No"] },
      { key: "search_conducted", label: "Search Conducted", type: "select", options: ["No", "Yes - Consent", "Yes - Probable Cause", "Yes - Incident to Arrest"] },
      { key: "search_result", label: "Search Result", type: "textarea" },
      { key: "items_seized", label: "Items Seized", type: "textarea" },
    ],
  },
  "Field Contact": {
    sections: ["flags", "civilian", "signatures"],
    customFields: [
      { key: "contact_date_time", label: "Date & Time of Contact", type: "datetime" },
      { key: "contact_location", label: "Location", type: "text" },
      { key: "contact_reason", label: "Reason for Contact", type: "textarea" },
      { key: "outcome", label: "Outcome", type: "select", options: ["Information Only", "Warning", "Citation", "Arrest", "Released"] },
      { key: "observations", label: "Officer Observations", type: "textarea" },
    ],
  },
  "Evidence": {
    sections: ["civilian", "signatures"],
    customFields: [
      { key: "seized_date_time", label: "Date & Time Seized", type: "datetime" },
      { key: "seized_location", label: "Location Seized", type: "text" },
      { key: "case_number", label: "Case Number", type: "text" },
      { key: "item_description", label: "Item Description", type: "textarea" },
      { key: "serial_number", label: "Serial/Model Number", type: "text" },
      { key: "seized_from", label: "Seized From", type: "select", options: ["Person", "Vehicle", "Location", "Other"] },
      { key: "seized_from_desc", label: "Seized From Details", type: "text" },
      { key: "storage_location", label: "Storage Location", type: "text" },
    ],
  },
  "Incident": {
    sections: ["flags", "civilian", "vehicle", "signatures"],
    customFields: [
      { key: "incident_date_time", label: "Date & Time of Incident", type: "datetime" },
      { key: "incident_type_detail", label: "Incident Type Details", type: "text" },
      { key: "involved_parties", label: "Involved Parties", type: "textarea" },
      { key: "action_taken", label: "Action Taken", type: "textarea" },
    ],
  },
  "Fire": {
    sections: ["signatures"],
    customFields: [
      { key: "alarm_time", label: "Alarm Time", type: "datetime" },
      { key: "arrival_time", label: "Arrival Time", type: "datetime" },
      { key: "under_control_time", label: "Under Control Time", type: "datetime" },
      { key: "scene_clear_time", label: "Scene Clear Time", type: "datetime" },
      { key: "fire_type", label: "Incident Type", type: "select", options: ["Structure Fire", "Vehicle Fire", "Grass/Brush Fire", "MVA/Extrication", "Hazmat", "Technical Rescue", "False Alarm", "Other"] },
      { key: "alarm_level", label: "Alarm Level", type: "select", options: ["1st Alarm", "2nd Alarm", "3rd Alarm", "4th Alarm+"] },
      { key: "fire_cause", label: "Fire Cause", type: "select", options: ["Accidental", "Arson", "Electrical", "Undetermined", "Other"] },
      { key: "area_of_origin", label: "Area of Origin", type: "text" },
      { key: "fuel_involved", label: "Fuel/Material Involved", type: "text" },
      { key: "damage_estimate", label: "Damage Estimate", type: "text" },
      { key: "injuries", label: "Injuries", type: "textarea" },
      { key: "fatalities", label: "Fatalities", type: "text" },
      { key: "apparatus_responded", label: "Apparatus Responded", type: "textarea" },
      { key: "personnel_count", label: "Personnel Count", type: "text" },
    ],
  },
  "Medical": {
    sections: ["civilian", "signatures"],
    customFields: [
      { key: "incident_date_time", label: "Date & Time", type: "datetime" },
      { key: "chief_complaint", label: "Chief Complaint", type: "text" },
      { key: "treatment_summary", label: "Treatment Summary", type: "textarea" },
      { key: "transported", label: "Transported", type: "select", options: ["No", "Yes"] },
      { key: "destination", label: "Destination", type: "text" },
    ],
  },
  "Use of Medications": {
    sections: ["civilian", "signatures"],
    customFields: [
      { key: "administered_date_time", label: "Date & Time Administered", type: "datetime" },
      { key: "medication_name", label: "Medication", type: "text" },
      { key: "dose", label: "Dose", type: "text" },
      { key: "route", label: "Route", type: "select", options: ["PO (Oral)", "IV", "IM", "SC", "SL", "IN", "PR", "Topical"] },
      { key: "indication", label: "Indication", type: "text" },
      { key: "patient_response", label: "Patient Response", type: "textarea" },
    ],
  },
  "Other": {
    sections: ["flags", "civilian", "vehicle", "signatures"],
    customFields: [
      { key: "incident_date_time", label: "Date & Time", type: "datetime" },
      { key: "details", label: "Additional Details", type: "textarea" },
    ],
  },
};

export function getReportFieldConfig(reportType) {
  return REPORT_FIELD_CONFIG[reportType] || REPORT_FIELD_CONFIG["Other"];
}

export function shouldShowSection(reportType, section) {
  const config = getReportFieldConfig(reportType);
  return config.sections?.includes(section) ?? true;
}