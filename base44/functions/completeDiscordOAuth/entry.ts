import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const code = body.code;
    const redirectUri = body.redirect_uri;
    const state = body.state;
    if (!code || !redirectUri) return Response.json({ error: 'code and redirect_uri are required' }, { status: 400 });

    // Verify the state from our database (CSRF protection)
    if (!state) return Response.json({ error: 'Missing state parameter.' }, { status: 400 });
    const stateRecords = await base44.asServiceRole.entities.DiscordVerification.filter({
      verification_code: state,
      user_id: user.id,
      status: 'pending'
    });
    if (stateRecords.length === 0) {
      return Response.json({ error: 'Invalid or expired state. Please retry the Discord verification.' }, { status: 400 });
    }
    const stateRecord = stateRecords[0];
    if (new Date(stateRecord.expires_at) < new Date()) {
      await base44.asServiceRole.entities.DiscordVerification.update(stateRecord.id, { status: 'expired' });
      return Response.json({ error: 'State expired. Please retry the Discord verification.' }, { status: 400 });
    }
    // Consume the state so it can't be reused
    await base44.asServiceRole.entities.DiscordVerification.update(stateRecord.id, { status: 'expired' });

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");
    if (!botToken || !clientSecret || !guildId) {
      return Response.json({ error: 'Discord OAuth is not fully configured. An admin needs to set the client secret.' }, { status: 500 });
    }

    // Derive client_id from the bot token
    const appRes = await fetch('https://discord.com/api/v10/oauth2/applications/@me', {
      headers: { Authorization: `Bot ${botToken}` }
    });
    if (!appRes.ok) return Response.json({ error: 'Could not fetch Discord application info.' }, { status: 502 });
    const app = await appRes.json();
    const clientId = app.id;

    // Exchange the authorization code for an access token
    const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });
    if (!tokenRes.ok) {
      return Response.json({ error: 'Discord authorization failed. The code may be invalid or expired — please try again.' }, { status: 502 });
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch the verified Discord user
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!userRes.ok) return Response.json({ error: 'Could not fetch your Discord profile.' }, { status: 502 });
    const discordUser = await userRes.json();

    const verifiedDiscordId = discordUser.id;

    // Verify the user is a member of the guild
    const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${verifiedDiscordId}`, {
      headers: { Authorization: `Bot ${botToken}` }
    });
    if (memberRes.status === 404) {
      return Response.json({ error: 'Your Discord account is not a member of the server.' }, { status: 403 });
    }
    if (!memberRes.ok) return Response.json({ error: 'Could not verify guild membership.' }, { status: 502 });
    const member = await memberRes.json();

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`
      : null;
    const displayName = member.nick || discordUser.global_name || discordUser.username;

    // Link the verified Discord ID to the user profile
    await base44.auth.updateMe({
      discord_id: verifiedDiscordId,
      avatar_url: avatarUrl
    });

    // Log the verification
    try {
      await base44.asServiceRole.entities.DiscordVerification.create({
        discord_id: verifiedDiscordId,
        verification_code: "oauth_verified",
        user_id: user.id,
        user_email: user.email,
        expires_at: new Date().toISOString(),
        status: "verified",
        method: "oauth"
      });
    } catch {}

    // Check for a matching roster member
    let rosterMember = null;
    try {
      const rosterMembers = await base44.asServiceRole.entities.RosterMember.filter({ discord_id: verifiedDiscordId });
      if (rosterMembers.length > 0) {
        rosterMember = {
          name: rosterMembers[0].name,
          rank: rosterMembers[0].rank,
          callsign: rosterMembers[0].callsign
        };
      }
    } catch {}

    return Response.json({
      success: true,
      discordId: verifiedDiscordId,
      username: discordUser.username,
      displayName,
      avatarUrl,
      rosterMember
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});