// GET /api/auth/me -> current user (validates the token)
import { requireAuth, ok } from '../_lib.js';

export default requireAuth(async (req, res, user) => ok(res, { user }));
