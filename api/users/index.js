// GET /api/users -> all users (Manager and above only)
import { sql, requireAuth, ok, serverError } from '../_lib.js';

export default requireAuth(async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, name, role, department, badge, email, shift, status
      FROM users ORDER BY role, name`;
    return ok(res, { users: rows });
  } catch (e) { return serverError(res, e); }
}, 'Manager'); // minimum role enforced by requireAuth
