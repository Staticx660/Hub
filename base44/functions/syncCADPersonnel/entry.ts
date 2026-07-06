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
    const supervisorRoleIds = [];
    for (const dept of cadDepartments) {
      if (dept.discord_role_id) roleMap[dept.discord_role_id] = dept;
      if (dept.discord_supervisor_role_id) supervisorRoleIds.push(dept.discord_supervisor_role_id);
    }
    const defaultDept = cadDepartments.find(d => d.category === "Civilian") || cadDepartments[0] || null;

    const rosterMembers = await base44.asServiceRole.entities.RosterMember.filter({});
    const rosterByDiscordId = {};
    for (const m of rosterMembers) {
      if (m.discord_id) rosterByDiscordId[m.discord_id] = m;
    }

    // === DEDUP STEP: Clean up existing duplicate personnel records ===
    const existingPersonnel = await base44.asServiceRole.entities.CADPersonnel.filter({});
    const dedupReport = { merged: 0, deleted: 0 };

    // Group by discord_id
    const byDiscordId = {};
    const byName = {};
    for (const p of existingPersonnel) {
      if (p.discord_id) {
        if (!byDiscordId[p.discord_id]) byDiscordId[p.discord_id] = [];
        byDiscordId[p.discord_id].push(p);
      }
      if (p.name) {
        const key = p.name.toLowerCase().trim();
        if (!byName[key]) byName[key] = [];
        byName[key].push(p);
      }
    }

    // Merge duplicates by discord_id
    for (const [did, records] of Object.entries(byDiscordId)) {
      if (records.length <= 1) continue;
      records.sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));
      const keep = records[0];
      const mergeDeptIds = new Set();
      records.forEach(r => {
        if (r.department_id) mergeDeptIds.add(r.department_id);
        (r.additional_department_ids || []).forEach(id => mergeDeptIds.add(id));
      });
      const primaryDept = keep.department_id;
      const additionalDepts = [...mergeDeptIds].filter(id => id !== primaryDept);
      let bestRank = keep.rank || "";
      let bestBadge = keep.badge_number || "";
      let bestCallsign = keep.callsign || "";
      for (const r of records.slice(1)) {
        if (!bestRank && r.rank) bestRank = r.rank;
        if (!bestBadge && r.badge_number) bestBadge = r.badge_number;
        if (!bestCallsign && r.callsign) bestCallsign = r.callsign;
      }
      try {
        await base44.asServiceRole.entities.CADPersonnel.update(keep.id, {
          additional_department_ids: additionalDepts, rank: bestRank, badge_number: bestBadge, callsign: bestCallsign,
        });
      } catch (e) { /* continue */ }
      for (const r of records.slice(1)) {
        try { await base44.asServiceRole.entities.CADPersonnel.delete(r.id); dedupReport.deleted++; } catch (e) { /* continue */ }
      }
      dedupReport.merged++;
    }

    // Merge duplicates by name (personnel without discord_id that share a name)
    const dedupedByName = new Set();
    for (const [name, records] of Object.entries(byName)) {
      if (records.length <= 1) continue;
      // Skip if any of these were already handled by discord_id dedup
      if (records.some(r => r.discord_id && byDiscordId[r.discord_id]?.length > 1 && r.id !== byDiscordId[r.discord_id][0].id)) continue;
      if (records.some(r => dedupedByName.has(r.id))) continue;
      records.sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));
      const keep = records[0];
      const mergeDeptIds = new Set();
      records.forEach(r => {
        if (r.department_id) mergeDeptIds.add(r.department_id);
        (r.additional_department_ids || []).forEach(id => mergeDeptIds.add(id));
      });
      const primaryDept = keep.department_id;
      const additionalDepts = [...mergeDeptIds].filter(id => id !== primaryDept);
      try {
        await base44.asServiceRole.entities.CADPersonnel.update(keep.id, { additional_department_ids: additionalDepts });
      } catch (e) { /* continue */ }
      for (const r of records.slice(1)) {
        dedupedByName.add(r.id);
        try { await base44.asServiceRole.entities.CADPersonnel.delete(r.id); dedupReport.deleted++; } catch (e) { /* continue */ }
      }
      dedupReport.merged++;
    }

    // Reload personnel after dedup
    const cleanPersonnel = await base44.asServiceRole.entities.CADPersonnel.filter({});
    const existingByDiscordId = {};
    const existingByName = {};
    for (const p of cleanPersonnel) {
      if (p.discord_id) existingByDiscordId[p.discord_id] = p;
      if (p.name) existingByName[p.name.toLowerCase().trim()] = p;
    }

    // === DISCORD SYNC ===
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
        return Response.json({ error: `Failed to list guild members (Discord API ${membersRes.status}): ${errText}.` }, { status: 502 });
      }
      const batch = await membersRes.json();
      if (!batch || batch.length === 0) { hasMore = false; break; }
      members = members.concat(batch);
      lastMemberId = batch[batch.length - 1].user.id;
      if (batch.length < 1000) hasMore = false;
    }

    const report = { totalDiscordMembers: members.length, added: 0, updated: 0, skipped: 0, merged: dedupReport.merged, deleted: dedupReport.deleted, addedToDefault: 0, errors: [] };

    for (const member of members) {
      if (!member.user || member.user.bot) { report.skipped++; continue; }

      const discordId = member.user.id;
      const memberRoles = member.roles || [];
      const rosterMember = rosterByDiscordId[discordId];
      const displayName = rosterMember?.name || member.nick || member.user.global_name || member.user.username;

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

      const existing = (discordId && existingByDiscordId[discordId]) || existingByName[displayName.toLowerCase().trim()];

      if (existing) {
        const updates = {};
        if (existing.department_id !== primaryDept.id) updates.department_id = primaryDept.id;
        if (JSON.stringify((additionalDeptIds || []).slice().sort()) !== JSON.stringify((existing.additional_department_ids || []).slice().sort())) {
          updates.additional_department_ids = additionalDeptIds;
        }
        if (rosterMember) {
          if (rosterMember.rank && existing.rank !== rosterMember.rank) updates.rank = rosterMember.rank;
          if (rosterMember.badge_number && existing.badge_number !== rosterMember.badge_number) updates.badge_number = rosterMember.badge_number;
          if (rosterMember.callsign && existing.callsign !== rosterMember.callsign) updates.callsign = rosterMember.callsign;
        }
        if (discordId && !existing.discord_id) updates.discord_id = discordId;
        if (existing.name !== displayName) updates.name = displayName;

        const hasSupervisorRole = supervisorRoleIds.some(rid => memberRoles.includes(rid));
        if (hasSupervisorRole !== existing.is_supervisor) updates.is_supervisor = hasSupervisorRole;

        if (Object.keys(updates).length > 0) {
          try {
            await base44.asServiceRole.entities.CADPersonnel.update(existing.id, updates);
            report.updated++;
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