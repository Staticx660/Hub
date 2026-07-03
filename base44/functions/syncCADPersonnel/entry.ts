import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }
    } catch { /* scheduled run — proceed with service role */ }

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");
    if (!botToken || !guildId) {
      return Response.json({ error: 'DISCORD_BOT_TOKEN and DISCORD_GUILD_ID secrets must be set.' }, { status: 500 });
    }

    const headers = { Authorization: `Bot ${botToken}` };

    const cadDepartments = await base44.asServiceRole.entities.CADDepartment.filter({ is_active: true });
    const roleMap = {};
    for (const dept of cadDepartments) {
      if (dept.discord_role_id) roleMap[dept.discord_role_id] = dept;
    }
    const defaultDept = cadDepartments.find(d => d.category === "Civilian") || cadDepartments[0] || null;

    const rosterMembers = await base44.asServiceRole.entities.RosterMember.filter({});
    const rosterByDiscordId = {};
    for (const m of rosterMembers) {
      if (m.discord_id) rosterByDiscordId[m.discord_id] = m;
    }

    const existingPersonnel = await base44.asServiceRole.entities.CADPersonnel.filter({});
    // Deduplicate by discord_id (fallback to name) — ONE record per person
    const existingByDiscordId = {};
    const existingByName = {};
    for (const p of existingPersonnel) {
      if (p.discord_id) existingByDiscordId[p.discord_id] = p;
      if (p.name) existingByName[p.name.toLowerCase().trim()] = p;
    }

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
        return Response.json({ error: `Failed to list guild members (Discord API ${membersRes.status}): ${errText}. Make sure the bot has the Server Members Intent enabled.` }, { status: 502 });
      }
      const batch = await membersRes.json();
      if (!batch || batch.length === 0) { hasMore = false; break; }
      members = members.concat(batch);
      lastMemberId = batch[batch.length - 1].user.id;
      if (batch.length < 1000) hasMore = false;
    }

    // Track which personnel records we've seen, to detect stale ones
    const seenIds = new Set();
    const report = { totalDiscordMembers: members.length, added: 0, updated: 0, skipped: 0, merged: 0, addedToDefault: 0, errors: [] };

    for (const member of members) {
      if (!member.user || member.user.bot) { report.skipped++; continue; }

      const discordId = member.user.id;
      const memberRoles = member.roles || [];
      const rosterMember = rosterByDiscordId[discordId];
      const displayName = rosterMember?.name || member.nick || member.user.global_name || member.user.username;

      // Find ALL CAD departments this member belongs to via Discord roles
      const matchedDepts = [];
      const seenDeptIds = new Set();
      for (const roleId of memberRoles) {
        if (roleMap[roleId] && !seenDeptIds.has(roleMap[roleId].id)) {
          matchedDepts.push(roleMap[roleId]);
          seenDeptIds.add(roleMap[roleId].id);
        }
      }

      let primaryDept;
      let additionalDeptIds = [];
      let assignedToDefault = false;

      if (matchedDepts.length > 0) {
        primaryDept = matchedDepts[0];
        additionalDeptIds = matchedDepts.slice(1).map(d => d.id);
      } else if (defaultDept) {
        primaryDept = defaultDept;
        assignedToDefault = true;
      } else {
        report.skipped++;
        continue;
      }

      // Find existing record — by discord_id first, then by name
      const existing = (discordId && existingByDiscordId[discordId]) || existingByName[displayName.toLowerCase().trim()];

      if (existing) {
        seenIds.add(existing.id);
        const updates = {};
        if (existing.department_id !== primaryDept.id) updates.department_id = primaryDept.id;
        // Sync additional departments
        const currentAdditional = existing.additional_department_ids || [];
        const mergedAdditional = [...new Set([...currentAdditional, ...additionalDeptIds])];
        if (JSON.stringify(mergedAdditional.sort()) !== JSON.stringify(currentAdditional.sort())) {
          updates.additional_department_ids = mergedAdditional;
        }
        if (rosterMember) {
          if (rosterMember.rank && existing.rank !== rosterMember.rank) updates.rank = rosterMember.rank;
          if (rosterMember.badge_number && existing.badge_number !== rosterMember.badge_number) updates.badge_number = rosterMember.badge_number;
          if (rosterMember.callsign && existing.callsign !== rosterMember.callsign) updates.callsign = rosterMember.callsign;
        }
        if (discordId && !existing.discord_id) updates.discord_id = discordId;
        if (existing.name !== displayName) updates.name = displayName;

        if (Object.keys(updates).length > 0) {
          try {
            await base44.asServiceRole.entities.CADPersonnel.update(existing.id, updates);
            report.updated++;
            if (updates.additional_department_ids) report.merged++;
          } catch (e) { report.errors.push(`Failed to update ${displayName}: ${e.message}`); }
        } else {
          report.skipped++;
        }
      } else {
        try {
          const newRec = await base44.asServiceRole.entities.CADPersonnel.create({
            name: displayName, discord_id: discordId, department_id: primaryDept.id,
            additional_department_ids: additionalDeptIds,
            rank: rosterMember?.rank || "", badge_number: rosterMember?.badge_number || "",
            callsign: rosterMember?.callsign || "", status: "Off Duty",
          });
          seenIds.add(newRec.id);
          existingByDiscordId[discordId] = newRec;
          existingByName[displayName.toLowerCase().trim()] = newRec;
          report.added++;
          if (assignedToDefault) report.addedToDefault++;
        } catch (e) { report.errors.push(`Failed to create ${displayName}: ${e.message}`); }
      }
    }

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});