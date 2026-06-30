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

    // Fetch the department to get its Discord webhook URL
    const department = await base44.asServiceRole.entities.Department.get(loaRequest.department_id);

    if (!department || !department.discord_webhook_url) {
      return Response.json({ skipped: true, reason: 'No webhook URL configured for this department' });
    }

    const embed = {
      title: '📝 New LOA Request Pending',
      description: 'A new leave of absence request has been submitted and needs review.',
      color: 0xF59E0B,
      fields: [
        { name: 'Member', value: loaRequest.member_name || 'Unknown', inline: true },
        { name: 'Department', value: department.name || 'Unknown', inline: true },
        { name: 'Start Date', value: loaRequest.start_date || 'N/A', inline: true },
        { name: 'End Date', value: loaRequest.end_date || 'N/A', inline: true },
        { name: 'Reason', value: loaRequest.reason || 'No reason provided', inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'RPCommand - LOA System' },
    };

    const response = await fetch(department.discord_webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json({ error: `Discord webhook error: ${text}` }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});