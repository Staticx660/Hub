import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const isPlatformAdmin = user.role === 'admin';
    const discordId = user.discord_id;
    const email = user.email;

    let isSupervisor = false;
    let isCADAdmin = false;
    let personnelId = null;
    let hasDiscordSupervisorRole = false;

    if (discordId) {
      const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
      const guildId = Deno.env.get("DISCORD_GUILD_ID");

      if (botToken && guildId) {
        const departments = await base44.asServiceRole.entities.CADDepartment.filter({ is_active: true });
        const supervisorRoleIds = departments
          .map(d => d.discord_supervisor_role_id)
          .filter(Boolean);

        if (supervisorRoleIds.length > 0) {
          try {
            const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
              headers: { Authorization: `Bot ${botToken}` }
            });
            if (memberRes.ok) {
              const member = await memberRes.json();
              const userRoles = member.roles || [];
              hasDiscordSupervisorRole = supervisorRoleIds.some(rid => userRoles.includes(rid));
            }
          } catch {}
        }
      }

      const personnel = await base44.asServiceRole.entities.CADPersonnel.filter({ discord_id: discordId });
      if (personnel.length > 0) {
        const p = personnel[0];
        personnelId = p.id;

        // Effective supervisor = manual flag OR Discord supervisor role
        isSupervisor = p.is_supervisor || hasDiscordSupervisorRole;
        isCADAdmin = p.is_cad_admin || false;

        // Sync email + auto-grant supervisor flag if Discord role says so
        const updates = { email };
        if (!p.is_supervisor && hasDiscordSupervisorRole) {
          updates.is_supervisor = true;
        }
        await base44.asServiceRole.entities.CADPersonnel.update(p.id, updates);
      }
    }

    if (isPlatformAdmin) {
      isSupervisor = true;
      isCADAdmin = true;
    }

    return Response.json({
      isPlatformAdmin,
      isCADAdmin,
      isSupervisor,
      personnelId,
      discordId,
      email,
      hasDiscordSupervisorRole
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});