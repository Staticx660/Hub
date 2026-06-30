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

      if (commandName !== 'loa-request') {
        return Response.json({
          type: 4,
          data: { content: 'Unknown command.' }
        });
      }

      const options = body.data?.options || [];
      const getOption = (name) => options.find(o => o.name === name)?.value;

      const startDate = getOption('start_date');
      const endDate = getOption('end_date');
      const reason = getOption('reason') || 'No reason provided';

      if (!startDate || !endDate) {
        return Response.json({
          type: 4,
          data: { content: 'Both start_date and end_date are required.' }
        });
      }

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
          data: { content: 'You are not on the roster yet. Ask an admin to add you before submitting LOA requests.' }
        });
      }

      // Create the LOA request
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

    return Response.json({ error: 'Unhandled interaction type' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});