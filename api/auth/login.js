// POST /api/auth/login  { username, password } -> { token, user }
import { sql, signToken, checkPassword, ok, badRequest, unauthorized, serverError, readBody } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return badRequest(res, 'Use POST');
  try {
    const { username, password } = await readBody(req);
    if (!username || !password) return badRequest(res, 'Username and password are required');

    const rows = await sql`SELECT * FROM users WHERE username = ${username.toLowerCase()} LIMIT 1`;
    const user = rows[0];
    if (!user) return unauthorized(res);

    const good = await checkPassword(password, user.password_hash);
    if (!good) return unauthorized(res);

    const token = signToken(user);
    const { password_hash, ...safe } = user;
    return ok(res, { token, user: safe });
  } catch (e) { return serverError(res, e); }
}
