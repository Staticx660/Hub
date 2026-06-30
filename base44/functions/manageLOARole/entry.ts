import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { member_id, action } = body;

    if (!member_id || !action) {
      return Response.json({ error: 'member_id and action are required' }, { status: 400 });
    }

    const token = Deno.env.get('DISCORD_BOT_TOKEN');
    const guildId = Deno.env.get('DISCORD_GUILD_ID');

    if (!token || !guildId) {
      return Response.json({ error: 'DISCORD_BOT_TOKEN or DISCORD_GUILD_ID not configured' }, { status: 500 });
    }

    // Get the roster member
    const member = await base44.asServiceRole.entities.RosterMember.get(member_id);
    if (!member) {
      return Response.json({ error: 'Member not found' }, { status: 404 });
    }

    if (!member.discord_id) {
      return Response.json({ success: true, message: 'Member has no Discord ID linked — skipping role update' });
    }

    // Get the department's configured LOA role
    const dept = await base44.asServiceRole.entities.Department.get(member.department_id);
    if (!dept || !dept.loa_discord_role_id) {
      return Response.json({ success: true, message: 'No LOA role configured for this department' });
    }

    const roleId = dept.loa_discord_role_id;
    const discordUserId = member.discord_id;
    const method = action === 'add' ? 'PUT' : 'DELETE';

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
      {
        method,
        headers: {
          'Authorization': `Bot ${token}`,
        }
      }
    );

    if (!response.ok && response.status !== 204) {
      const text = await response.text();
      return Response.json({ error: `Discord API error: ${text}` }, { status: 500 });
    }

    return Response.json({
      success: true,
      action,
      roleId,
      memberId: member_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});