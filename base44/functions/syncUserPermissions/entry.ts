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

    // Look up personnel by discord_id first, then fall back to email
    let personnel = [];
    if (discordId) {
      personnel = await base44.asServiceRole.entities.CADPersonnel.filter({ discord_id: discordId });
    }
    if (personnel.length === 0 && email) {
      personnel = await base44.asServiceRole.entities.CADPersonnel.filter({ email: email });
    }

    // Check Discord guild roles for supervisor status
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
    }

    if (personnel.length > 0) {
      const p = personnel[0];
      personnelId = p.id;

      isSupervisor = p.is_supervisor || hasDiscordSupervisorRole;
      isCADAdmin = p.is_cad_admin || isPlatformAdmin;

      const updates = {};
      if (email && p.email !== email) updates.email = email;
      if (discordId && p.discord_id !== discordId) updates.discord_id = discordId;
      if (!p.is_supervisor && hasDiscordSupervisorRole) {
        updates.is_supervisor = true;
      }
      if (isPlatformAdmin && !p.is_cad_admin) {
        updates.is_cad_admin = true;
      }
      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.CADPersonnel.update(p.id, updates);
      }
    } else {
      isCADAdmin = isPlatformAdmin;
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