import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireDeptAdmin } from '../../shared/deptAdmin.js';

/* Roster writes scoped to a single department. Department admins may manage
   only their own department; platform admins may manage any. RosterMember RLS
   restricts writes to platform admins, so writes run as the service role
   AFTER the department-scoped authorization check. */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, departmentId } = body;

    if (!action || !departmentId) {
      return Response.json({ error: 'action and departmentId are required' }, { status: 400 });
    }

    const auth = await requireDeptAdmin(base44, departmentId);
    if (auth.error) return auth.error;

    const svc = base44.asServiceRole.entities;

    if (action === 'saveMember') {
      const { memberId, data } = body;
      if (!data) return Response.json({ error: 'data is required' }, { status: 400 });

      if (memberId) {
        const existing = await svc.RosterMember.get(memberId);
        const belongs = existing.department_id === departmentId
          || (existing.additional_department_ids || []).includes(departmentId);
        if (!belongs) return Response.json({ error: 'Member is not in this department' }, { status: 403 });
        const updated = await svc.RosterMember.update(memberId, data);
        return Response.json({ member: updated });
      }

      const created = await svc.RosterMember.create({ ...data, department_id: departmentId });
      return Response.json({ member: created });
    }

    if (action === 'deleteMember') {
      const { memberId } = body;
      if (!memberId) return Response.json({ error: 'memberId is required' }, { status: 400 });
      const existing = await svc.RosterMember.get(memberId);
      const belongs = existing.department_id === departmentId
        || (existing.additional_department_ids || []).includes(departmentId);
      if (!belongs) return Response.json({ error: 'Member is not in this department' }, { status: 403 });
      await svc.RosterMember.delete(memberId);
      return Response.json({ success: true });
    }

    if (action === 'saveRanks') {
      const { ranks } = body;
      if (!Array.isArray(ranks)) return Response.json({ error: 'ranks must be an array' }, { status: 400 });
      await svc.Department.update(departmentId, { ranks });

      const members = await svc.RosterMember.filter({ department_id: departmentId });
      const updates = [];
      for (const m of members) {
        const rank = ranks.find((r) => r.name === m.rank);
        if (rank && rank.level !== m.rank_level) updates.push({ id: m.id, rank_level: rank.level });
      }
      if (updates.length > 0) await svc.RosterMember.bulkUpdate(updates);
      return Response.json({ success: true, membersUpdated: updates.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}