import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const redirectUri = body.redirect_uri;
    if (!redirectUri) return Response.json({ error: 'redirect_uri is required' }, { status: 400 });

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!botToken) return Response.json({ error: 'Discord bot is not configured.' }, { status: 500 });

    // Derive the application ID (client_id) from the bot token
    const appRes = await fetch('https://discord.com/api/v10/oauth2/applications/@me', {
      headers: { Authorization: `Bot ${botToken}` }
    });
    if (!appRes.ok) return Response.json({ error: 'Could not fetch Discord application info.' }, { status: 502 });
    const app = await appRes.json();
    const clientId = app.id;

    // Generate cryptographically secure random state and store for verification
    const state = crypto.randomUUID() + '.' + user.id;
    await base44.asServiceRole.entities.DiscordVerification.create({
      discord_id: 'oauth_state',
      verification_code: state,
      user_id: user.id,
      user_email: user.email,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      status: 'pending',
      method: 'oauth'
    });

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'identify',
      state: state
    });
    const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;

    return Response.json({ authUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});