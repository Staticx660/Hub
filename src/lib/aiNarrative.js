import { base44 } from "@/api/base44Client";

/**
 * Generates a PCR narrative from the form data using AI.
 * Compiles: DOB, chief complaint, assessment findings, vitals,
 * treatments, medications, transport info, and non-transport reasons.
 */
export async function generatePCRNarrative(form) {
  const sections = [];

  // Patient demographics
  sections.push(`Patient: ${form.patient_name || "Unknown"}, DOB: ${form.patient_dob || "Unknown"}, Age: ${form.patient_age || "Unknown"}, Gender: ${form.patient_gender || "Unknown"}, Race: ${form.patient_race || "Unknown"}.`);

  // Incident info
  if (form.incident_type || form.incident_location) {
    sections.push(`Incident: ${form.incident_type || "Medical"} at ${form.incident_location || "unknown location"}.`);
  }

  // Chief complaint / symptoms
  if (form.symptoms) sections.push(`Chief Complaint: ${form.symptoms}.`);
  if (form.events_leading) sections.push(`Events Leading: ${form.events_leading}.`);
  if (form.general_impression) sections.push(`General Impression: ${form.general_impression}.`);

  // OPQRST
  const pain = [form.pain_onset, form.pain_provocation, form.pain_quality, form.pain_radiation, form.pain_severity, form.pain_time].filter(Boolean);
  if (pain.length) sections.push(`Pain Assessment (OPQRST): Onset: ${form.pain_onset || "N/A"}, Provocation: ${form.pain_provocation || "N/A"}, Quality: ${form.pain_quality || "N/A"}, Radiation: ${form.pain_radiation || "N/A"}, Severity: ${form.pain_severity || "N/A"}/10, Time: ${form.pain_time || "N/A"}.`);

  if (form.last_oral_intake) sections.push(`Last Oral Intake: ${form.last_oral_intake}.`);

  // Medical history
  const history = [
    form.allergies?.length ? `Allergies: ${form.allergies.join(", ")}` : null,
    form.food_allergies?.length ? `Food Allergies: ${form.food_allergies.join(", ")}` : null,
    form.medications?.length ? `Current Medications: ${form.medications.join(", ")}` : null,
    form.medical_history?.length ? `Medical History: ${form.medical_history.join(", ")}` : null,
  ].filter(Boolean);
  if (history.length) sections.push(history.join(". ") + ".");

  // Assessment findings
  const assessment = [];
  if (form.loc) assessment.push(`LOC: ${form.loc}`);
  if (form.gcs_eye || form.gcs_verbal || form.gcs_motor) assessment.push(`GCS: E${form.gcs_eye || "?"} V${form.gcs_verbal || "?"} M${form.gcs_motor || "?"} (${(parseInt(form.gcs_eye||"0") + parseInt(form.gcs_verbal||"0") + parseInt(form.gcs_motor||"0"))})`);
  if (form.pupils_left || form.pupils_right) assessment.push(`Pupils: L=${form.pupils_left || "N/A"}, R=${form.pupils_right || "N/A"}`);
  if (form.skin_color || form.skin_temp || form.skin_condition) assessment.push(`Skin: ${[form.skin_color, form.skin_temp, form.skin_condition].filter(Boolean).join(", ")}`);
  if (form.airway_patency) assessment.push(`Airway: ${form.airway_patency}${form.airway_intervention ? ` (${form.airway_intervention})` : ""}`);
  if (form.breathing_effort) assessment.push(`Breathing: ${form.breathing_effort}`);
  if (form.breath_sounds_left || form.breath_sounds_right) assessment.push(`Breath Sounds: L=${form.breath_sounds_left || "N/A"}, R=${form.breath_sounds_right || "N/A"}`);
  if (form.circulation_pulse_location || form.circulation_pulse_quality) assessment.push(`Pulse: ${form.circulation_pulse_location || "N/A"} ${form.circulation_pulse_quality || ""}`.trim());
  if (form.capillary_refill) assessment.push(`Capillary Refill: ${form.capillary_refill}`);
  if (form.bleeding_control) assessment.push(`Bleeding Control: ${form.bleeding_control}`);
  if (assessment.length) sections.push(`Assessment: ${assessment.join("; ")}.`);

  // Trauma assessment
  if (form.traumatic) {
    const trauma = [];
    if (form.trauma_findings) trauma.push(form.trauma_findings);
    if (form.head_assessment) trauma.push(`Head: ${form.head_assessment}`);
    if (form.neck_assessment) trauma.push(`Neck: ${form.neck_assessment}`);
    if (form.chest_assessment) trauma.push(`Chest: ${form.chest_assessment}`);
    if (form.abdomen_assessment) trauma.push(`Abdomen: ${form.abdomen_assessment}`);
    if (form.pelvis_assessment) trauma.push(`Pelvis: ${form.pelvis_assessment}`);
    if (form.back_assessment) trauma.push(`Back: ${form.back_assessment}`);
    if (form.extremities_assessment) trauma.push(`Extremities: ${form.extremities_assessment}`);
    if (trauma.length) sections.push(`Trauma Assessment: ${trauma.join("; ")}.`);
  }

  // Vitals
  if (form.vitals?.length) {
    const vitalsStr = form.vitals.map((v, i) => {
      const parts = [`Set ${i + 1}${v.timestamp ? ` (${v.timestamp})` : ""}`];
      if (v.bp_systolic && v.bp_diastolic) parts.push(`BP: ${v.bp_systolic}/${v.bp_diastolic}`);
      if (v.heart_rate) parts.push(`HR: ${v.heart_rate}`);
      if (v.respiratory_rate) parts.push(`RR: ${v.respiratory_rate}`);
      if (v.spo2) parts.push(`SpO2: ${v.spo2}%`);
      if (v.temperature) parts.push(`Temp: ${v.temperature}`);
      if (v.bgl) parts.push(`BGL: ${v.bgl}`);
      if (v.pain_score) parts.push(`Pain: ${v.pain_score}/10`);
      return parts.join(", ");
    });
    sections.push(`Vital Signs: ${vitalsStr.join(" | ")}.`);
  }

  // IV access
  if (form.iv_access?.length) {
    const ivStr = form.iv_access.map(iv => `${iv.site || "Unknown site"} ${iv.gauge || ""}g${iv.fluid ? ` (${iv.fluid}${iv.flow_rate ? ` @ ${iv.flow_rate}` : ""})` : ""}`);
    sections.push(`IV Access: ${ivStr.join(", ")}.`);
  }

  // Treatments
  if (form.treatments?.length) {
    const txStr = form.treatments.map(t => `${t.intervention || "Unknown"}${t.result ? ` → ${t.result}` : ""}`);
    sections.push(`Treatments: ${txStr.join(", ")}.`);
  }

  // Medications administered
  if (form.medications_administered?.length) {
    const medStr = form.medications_administered.map(m => `${m.medication || "Unknown"} ${m.dose || ""} ${m.route || ""}${m.response ? ` (Response: ${m.response})` : ""}`);
    sections.push(`Medications Administered: ${medStr.join(", ")}.`);
  }

  // Disposition / Transport
  if (form.disposition) {
    let disp = `Disposition: ${form.disposition}.`;
    if (form.disposition === "Transported" || form.disposition === "Transferred") {
      if (form.destination) disp += ` Transported to ${form.destination}.`;
      if (form.transport_method) disp += ` Transport method: ${form.transport_method}.`;
    } else if (form.disposition === "Refused AMA") {
      disp += ` Patient refused transport against medical advice.`;
    } else if (form.disposition === "Treated/Released") {
      disp += ` Patient treated and released on scene.`;
    } else if (form.disposition === "Deceased") {
      disp += ` Patient pronounced deceased on scene.`;
    } else if (form.disposition === "No Treatment") {
      disp += ` No treatment required or rendered.`;
    }
    sections.push(disp);
  }

  const prompt = `You are a professional EMS report writer. Generate a formal, clinical patient care narrative based on the following PCR data. Write in professional medical terminology, third person, past tense. The narrative should flow naturally as a single coherent document covering: dispatch/arrival, scene safety, mechanism of illness/injury, patient assessment, interventions, patient response, and transport/disposition. Do NOT include any headers, bullet points, or formatting — write as continuous paragraphs.

PCR Data:
${sections.join("\n")}`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: { type: "object", properties: { narrative: { type: "string" } } },
  });
  return response.narrative || response;
}

/**
 * Generates a narrative for a CAD report from its field data.
 */
export async function generateReportNarrative(report, templateFields) {
  const sections = [];

  sections.push(`Report Type: ${report.report_type}.`);
  sections.push(`Title: ${report.title}.`);
  if (report.location) sections.push(`Location: ${report.location}.`);
  if (report.filed_by_name) sections.push(`Filed by: ${report.filed_by_name}.`);
  if (report.linked_civilian_name) sections.push(`Subject: ${report.linked_civilian_name}.`);
  if (report.linked_vehicle_plate) sections.push(`Vehicle: ${report.linked_vehicle_plate}.`);

  if (report.field_data && templateFields?.length) {
    const fieldStrs = templateFields
      .map(f => {
        const val = report.field_data[f.label];
        if (!val) return null;
        return `${f.label}: ${Array.isArray(val) ? val.join(", ") : val}`;
      })
      .filter(Boolean);
    if (fieldStrs.length) sections.push(`Report Details:\n${fieldStrs.join("\n")}`);
  }

  if (report.description) sections.push(`Summary: ${report.description}`);

  const prompt = `You are a professional law enforcement report writer. Generate a formal incident narrative based on the following report data. Write in professional, objective, third-person past tense. Include all relevant details in a coherent narrative. Do NOT include headers, bullet points, or formatting — write as continuous paragraphs.

Report Data:
${sections.join("\n")}`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: { type: "object", properties: { narrative: { type: "string" } } },
  });
  return response.narrative || response;
}