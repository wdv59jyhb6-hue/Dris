// ============================================================
// /api/inspections
//   GET  -> list inspections, scoped by role (PART 2 FIX)
//   POST -> submit a new inspection report
// ============================================================
import {
  sql, requireAuth, ok, created, badRequest, serverError,
  readBody, inspectionScope, serializeInspection,
} from '../_lib.js';

export default requireAuth(async (req, res, user) => {
  try {
    // ---------------- GET ----------------
    if (req.method === 'GET') {
      const scope = inspectionScope(user);
      // PART 2 FIX: Supervisors/Managers/Operations see ALL reports;
      // Technologists see only their own. The previous version filtered
      // every request to the current user, hiding technologist reports
      // from supervisors.
      const rows = scope.all
        ? await sql`SELECT * FROM inspections ORDER BY created_at DESC`
        : await sql`SELECT * FROM inspections WHERE inspector_id = ${scope.inspectorId} ORDER BY created_at DESC`;
      return ok(res, { inspections: rows.map(serializeInspection) });
    }

    // ---------------- POST ----------------
    if (req.method === 'POST') {
      const { equipId, answers, comment } = await readBody(req);
      if (!equipId || !Array.isArray(answers) || answers.length !== 3)
        return badRequest(res, 'equipId and three answers are required');

      const flagged = answers.some((a) => a === false);
      const rows = await sql`
        INSERT INTO inspections (equipment_id, inspector_id, inspector_name, answers, comment, flagged)
        VALUES (${equipId}, ${user.id}, ${user.name}, ${JSON.stringify(answers)}, ${comment || ''}, ${flagged})
        RETURNING *`;

      // Mark the asset inspected today.
      await sql`UPDATE equipment SET last_inspection = CURRENT_DATE WHERE id = ${equipId}`;

      // Activity feed.
      const eq = (await sql`SELECT name FROM equipment WHERE id = ${equipId}`)[0];
      await sql`INSERT INTO activity (who, what, kind)
        VALUES (${user.name}, ${'completed the daily inspection for ' + (eq?.name || equipId) + '.'}, 'inspection')`;

      return created(res, { inspection: serializeInspection(rows[0]) });
    }

    return badRequest(res, 'Unsupported method');
  } catch (e) { return serverError(res, e); }
});
