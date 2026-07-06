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
    let matchedDepts = [];

    // Look up personnel by discord_id first, then fall back to email
    let personnel = [];
    if (discordId) {
      personnel = await base44.asServiceRole.entities.CADPersonnel.filter({ discord_id: discordId });
    }
    if (personnel.length === 0 && email) {
      personnel = await base44.asServiceRole.entities.CADPersonnel.filter({ email: email });
    }

    // Check Discord guild roles for supervisor status and department mapping
    if (discordId) {
      const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
      const guildId = Deno.env.get("DISCORD_GUILD_ID");

      if (botToken && guildId) {
        const departments = await base44.asServiceRole.entities.CADDepartment.filter({ is_active: true });
        const supervisorRoleIds = departments
          .map(d => d.discord_supervisor_role_id)
          .filter(Boolean);

        // Build department role map
        const roleMap = {};
        for (const dept of departments) {
          if (dept.discord_role_id) roleMap[dept.discord_role_id] = dept;
        }

        if (supervisorRoleIds.length > 0 || Object.keys(roleMap).length > 0) {
          try {
            const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
              headers: { Authorization: `Bot ${botToken}` }
            });
            if (memberRes.ok) {
              const member = await memberRes.json();
              const userRoles = member.roles || [];
              hasDiscordSupervisorRole = supervisorRoleIds.some(rid => userRoles.includes(rid));

              // Match department roles
              const seenDeptIds = new Set();
              for (const roleId of userRoles) {
                if (roleMap[roleId] && !seenDeptIds.has(roleMap[roleId].id)) {
                  matchedDepts.push(roleMap[roleId]);
                  seenDeptIds.add(roleMap[roleId].id);
                }
              }
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
      if (hasDiscordSupervisorRole && !p.is_supervisor) {
        updates.is_supervisor = true;
      }
      if (isPlatformAdmin && !p.is_cad_admin) {
        updates.is_cad_admin = true;
      }

      // Sync departments from Discord roles (set to match when user has matched depts)
      if (matchedDepts.length > 0) {
        const primaryDeptId = matchedDepts[0].id;
        const additionalDeptIds = matchedDepts.slice(1).map(d => d.id);
        if (p.department_id !== primaryDeptId) updates.department_id = primaryDeptId;
        const current = (p.additional_department_ids || []).slice().sort();
        const expected = additionalDeptIds.slice().sort();
        if (JSON.stringify(current) !== JSON.stringify(expected)) {
          updates.additional_department_ids = additionalDeptIds;
        }
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