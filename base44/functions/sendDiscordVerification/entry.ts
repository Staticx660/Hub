import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const discordId = body.discord_id?.trim();
    if (!discordId) return Response.json({ error: 'Discord ID is required' }, { status: 400 });

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");
    if (!botToken || !guildId) {
      return Response.json({ error: 'Discord bot is not configured. Contact an admin.' }, { status: 500 });
    }

    // Verify the Discord ID is a real guild member
    const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
      headers: { Authorization: `Bot ${botToken}` }
    });
    if (memberRes.status === 404) {
      return Response.json({
        error: 'That Discord ID is not a member of the server. Double-check the ID and make sure you are in the Discord server.'
      }, { status: 404 });
    }
    if (!memberRes.ok) {
      return Response.json({ error: 'Discord lookup failed. Please try again.' }, { status: 502 });
    }
    const member = await memberRes.json();

    // Generate a 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Expire any previous pending codes for this user
    try {
      await base44.asServiceRole.entities.DiscordVerification.updateMany(
        { user_id: user.id, status: "pending" },
        { $set: { status: "expired" } }
      );
    } catch {}

    // Create the verification record
    await base44.asServiceRole.entities.DiscordVerification.create({
      discord_id: discordId,
      verification_code: code,
      user_id: user.id,
      user_email: user.email,
      expires_at: expiresAt,
      status: "pending",
      method: "bot_dm"
    });

    // Create a DM channel with the user
    const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: discordId })
    });
    if (!dmRes.ok) {
      return Response.json({
        error: 'Could not open a DM with that Discord user. They may have DMs from server members disabled.'
      }, { status: 502 });
    }
    const dmChannel = await dmRes.json();

    // Send the verification code
    const msgRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🔐 **Discord Verification Code**\n\nYour verification code is: **${code}**\n\nThis code expires in 10 minutes. Enter it in the CAD Settings page to link your account.\n\nIf you did not request this, you can safely ignore this message.`
      })
    });
    if (!msgRes.ok) {
      return Response.json({ error: 'Could not send the verification DM.' }, { status: 502 });
    }

    const displayName = member.nick || member.user?.global_name || member.user?.username;
    return Response.json({ success: true, displayName, message: 'Verification code sent to your Discord DMs.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});