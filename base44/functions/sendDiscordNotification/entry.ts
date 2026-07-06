import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { webhook_url, title, description, color, fields } = await req.json();

    if (!webhook_url) {
      return Response.json({ error: 'No webhook URL provided' }, { status: 400 });
    }

    // Validate webhook URL is a Discord URL (prevent SSRF)
    let parsedUrl;
    try {
      parsedUrl = new URL(webhook_url);
    } catch {
      return Response.json({ error: 'Invalid webhook URL' }, { status: 400 });
    }
    if (parsedUrl.hostname !== 'discord.com' && parsedUrl.hostname !== 'discordapp.com') {
      return Response.json({ error: 'Webhook URL must be a Discord URL' }, { status: 400 });
    }

    const embed = {
      title: title || 'Roster Update',
      description: description || '',
      color: color || 3447003, // Blue
      timestamp: new Date().toISOString(),
      fields: fields || [],
      footer: { text: 'RosterHQ' },
    };

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json({ error: `Discord error: ${text}` }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});