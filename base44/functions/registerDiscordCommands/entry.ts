import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = Deno.env.get('DISCORD_BOT_TOKEN');
    const guildId = Deno.env.get('DISCORD_GUILD_ID');

    if (!token || !guildId) {
      return Response.json({ error: 'DISCORD_BOT_TOKEN or DISCORD_GUILD_ID not configured' }, { status: 500 });
    }

    // Extract the application ID from the bot token (first segment is base64-encoded bot ID)
    const applicationId = atob(token.split('.')[0]);

    // Register slash commands for this guild
    const commands = [
      {
        name: 'loa-request',
        description: 'Submit a leave of absence request',
        options: [
          {
            type: 3,
            name: 'start_date',
            description: 'Start date (YYYY-MM-DD)',
            required: true
          },
          {
            type: 3,
            name: 'end_date',
            description: 'End date (YYYY-MM-DD)',
            required: true
          },
          {
            type: 3,
            name: 'reason',
            description: 'Reason for LOA',
            required: false
          }
        ]
      },
      {
        name: 'clock-in',
        description: 'Clock in and start your shift',
        options: [
          {
            type: 3,
            name: 'department',
            description: 'Department name (if in multiple departments)',
            required: false
          },
          {
            type: 3,
            name: 'notes',
            description: 'Notes for this shift',
            required: false
          }
        ]
      },
      {
        name: 'clock-out',
        description: 'Clock out and end your current shift',
        options: [
          {
            type: 3,
            name: 'notes',
            description: 'Notes for this shift',
            required: false
          }
        ]
      }
    ];

    const response = await fetch(
      `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commands)
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return Response.json({ error: `Discord API error: ${text}`, status: response.status }, { status: 500 });
    }

    const data = await response.json();
    return Response.json({
      success: true,
      applicationId,
      commands: data.map(c => ({ name: c.name, id: c.id }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});