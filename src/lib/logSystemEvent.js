import { base44 } from "@/api/base44Client";

export async function logSystemEvent(action, category, description, metadata = {}) {
  try {
    const user = await base44.auth.me();
    await base44.entities.SystemLog.create({
      action,
      category,
      description,
      user_id: user?.id || "",
      user_name: user?.full_name || "System",
      severity: metadata.severity || "Info",
      entity_type: metadata.entity_type || "",
      entity_id: metadata.entity_id || "",
      metadata: metadata,
    });
  } catch (e) { /* silent fail */ }
}