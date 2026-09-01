import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { loadNotificationTones, installAudioUnlock, playToneKey, announceUnitAttached } from "@/components/cad/mdt/panicSound";

/**
 * Live call notifications for an on-duty unit.
 *  - New call in my department      → "New Dispatch" tone
 *  - I get attached to a call        → "New Dispatch" tone + AI voice (type, location, postal)
 *  - Notes added to my call          → "Dispatch Notes" tone
 *  - My call is updated              → "Dispatch Updated" tone
 *  - My call / dept call is closed   → "Dispatch Closes" tone
 * `sessionRef` must always hold the current CADSession (or null).
 */
export default function useCallNotifications(department, sessionRef) {
  const { toast } = useToast();
  const snapshots = useRef(new Map());

  useEffect(() => {
    loadNotificationTones();
    installAudioUnlock();
  }, []);

  useEffect(() => {
    if (!department) return;
    const unsub = base44.entities.ActiveCall.subscribe((event) => {
      const call = event.data;
      const s = sessionRef.current;
      if (!call || !s) return;
      if (call.department_id && call.department_id !== department.id && !(call.assigned_unit_ids || []).includes(s.id)) return;

      const prev = snapshots.current.get(call.id);
      snapshots.current.set(call.id, {
        assigned: call.assigned_unit_ids || [],
        notes: `${call.cad_notes || ""}|${call.notes || ""}`,
        status: call.status,
        updated: call.updated_date,
      });

      const title = `${call.run_number ? call.run_number + " · " : ""}${call.call_type}${call.location ? " · " + call.location : ""}${call.postal ? " · Postal " + call.postal : ""}`;

      if (event.type === "create") {
        if (call.status === "Closed") return;
        playToneKey("new_dispatch");
        toast({ title: `📻 New Call — ${call.priority || "3 - Low"}`, description: title });
        return;
      }
      if (event.type !== "update") return;

      const nowAttached = (call.assigned_unit_ids || []).includes(s.id);
      const wasAttached = prev ? prev.assigned.includes(s.id) : s.active_call_id === call.id;

      if (nowAttached && !wasAttached) {
        announceUnitAttached(call, s);
        toast({ title: "🚨 You have been dispatched", description: title });
        return;
      }

      if (call.status === "Closed" && prev && prev.status !== "Closed") {
        playToneKey("dispatch_closes");
        if (nowAttached) toast({ title: "Call closed", description: title });
        return;
      }

      if (!nowAttached || !prev) return;

      const notesKey = `${call.cad_notes || ""}|${call.notes || ""}`;
      if (notesKey !== prev.notes) {
        playToneKey("dispatch_notes");
        toast({ title: "📝 Dispatch notes updated", description: title });
        return;
      }
      if (call.updated_date !== prev.updated) {
        playToneKey("dispatch_updated");
      }
    });
    return unsub;
  }, [department?.id]);
}