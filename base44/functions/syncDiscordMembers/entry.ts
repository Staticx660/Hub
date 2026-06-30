import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Auth is optional — manual UI triggers pass a user token; scheduled automations don't
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }
    } catch {
      // No user context — scheduled automation run, proceed with service role
    }

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");

    if (!botToken || !guildId) {
      return Response.json({ error: 'DISCORD_BOT_TOKEN and DISCORD_GUILD_ID secrets must be set.' }, { status: 500 });
    }

    const headers = { Authorization: `Bot ${botToken}` };

    // Get departments that have a discord_role_id configured
    const departments = await base44.asServiceRole.entities.Department.filter({ is_active: true });

    if (!departments || departments.length === 0) {
      return Response.json({ error: 'No departments found. Create departments and map them to Discord roles first.' }, { status: 400 });
    }

    // Build role-to-department mapping
    const roleMap = {};
    const supervisorRoles = new Set();
    for (const dept of departments) {
      if (dept.discord_role_id) {
        roleMap[dept.discord_role_id] = dept;
      }
      if (dept.discord_supervisor_role_id) {
        supervisorRoles.add(dept.discord_supervisor_role_id);
      }
    }

    if (Object.keys(roleMap).length === 0) {
      return Response.json({ error: 'No departments have a Discord role ID configured. Map departments to Discord roles on the Discord Sync page first.' }, { status: 400 });
    }

    // List guild members (paginated)
    let members = [];
    let hasMore = true;
    let lastMemberId = null;

    while (hasMore && members.length < 5000) {
      const url = new URL(`https://discord.com/api/v10/guilds/${guildId}/members`);
      url.searchParams.set("limit", "1000");
      if (lastMemberId) {
        url.searchParams.set("after", lastMemberId);
      }

      const membersRes = await fetch(url.toString(), { headers });

      if (!membersRes.ok) {
        const errText = await membersRes.text();
        return Response.json({
          error: `Failed to list guild members (Discord API ${membersRes.status}): ${errText}. Make sure the bot has the Server Members Intent enabled.`
        }, { status: 502 });
      }

      const batch = await membersRes.json();
      if (!batch || batch.length === 0) {
        hasMore = false;
        break;
      }

      members = members.concat(batch);
      lastMemberId = batch[batch.length - 1].user.id;

      if (batch.length < 1000) {
        hasMore = false;
      }
    }

    // Get existing roster members by discord_id
    const existingMembers = await base44.asServiceRole.entities.RosterMember.filter({});
    const existingByDiscordId = {};
    for (const m of existingMembers) {
      if (m.discord_id) {
        existingByDiscordId[m.discord_id] = m;
      }
    }

    let body = {};
    try { body = await req.json(); } catch {}
    const debug = body.debug === true;

    const report = {
      totalDiscordMembers: members.length,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    const debugMembers = [];

    for (const member of members) {
      if (!member.user || member.user.bot) {
        report.skipped++;
        continue;
      }

      const memberRoles = member.roles || [];

      // Find which department this member belongs to (first matching role)
      let matchedDept = null;
      for (const roleId of memberRoles) {
        if (roleMap[roleId]) {
          matchedDept = roleMap[roleId];
          break;
        }
      }

      if (debug) {
        debugMembers.push({
          name: member.nick || member.user.global_name || member.user.username,
          roles: memberRoles
        });
      }

      if (!matchedDept) {
        report.skipped++;
        continue;
      }

      const discordId = member.user.id;
      const discordUsername = member.user.username;
      const displayName = member.nick || member.user.global_name || member.user.username;
      const avatarUrl = member.user.avatar
        ? `https://cdn.discordapp.com/avatars/${discordId}/${member.user.avatar}.png`
        : null;

      const isSupervisor = memberRoles.some(r => supervisorRoles.has(r));

      const existing = existingByDiscordId[discordId];

      if (existing) {
        // Update existing member if anything changed
        const updates = {};
        if (existing.department_id !== matchedDept.id) updates.department_id = matchedDept.id;
        if (existing.discord_username !== discordUsername) updates.discord_username = discordUsername;
        if (existing.name !== displayName) updates.name = displayName;
        if (avatarUrl && existing.avatar_url !== avatarUrl) updates.avatar_url = avatarUrl;
        if (existing.status === "Inactive" || existing.status === "Terminated") updates.status = "Active";
        if (existing.is_admin !== isSupervisor) updates.is_admin = isSupervisor;

        if (Object.keys(updates).length > 0) {
          try {
            await base44.asServiceRole.entities.RosterMember.update(existing.id, updates);
            report.updated++;
          } catch (e) {
            report.errors.push(`Failed to update ${displayName}: ${e.message}`);
          }
        } else {
          report.skipped++;
        }
      } else {
        // Create new roster member
        try {
          await base44.asServiceRole.entities.RosterMember.create({
            name: displayName,
            discord_id: discordId,
            discord_username: discordUsername,
            department_id: matchedDept.id,
            status: "Active",
            slot_status: "Filled",
            is_admin: isSupervisor,
            avatar_url: avatarUrl,
            join_date: new Date().toISOString().split('T')[0]
          });
          report.added++;
        } catch (e) {
          report.errors.push(`Failed to create ${displayName}: ${e.message}`);
        }
      }
    }

    return Response.json({ success: true, report, debugMembers: debug ? debugMembers : undefined, mappedRoleIds: debug ? Object.keys(roleMap) : undefined });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});