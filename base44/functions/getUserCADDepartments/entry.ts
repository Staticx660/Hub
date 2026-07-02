import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const departments = await base44.asServiceRole.entities.CADDepartment.filter({ is_active: true });

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");

    // Find the user's Discord ID from RosterMember (matched by name)
    let discordId = null;
    let rosterMember = null;
    try {
      const rosterMembers = await base44.asServiceRole.entities.RosterMember.filter({});
      rosterMember = rosterMembers.find(m =>
        m.name?.toLowerCase().trim() === user.full_name?.toLowerCase().trim()
      );
      if (rosterMember) discordId = rosterMember.discord_id;
    } catch {}

    const isAdmin = user.role === 'admin';

    // No Discord ID or no bot token — user can only access departments without role restrictions
    if (!discordId || !botToken || !guildId) {
      return Response.json({
        departments: departments.map(d => ({
          id: d.id, name: d.name, category: d.category, description: d.description, color: d.color,
          discord_role_id: d.discord_role_id, discord_supervisor_role_id: d.discord_supervisor_role_id,
          hasAccess: !d.discord_role_id, isSupervisor: false
        })),
        discordId: null, hasDiscordLink: false, isAdmin
      });
    }

    // Query Discord API for guild member roles
    let userRoles = [];
    let inGuild = false;
    try {
      const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
        headers: { Authorization: `Bot ${botToken}` }
      });
      if (memberRes.ok) {
        const member = await memberRes.json();
        userRoles = member.roles || [];
        inGuild = true;
      }
    } catch {}

    const result = departments.map(dept => {
      if (!dept.discord_role_id) {
        return { id: dept.id, name: dept.name, category: dept.category, description: dept.description, color: dept.color, discord_role_id: dept.discord_role_id, discord_supervisor_role_id: dept.discord_supervisor_role_id, hasAccess: true, isSupervisor: false };
      }
      const hasAccess = userRoles.includes(dept.discord_role_id);
      const isSupervisor = dept.discord_supervisor_role_id && userRoles.includes(dept.discord_supervisor_role_id);
      return { id: dept.id, name: dept.name, category: dept.category, description: dept.description, color: dept.color, discord_role_id: dept.discord_role_id, discord_supervisor_role_id: dept.discord_supervisor_role_id, hasAccess, isSupervisor };
    });

    return Response.json({
      departments: result, discordId, discordRoles: userRoles, hasDiscordLink: inGuild, isAdmin
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});