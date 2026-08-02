import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const departments = await base44.asServiceRole.entities.CADDepartment.filter({ is_active: true });

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");
    const discordId = user.discord_id;
    const isAdmin = user.role === 'admin';

    // Backend department assignments made in the Admin Panel (CADPersonnel)
    let personnelRecord = null;
    const assignedDeptIds = new Set();
    // Collect EVERY personnel record belonging to this user (a user can have both a
    // Discord-matched record and an email-matched one) so assignments are never missed.
    const byId = new Map();
    if (discordId) {
      for (const p of await base44.asServiceRole.entities.CADPersonnel.filter({ discord_id: discordId })) byId.set(p.id, p);
    }
    if (user.email) {
      for (const p of await base44.asServiceRole.entities.CADPersonnel.filter({ email: user.email })) byId.set(p.id, p);
    }
    const personnel = [...byId.values()];
    if (personnel.length > 0) {
      personnelRecord = personnel[0];
      for (const p of personnel) {
        if (p.department_id) assignedDeptIds.add(p.department_id);
        for (const id of p.additional_department_ids || []) assignedDeptIds.add(id);
      }
    }

    // Discord role verification
    let userRoles = [];
    let inGuild = false;
    if (discordId && botToken && guildId) {
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
    }

    // A user gains access if they satisfy EITHER Discord role verification
    // OR a backend department assignment from the Admin Panel.
    const result = departments.map(dept => {
      const backendAssigned = assignedDeptIds.has(dept.id);
      const discordAccess = dept.discord_role_id ? userRoles.includes(dept.discord_role_id) : false;
      const hasAccess = isAdmin || !dept.discord_role_id || discordAccess || backendAssigned;
      const isSupervisor =
        isAdmin ||
        (dept.discord_supervisor_role_id && userRoles.includes(dept.discord_supervisor_role_id)) ||
        (backendAssigned && personnel.some((p) => p.is_supervisor));
      return {
        id: dept.id, name: dept.name, category: dept.category, description: dept.description,
        color: dept.color, discord_role_id: dept.discord_role_id,
        discord_supervisor_role_id: dept.discord_supervisor_role_id,
        hasAccess, isSupervisor: !!isSupervisor, backendAssigned
      };
    });

    return Response.json({
      departments: result, discordId: discordId || null, discordRoles: userRoles,
      hasDiscordLink: inGuild, isAdmin
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});