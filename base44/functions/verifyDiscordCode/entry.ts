import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const code = body.code?.trim();
    if (!code) return Response.json({ error: 'Verification code is required' }, { status: 400 });

    // Find a pending, matching code for this user
    const records = await base44.asServiceRole.entities.DiscordVerification.filter({
      user_id: user.id,
      verification_code: code,
      status: "pending"
    });

    if (records.length === 0) {
      return Response.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
    }

    const record = records[0];

    // Check expiry
    if (new Date() > new Date(record.expires_at)) {
      await base44.asServiceRole.entities.DiscordVerification.update(record.id, { status: "expired" });
      return Response.json({ error: 'This code has expired. Please request a new one.' }, { status: 400 });
    }

    // Mark verified
    await base44.asServiceRole.entities.DiscordVerification.update(record.id, { status: "verified" });

    const verifiedDiscordId = record.discord_id;
    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");

    // Look up the guild member for avatar + display name
    const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${verifiedDiscordId}`, {
      headers: { Authorization: `Bot ${botToken}` }
    });
    if (!memberRes.ok) {
      return Response.json({ error: 'Discord member lookup failed after verification.' }, { status: 502 });
    }
    const member = await memberRes.json();

    const avatarUrl = member.user?.avatar
      ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=256`
      : null;
    const displayName = member.nick || member.user?.global_name || member.user?.username;

    // Save the verified Discord ID to the user profile
    await base44.auth.updateMe({
      discord_id: member.user.id,
      avatar_url: avatarUrl
    });

    // Check for a matching roster member
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