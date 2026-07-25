// GET /api/activity -> recent activity feed (any authenticated user)
import { sql, requireAuth, ok, serverError } from '../_lib.js';

export default requireAuth(async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM activity ORDER BY created_at DESC LIMIT 30`;
    const items = rows.map((r) => {
      const mins = Math.round((Date.now() - new Date(r.created_at).getTime()) / 60000);
      const at = mins < 1 ? 'now' : mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.round(mins / 60)}h` : 'Yesterday';
      return { id: r.id, who: r.who, what: r.what, type: r.kind, at };
    });
    return ok(res, { activity: items });
  } catch (e) { return serverError(res, e); }
});
