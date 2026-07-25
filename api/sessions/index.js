// ============================================================
// /api/sessions
//   GET  -> the caller's active session (or null)
//   POST -> start a session   { equipId }
//   DELETE -> end the caller's active session
//
// "One active session per user" is enforced by a partial unique
// index in the database, so the rule holds even under race conditions.
// ============================================================
import { sql, requireAuth, ok, created, badRequest, serverError, readBody } from '../_lib.js';

export default requireAuth(async (req, res, user) => {
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM sessions WHERE user_id = ${user.id} AND ended_at IS NULL LIMIT 1`;
      return ok(res, { session: rows[0] ? { equipId: rows[0].equipment_id, startedAt: rows[0].started_at } : null });
    }

    if (req.method === 'POST') {
      const { equipId } = await readBody(req);
      if (!equipId) return badRequest(res, 'equipId is required');

      // Guard: caller must not already hold an active session.
      const active = await sql`SELECT id FROM sessions WHERE user_id = ${user.id} AND ended_at IS NULL LIMIT 1`;
      if (active[0]) return badRequest(res, 'End your current session before starting another');

      // Guard: the asset must be available.
      const eq = (await sql`SELECT * FROM equipment WHERE id = ${equipId}`)[0];
      if (!eq) return badRequest(res, 'Unknown equipment');
      if (eq.status !== 'Available') return badRequest(res, 'That asset is not available');

      try {
        await sql`INSERT INTO sessions (equipment_id, user_id, user_name) VALUES (${equipId}, ${user.id}, ${user.name})`;
      } catch (err) {
        // Unique-index violation => a session was created concurrently.
        return badRequest(res, 'You already have an active session');
      }

      await sql`UPDATE equipment SET status = 'In Use', current_user_id = ${user.id} WHERE id = ${equipId}`;
      await sql`INSERT INTO activity (who, what, kind)
        VALUES (${user.name}, ${'started a session on ' + eq.name + '.'}, 'session')`;
      return created(res, { session: { equipId, startedAt: new Date().toISOString() } });
    }

    if (req.method === 'DELETE') {
      const rows = await sql`
        UPDATE sessions SET ended_at = now()
        WHERE user_id = ${user.id} AND ended_at IS NULL
        RETURNING equipment_id`;
      if (rows[0]) {
        const eqId = rows[0].equipment_id;
        await sql`UPDATE equipment SET status = 'Available', current_user_id = NULL WHERE id = ${eqId}`;
        const eq = (await sql`SELECT name FROM equipment WHERE id = ${eqId}`)[0];
        await sql`INSERT INTO activity (who, what, kind)
          VALUES (${user.name}, ${'ended the session on ' + (eq?.name || eqId) + '.'}, 'session')`;
      }
      return ok(res, { ended: true });
    }

    return badRequest(res, 'Unsupported method');
  } catch (e) { return serverError(res, e); }
});
