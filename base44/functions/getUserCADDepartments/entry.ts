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
    let personnel = [];
    if (discordId) {
      personnel = await base44.asServiceRole.entities.CADPersonnel.filter({ discord_id: discordId });
    }
    if (personnel.length === 0 && user.email) {
      personnel = await base44.asServiceRole.entities.CADPersonnel.filter({ email: user.email });
    }
    if (personnel.length > 0) {
      personnelRecord = personnel[0];
      if (personnelRecord.department_id) assignedDeptIds.add(personnelRecord.department_id);
      for (const id of personnelRecord.additional_department_ids || []) assignedDeptIds.add(id);
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
      const hasAccess = !dept.discord_role_id || discordAccess || backendAssigned;
      const isSupervisor =
        (dept.discord_supervisor_role_id && userRoles.includes(dept.discord_supervisor_role_id)) ||
        (backendAssigned && !!personnelRecord?.is_supervisor);
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