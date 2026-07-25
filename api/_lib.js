// ============================================================
// DRIS — shared backend library
// DB client, JWT auth, role permissions, helpers.
// Imported by every /api serverless function.
// ============================================================
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ---------- Database ----------
// DATABASE_URL is a Neon pooled connection string (see .env.example).
export const sql = neon(process.env.DATABASE_URL);

// ---------- Roles ----------
export const LEVEL = { Technologist: 1, Supervisor: 2, Manager: 3, Operations: 4 };
export const atLeast = (role, min) => (LEVEL[role] || 0) >= (LEVEL[min] || 99);

// ============================================================
// PART 2 FIX — inspection visibility by role.
//
// The original bug: a Supervisor could not see reports created by
// a Technologist. Root cause is a permission/filter decision, so it
// lives here in one place and is unit-testable.
//
// Rule:
//   - Technologist: sees ONLY their own inspection reports.
//   - Supervisor / Manager / Operations: see ALL reports.
// ============================================================
export function inspectionScope(user) {
  if (atLeast(user.role, 'Supervisor')) return { all: true };
  return { all: false, inspectorId: user.id };
}

// ---------- Auth ----------
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = '12h';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, name: user.name, role: user.role,
      department: user.department, badge: user.badge, email: user.email, shift: user.shift },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

export function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const checkPassword = (pw, hash) => bcrypt.compare(pw, hash);

// Pull the current user from the Authorization: Bearer <token> header.
// Returns the decoded user or null.
export function getUser(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

// ---------- HTTP helpers ----------
export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}
export const ok = (res, body) => json(res, 200, body);
export const created = (res, body) => json(res, 201, body);
export const badRequest = (res, msg) => json(res, 400, { error: msg });
export const unauthorized = (res) => json(res, 401, { error: 'Not authenticated' });
export const forbidden = (res, msg = 'You do not have permission to do that') => json(res, 403, { error: msg });
export const notFound = (res, msg = 'Not found') => json(res, 404, { error: msg });
export const serverError = (res, e) => { console.error(e); json(res, 500, { error: 'Server error' }); };

// Wrap a handler so it always requires a valid token, and optionally a min role.
export function requireAuth(handler, minRole) {
  return async (req, res) => {
    const user = getUser(req);
    if (!user) return unauthorized(res);
    if (minRole && !atLeast(user.role, minRole)) return forbidden(res);
    return handler(req, res, user);
  };
}

// Parse JSON body (Vercel gives req.body already-parsed in most runtimes,
// but we guard for the raw-string case).
export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}

// ---------- Serialisers (snake_case DB -> camelCase client) ----------
export const serializeEquip = (r) => ({
  id: r.id, tag: r.tag, name: r.name, kind: r.kind, model: r.model, serial: r.serial,
  status: r.status, user: r.current_user_name || null, dept: r.department,
  lastInspection: r.last_inspection ? r.last_inspection.toISOString().slice(0, 10) : null,
  nextPPM: r.next_ppm ? r.next_ppm.toISOString().slice(0, 10) : null,
  nextQC: r.next_qc ? r.next_qc.toISOString().slice(0, 10) : null,
  battery: r.battery,
});
export const serializeInspection = (r) => ({
  id: r.id, equipId: r.equipment_id, inspectorId: r.inspector_id, by: r.inspector_name,
  answers: r.answers, comment: r.comment, flagged: r.flagged,
  date: r.created_at ? r.created_at.toISOString().slice(0, 10) : null,
});
export const serializeTicket = (r) => ({
  id: r.id, equipId: r.equipment_id, problem: r.problem, priority: r.priority,
  status: r.status, description: r.description, createdBy: r.created_by,
  date: r.created_at ? r.created_at.toISOString().slice(0, 10) : null,
  comments: r.comments || [],
});
