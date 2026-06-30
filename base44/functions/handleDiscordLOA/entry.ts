import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function strToBytes(str) {
  return new TextEncoder().encode(str);
}

Deno.serve(async (req) => {
  try {
    // Read raw body — needed for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('X-Signature-Ed25519');
    const timestamp = req.headers.get('X-Signature-Timestamp');
    const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY');

    if (!publicKey) {
      return Response.json({ error: 'DISCORD_PUBLIC_KEY not configured' }, { status: 500 });
    }

    // Verify Discord interaction signature using Deno's built-in Web Crypto (Ed25519)
    if (signature && timestamp) {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        hexToBytes(publicKey.trim()),
        { name: 'Ed25519' },
        false,
        ['verify']
      );

      const isValid = await crypto.subtle.verify(
        'Ed25519',
        cryptoKey,
        hexToBytes(signature),
        strToBytes(timestamp + rawBody)
      );

      if (!isValid) {
        return Response.json({ error: 'Invalid request signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    // Handle PING — Discord sends this to verify the endpoint is reachable
    if (body.type === 1) {
      return Response.json({ type: 1 });
    }

    // Handle APPLICATION_COMMAND (slash command)
    if (body.type === 2) {
      const commandName = body.data?.name;

      const options = body.data?.options || [];
      const getOption = (name) => options.find(o => o.name === name)?.value;

      const discordId = body.member?.user?.id;
      const displayName = body.member?.nick || body.member?.user?.global_name || body.member?.user?.username;

      if (!discordId) {
        return Response.json({
          type: 4,
          data: { content: 'Could not identify your Discord account.' }
        });
      }

      const base44 = createClientFromRequest(req);

      // Find the roster member by their Discord ID
      const members = await base44.asServiceRole.entities.RosterMember.filter({ discord_id: discordId });
      const member = members && members.length > 0 ? members[0] : null;

      if (!member) {
        return Response.json({
          type: 4,
          data: { content: 'You are not on the roster yet. Ask an admin to add you first.' }
        });
      }

      // ── LOA Request ──
      if (commandName === 'loa-request') {
        const startDate = getOption('start_date');
        const endDate = getOption('end_date');
        const reason = getOption('reason') || 'No reason provided';

        if (!startDate || !endDate) {
          return Response.json({
            type: 4,
            data: { content: 'Both start_date and end_date are required.' }
          });
        }

        await base44.asServiceRole.entities.LOARequest.create({
          member_id: member.id,
          member_name: member.name || displayName,
          department_id: member.department_id,
          start_date: startDate,
          end_date: endDate,
          reason: reason,
          status: 'Pending'
        });

        return Response.json({
          type: 4,
          data: {
            content: `✅ Your LOA request from **${startDate}** to **${endDate}** has been submitted and is pending approval.`,
            embeds: [{
              title: 'LOA Request Submitted',
              color: 0x3B82F6,
              fields: [
                { name: 'Member', value: member.name || displayName, inline: true },
                { name: 'Start Date', value: startDate, inline: true },
                { name: 'End Date', value: endDate, inline: true },
                { name: 'Reason', value: reason, inline: false }
              ],
              timestamp: new Date().toISOString(),
              footer: { text: 'RPCommand - LOA System' }
            }]
          }
        });
      }

      // ── Clock In ──
      if (commandName === 'clock-in') {
        // Check for an existing active shift
        const activeShifts = await base44.asServiceRole.entities.Shift.filter({
          member_id: member.id,
          status: 'In Progress'
        });

        if (activeShifts && activeShifts.length > 0) {
          const active = activeShifts[0];
          return Response.json({
            type: 4,
            data: {
              content: `⏰ You are already clocked in (since ${new Date(active.start_time).toLocaleString('en-US', { timeZone: 'America/New_York' })}). Use \`/clock-out\` first.`,
              ephemeral: true
            }
          });
        }

        // Determine department — allow specifying if member is in multiple
        const deptInput = getOption('department');
        let departmentId = member.department_id;

        if (deptInput) {
          const allDepts = await base44.asServiceRole.entities.Department.list();
          const matched = allDepts.find(d => d.name.toLowerCase().includes(deptInput.toLowerCase()));
          if (matched) {
            const memberDeptIds = [member.department_id, ...(member.additional_department_ids || [])];
            if (memberDeptIds.includes(matched.id)) {
              departmentId = matched.id;
            } else {
              return Response.json({
                type: 4,
                data: { content: `You are not a member of **${matched.name}**.`, ephemeral: true }
              });
            }
          }
        }

        const notes = getOption('notes') || '';

        await base44.asServiceRole.entities.Shift.create({
          member_id: member.id,
          member_name: member.name || displayName,
          department_id: departmentId,
          start_time: new Date().toISOString(),
          status: 'In Progress',
          notes: notes
        });

        return Response.json({
          type: 4,
          data: {
            content: `🟢 **${member.name || displayName}** has clocked in and is now on duty.`,
            embeds: [{
              title: 'Shift Started',
              color: 0x10B981,
              fields: [
                { name: 'Member', value: member.name || displayName, inline: true },
                { name: 'Started At', value: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }), inline: true }
              ],
              timestamp: new Date().toISOString(),
              footer: { text: 'RPCommand - Shift System' }
            }]
          }
        });
      }

      // ── Clock Out ──
      if (commandName === 'clock-out') {
        const activeShifts = await base44.asServiceRole.entities.Shift.filter({
          member_id: member.id,
          status: 'In Progress'
        });

        if (!activeShifts || activeShifts.length === 0) {
          return Response.json({
            type: 4,
            data: { content: '⏰ You are not currently clocked in. Use `/clock-in` to start a shift.', ephemeral: true }
          });
        }

        const active = activeShifts[0];
        const endTime = new Date();
        const startTime = new Date(active.start_time);
        const hours = ((endTime - startTime) / 3600000);

        const notes = getOption('notes');
        const updateData = {
          end_time: endTime.toISOString(),
          status: 'Completed',
          duration_hours: parseFloat(hours.toFixed(2))
        };
        if (notes) updateData.notes = (active.notes ? active.notes + '\n' : '') + notes;

        await base44.asServiceRole.entities.Shift.update(active.id, updateData);

        return Response.json({
          type: 4,
          data: {
            content: `🔴 **${member.name || displayName}** has clocked out.`,
            embeds: [{
              title: 'Shift Ended',
              color: 0xEF4444,
              fields: [
                { name: 'Member', value: member.name || displayName, inline: true },
                { name: 'Duration', value: `${hours.toFixed(2)} hours`, inline: true },
                { name: 'Started', value: startTime.toLocaleString('en-US', { timeZone: 'America/New_York' }), inline: false },
                { name: 'Ended', value: endTime.toLocaleString('en-US', { timeZone: 'America/New_York' }), inline: false }
              ],
              timestamp: new Date().toISOString(),
              footer: { text: 'RPCommand - Shift System' }
            }]
          }
        });
      }

      return Response.json({
        type: 4,
        data: { content: 'Unknown command.' }
      });
    }

    return Response.json({ error: 'Unhandled interaction type' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});