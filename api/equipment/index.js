// GET /api/equipment -> all equipment (any authenticated user)
import { sql, requireAuth, ok, serverError, serializeEquip } from '../_lib.js';

export default requireAuth(async (req, res) => {
  try {
    const rows = await sql`
      SELECT e.*, u.name AS current_user_name
      FROM equipment e
      LEFT JOIN users u ON u.id = e.current_user_id
      ORDER BY e.kind DESC, e.id ASC`;
    return ok(res, { equipment: rows.map(serializeEquip) });
  } catch (e) { return serverError(res, e); }
});
