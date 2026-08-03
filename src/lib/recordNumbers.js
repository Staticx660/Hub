// Report fields that should be auto-generated for the officer instead of typed.
export const AUTO_NUMBER_PREFIXES = {
  booking_number: "BKG",
  case_number: "CASE",
  incident_number: "INC",
  citation_number: "CIT",
  run_number: "RUN",
  pcr_number: "PCR",
};

export function isAutoNumberField(key) {
  return Object.prototype.hasOwnProperty.call(AUTO_NUMBER_PREFIXES, key);
}

export function generateRecordNumber(key) {
  const prefix = AUTO_NUMBER_PREFIXES[key] || "REC";
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `${prefix}-${stamp}${rand}`;
}