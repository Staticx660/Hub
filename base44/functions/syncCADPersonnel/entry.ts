import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Admin-only when a user token is present
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

    // Get CAD departments and build role → department map
    const cadDepartments = await base44.asServiceRole.entities.CADDepartment.filter({ is_active: true });
    const roleMap = {};
    for (const dept of cadDepartments) {
      if (dept.discord_role_id) {
        roleMap[dept.discord_role_id] = dept;
      }
    }

    // Default department for members without a matching role (civilian category or first available)
    const defaultDept = cadDepartments.find(d => d.category === "Civilian") || cadDepartments[0] || null;

    // Get roster members for rank/badge/callsign/name lookup (by discord_id)
    const rosterMembers = await base44.asServiceRole.entities.RosterMember.filter({});
    const rosterByDiscordId = {};
    for (const m of rosterMembers) {
      if (m.discord_id) rosterByDiscordId[m.discord_id] = m;
    }

    // Get existing CAD personnel
    const existingPersonnel = await base44.asServiceRole.entities.CADPersonnel.filter({});
    const existingKey = (name, deptId) => `${name}::${deptId}`;
    const existingMap = {};
    for (const p of existingPersonnel) {
      existingMap[existingKey(p.name, p.department_id)] = p;
    }

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

    const report = {
      totalDiscordMembers: members.length,
      added: 0,
      updated: 0,
      skipped: 0,
      addedToDefault: 0,
      errors: []
    };

    for (const member of members) {
      if (!member.user || member.user.bot) { report.skipped++; continue; }

      const memberRoles = member.roles || [];
      const discordId = member.user.id;

      // Look up roster member for name/rank/badge/callsign
      const rosterMember = rosterByDiscordId[discordId];

      // Use roster member name if available (includes formatted names like "EMS-3201 | X. Static")
      const displayName = rosterMember?.name || member.nick || member.user.global_name || member.user.username;

      // Find CAD department(s) this member belongs to via Discord roles
      const matchedDepts = [];
      const seenDeptIds = new Set();
      for (const roleId of memberRoles) {
        if (roleMap[roleId] && !seenDeptIds.has(roleMap[roleId].id)) {
          matchedDepts.push(roleMap[roleId]);
          seenDeptIds.add(roleMap[roleId].id);
        }
      }

      // Assign department: matched role → that dept; no match → default dept
      let primaryDept;
      let assignedToDefault = false;
      if (matchedDepts.length > 0) {
        primaryDept = matchedDepts[0];
      } else if (defaultDept) {
        primaryDept = defaultDept;
        assignedToDefault = true;
      } else {
        report.skipped++;
        continue;
      }

      const key = existingKey(displayName, primaryDept.id);
      const existing = existingMap[key];

      if (existing) {
        // Update rank/badge/callsign from roster if we have better data
        if (rosterMember) {
          const updates = {};
          if (rosterMember.rank && existing.rank !== rosterMember.rank) updates.rank = rosterMember.rank;
          if (rosterMember.badge_number && existing.badge_number !== rosterMember.badge_number) updates.badge_number = rosterMember.badge_number;
          if (rosterMember.callsign && existing.callsign !== rosterMember.callsign) updates.callsign = rosterMember.callsign;
          if (Object.keys(updates).length > 0) {
            try {
              await base44.asServiceRole.entities.CADPersonnel.update(existing.id, updates);
              report.updated++;
            } catch (e) {
              report.errors.push(`Failed to update ${displayName}: ${e.message}`);
            }
          } else {
            report.skipped++;
          }
        } else {
          report.skipped++;
        }
      } else {
        try {
          await base44.asServiceRole.entities.CADPersonnel.create({
            name: displayName,
            department_id: primaryDept.id,
            rank: rosterMember?.rank || "",
            badge_number: rosterMember?.badge_number || "",
            callsign: rosterMember?.callsign || "",
            status: "Off Duty",
          });
          report.added++;
          if (assignedToDefault) report.addedToDefault++;
        } catch (e) {
          report.errors.push(`Failed to create ${displayName}: ${e.message}`);
        }
      }
    }

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});