// POST /api/tickets/comment  { ticketId, body }  (Supervisor and above)
import { sql, getUser, atLeast, created, badRequest, unauthorized, forbidden, serverError, readBody } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return badRequest(res, 'Use POST');
  const user = getUser(req);
  if (!user) return unauthorized(res);
  if (!atLeast(user.role, 'Supervisor')) return forbidden(res, 'Only supervisors can comment on tickets');

  try {
    const { ticketId, body } = await readBody(req);
    if (!ticketId || !body?.trim()) return badRequest(res, 'ticketId and body are required');

    const rows = await sql`
      INSERT INTO ticket_comments (ticket_id, author, body)
      VALUES (${ticketId}, ${user.name}, ${body})
      RETURNING *`;
    const c = rows[0];
    return created(res, { comment: { by: c.author, text: c.body, at: c.created_at.toISOString().slice(0, 16).replace('T', ' ') } });
  } catch (e) { return serverError(res, e); }
}
