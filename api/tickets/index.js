// ============================================================
// /api/tickets
//   GET  -> all tickets with comments (any authenticated user)
//   POST -> create a ticket (Supervisor and above only)
// ============================================================
import {
  sql, getUser, atLeast, ok, created, badRequest, unauthorized, forbidden,
  serverError, readBody, serializeTicket,
} from '../_lib.js';

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return unauthorized(res);

  try {
    if (req.method === 'GET') {
      const tickets = await sql`SELECT * FROM tickets ORDER BY created_at DESC`;
      const comments = await sql`SELECT * FROM ticket_comments ORDER BY created_at ASC`;
      const byTicket = {};
      for (const c of comments) {
        (byTicket[c.ticket_id] ||= []).push({
          by: c.author, text: c.body,
          at: c.created_at ? c.created_at.toISOString().slice(0, 16).replace('T', ' ') : '',
        });
      }
      return ok(res, { tickets: tickets.map((t) => serializeTicket({ ...t, comments: byTicket[t.id] || [] })) });
    }

    if (req.method === 'POST') {
      // Only supervisors and above may raise tickets.
      if (!atLeast(user.role, 'Supervisor'))
        return forbidden(res, 'Only supervisors can create maintenance tickets');

      const { equipId, problem, priority, description } = await readBody(req);
      if (!equipId || !problem?.trim() || !description?.trim())
        return badRequest(res, 'Equipment, problem and description are required');

      // Generate the next MT-#### id.
      const last = await sql`SELECT id FROM tickets WHERE id LIKE 'MT-%' ORDER BY id DESC LIMIT 1`;
      const nextNum = last[0] ? parseInt(last[0].id.slice(3), 10) + 1 : 2211;
      const id = `MT-${nextNum}`;

      const rows = await sql`
        INSERT INTO tickets (id, equipment_id, problem, priority, status, description, created_by)
        VALUES (${id}, ${equipId}, ${problem}, ${priority || 'Medium'}, 'Open', ${description}, ${user.name})
        RETURNING *`;

      const eq = (await sql`SELECT name FROM equipment WHERE id = ${equipId}`)[0];
      await sql`INSERT INTO activity (who, what, kind)
        VALUES (${user.name}, ${'raised ' + id + ' for ' + (eq?.name || equipId) + '.'}, 'ticket')`;

      return created(res, { ticket: serializeTicket({ ...rows[0], comments: [] }) });
    }

    return badRequest(res, 'Unsupported method');
  } catch (e) { return serverError(res, e); }
}
