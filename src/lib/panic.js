import { base44 } from "@/api/base44Client";

// A panic call is identified by its run number prefix (or legacy origin value)
export function isPanicCall(call) {
  return !!call && (call.run_number?.startsWith("PNC-") || call.call_origin === "Panic");
}

// Clears a unit's panic: closes the auto-created panic call and resets the session.
// Returns the updated session object.
export async function clearPanic(session) {
  if (session.active_call_id) {
    try {
      const call = await base44.entities.ActiveCall.get(session.active_call_id);
      if (isPanicCall(call) && call.status !== "Closed") {
        const note = `Panic cleared by ${session.callsign || session.user_name} at ${new Date().toLocaleString()}`;
        await base44.entities.ActiveCall.update(call.id, {
          status: "Closed",
          cad_notes: call.cad_notes ? `${call.cad_notes}\n${note}` : note,
        });
      }
    } catch { /* call may already be deleted */ }
  }
  const updates = { panic_active: false, status: "Available", active_call_id: "" };
  await base44.entities.CADSession.update(session.id, updates);
  return { ...session, ...updates };
}