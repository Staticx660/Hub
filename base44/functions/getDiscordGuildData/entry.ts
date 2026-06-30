import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const guild_id = body.guild_id;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("discord");

    // List guilds the user is in
    const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!guildsRes.ok) {
      const errText = await guildsRes.text();
      return Response.json({ error: `Discord guilds API error (${guildsRes.status}): ${errText}` }, { status: 502 });
    }

    const guilds = await guildsRes.json();

    if (!guild_id) {
      return Response.json({ guilds });
    }

    // List roles for the selected guild
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guild_id}/roles`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    let roles = [];
    let rolesError = null;
    if (rolesRes.ok) {
      roles = await rolesRes.json();
    } else {
      rolesError = `Discord roles API error (${rolesRes.status})`;
    }

    // Quick test: can we list members? (bot-only endpoint — returns error for user tokens)
    let membersError = null;
    const testMembersRes = await fetch(`https://discord.com/api/v10/guilds/${guild_id}/members?limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!testMembersRes.ok) {
      membersError = `Discord members API error (${testMembersRes.status}): listing all guild members requires a Discord bot with the Server Members Intent.`;
    }

    return Response.json({ roles, rolesError, membersError });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});