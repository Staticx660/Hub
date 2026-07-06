import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Entity automation payload: { event, data, old_data, payload_too_large }
    let body = {};
    try { body = await req.json(); } catch {}

    const loaRequest = body.data || body;

    if (!loaRequest || !loaRequest.department_id) {
      return Response.json({ skipped: true, reason: 'No department_id on LOA request' });
    }

    // Collect all department IDs: the LOA's department + the member's additional departments
    const departmentIds = new Set([loaRequest.department_id]);

    if (loaRequest.member_id) {
      try {
        const member = await base44.asServiceRole.entities.RosterMember.get(loaRequest.member_id);
        if (member && Array.isArray(member.additional_department_ids)) {
          for (const deptId of member.additional_department_ids) {
            if (deptId) departmentIds.add(deptId);
          }
        }
      } catch {}
    }

    // Fetch all departments and collect webhook URLs
    const departments = [];
    for (const deptId of departmentIds) {
      try {
        const dept = await base44.asServiceRole.entities.Department.get(deptId);
        if (dept && dept.discord_webhook_url) {
          departments.push(dept);
        }
      } catch {}
    }

    if (departments.length === 0) {
      return Response.json({ skipped: true, reason: 'No webhook URLs configured for any of the member\'s departments' });
    }

    const embed = {
      title: '📝 New LOA Request Pending',
      description: 'A new leave of absence request has been submitted and needs review.',
      color: 0xF59E0B,
      fields: [
        { name: 'Member', value: loaRequest.member_name || 'Unknown', inline: true },
        { name: 'Start Date', value: loaRequest.start_date || 'N/A', inline: true },
        { name: 'End Date', value: loaRequest.end_date || 'N/A', inline: true },
        { name: 'Reason', value: loaRequest.reason || 'No reason provided', inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'OCRP Hub - LOA System' },
    };

    // Send to every department's webhook
    const results = [];
    for (const dept of departments) {
      try {
        const deptEmbed = {
          ...embed,
          fields: [
            ...embed.fields,
            { name: 'Department', value: dept.name || 'Unknown', inline: true },
          ],
        };
        const response = await fetch(dept.discord_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [deptEmbed] }),
        });
        results.push({ department: dept.name, ok: response.ok });
        if (!response.ok) {
          const text = await response.text();
          console.error(`Webhook failed for ${dept.name}: ${text}`);
        }
      } catch (e) {
        results.push({ department: dept.name, ok: false, error: e.message });
      }
    }

    return Response.json({ success: true, notified: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});