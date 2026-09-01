import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { requireSystemManager } from '../../shared/authGuards.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Guild + role configuration is Discord config data — System Manager only.
    const actor = await requireSystemManager(base44);
    if (actor.error) return actor.error;

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");

    if (!botToken || !guildId) {
      return Response.json({ error: 'DISCORD_BOT_TOKEN and DISCORD_GUILD_ID secrets must be set.' }, { status: 500 });
    }

    const headers = { Authorization: `Bot ${botToken}` };

    // Get guild info (with_counts gives approximate_member_count)
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, { headers });
    let guild = null;
    let guildError = null;
    if (guildRes.ok) {
      guild = await guildRes.json();
    } else {
      guildError = `Discord guild API error (${guildRes.status}): ${await guildRes.text()}`;
    }

    // List roles
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, { headers });
    let roles = [];
    let rolesError = null;
    if (rolesRes.ok) {
      roles = await rolesRes.json();
    } else {
      rolesError = `Discord roles API error (${rolesRes.status})`;
    }

    return Response.json({
      guild,
      guildError,
      roles,
      rolesError,
      approximate_member_count: guild?.approximate_member_count,
      approximate_presence_count: guild?.approximate_presence_count
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});