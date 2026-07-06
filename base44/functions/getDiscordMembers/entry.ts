import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");

    if (!botToken || !guildId) {
      return Response.json({ error: 'DISCORD_BOT_TOKEN and DISCORD_GUILD_ID secrets must be set.' }, { status: 500 });
    }

    const headers = { Authorization: `Bot ${botToken}` };

    // List guild members (paginated)
    let members = [];
    let hasMore = true;
    let lastMemberId = null;

    while (hasMore && members.length < 5000) {
      const url = new URL(`https://discord.com/api/v10/guilds/${guildId}/members`);
      url.searchParams.set("limit", "1000");
      if (lastMemberId) url.searchParams.set("after", lastMemberId);

      const membersRes = await fetch(url.toString(), { headers });
      if (!membersRes.ok) {
        const errText = await membersRes.text();
        return Response.json({
          error: `Failed to list guild members (Discord API ${membersRes.status}): ${errText}. Make sure the bot has the Server Members Intent enabled.`
        }, { status: 502 });
      }

      const batch = await membersRes.json();
      if (!batch || batch.length === 0) { hasMore = false; break; }

      members = members.concat(batch);
      lastMemberId = batch[batch.length - 1].user.id;
      if (batch.length < 1000) hasMore = false;
    }

    // Get all registered users to cross-reference
    const registeredUsers = await base44.asServiceRole.entities.User.filter({});
    const usersByDiscordId = {};
    for (const u of registeredUsers) {
      if (u.discord_id) usersByDiscordId[u.discord_id] = u;
    }

    const result = members
      .filter(m => m.user && !m.user.bot)
      .map(m => {
        const discordId = m.user.id;
        const linkedUser = usersByDiscordId[discordId];
        return {
          discord_id: discordId,
          username: m.user.username,
          global_name: m.user.global_name,
          display_name: m.nick || m.user.global_name || m.user.username,
          avatar_url: m.user.avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${m.user.avatar}.png` : null,
          roles: m.roles || [],
          joined_at: m.joined_at,
          is_registered: !!linkedUser,
          linked_user: linkedUser ? {
            email: linkedUser.email,
            display_name: linkedUser.display_name,
            role: linkedUser.role,
            created_date: linkedUser.created_date
          } : null
        };
      })
      .sort((a, b) => {
        if (a.is_registered !== b.is_registered) return a.is_registered ? 1 : -1;
        return a.display_name.localeCompare(b.display_name);
      });

    return Response.json({
      members: result,
      total: result.length,
      registered: result.filter(m => m.is_registered).length,
      pending: result.filter(m => !m.is_registered).length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});