import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const discordId = body.discord_id?.trim();

    if (!discordId) {
      return Response.json({ error: 'Discord ID is required' }, { status: 400 });
    }

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");

    if (!botToken || !guildId) {
      return Response.json({ error: 'Discord bot is not configured. Contact an admin.' }, { status: 500 });
    }

    // Look up the guild member by Discord ID
    const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
      headers: { Authorization: `Bot ${botToken}` }
    });

    if (memberRes.status === 404) {
      return Response.json({
        error: 'Member not found in the Discord server. Make sure you entered the correct Discord ID and that you are a member of the server.'
      }, { status: 404 });
    }

    if (!memberRes.ok) {
      const errText = await memberRes.text();
      return Response.json({
        error: `Discord API error (${memberRes.status}): ${errText}`
      }, { status: 502 });
    }

    const member = await memberRes.json();

    // Build avatar URL
    const avatarUrl = member.user.avatar
      ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=256`
      : null;
    const displayName = member.nick || member.user.global_name || member.user.username;

    // Save discord_id and avatar_url to user profile
    await base44.auth.updateMe({
      discord_id: member.user.id,
      avatar_url: avatarUrl
    });

    // Check if there's a matching roster member for rank/callsign info
    let rosterMember = null;
    try {
      const rosterMembers = await base44.asServiceRole.entities.RosterMember.filter({ discord_id: member.user.id });
      if (rosterMembers.length > 0) {
        rosterMember = {
          name: rosterMembers[0].name,
          rank: rosterMembers[0].rank,
          callsign: rosterMembers[0].callsign,
          badge_number: rosterMembers[0].badge_number,
          department_id: rosterMembers[0].department_id,
          status: rosterMembers[0].status
        };
      }
    } catch {}

    return Response.json({
      success: true,
      discordId: member.user.id,
      username: member.user.username,
      globalName: member.user.global_name,
      displayName,
      avatarUrl,
      roles: member.roles || [],
      rosterMember
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});