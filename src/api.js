// ============================================================
// DRIS — frontend API client
// Thin wrapper over fetch that attaches the auth token and
// talks to the /api serverless functions.
// ============================================================

const TOKEN_KEY = 'dris_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  me: () => request('/auth/me'),

  // equipment
  equipment: () => request('/equipment'),

  // inspections (GET is role-scoped on the server)
  inspections: () => request('/inspections'),
  submitInspection: (equipId, answers, comment) =>
    request('/inspections', { method: 'POST', body: { equipId, answers, comment } }),

  // tickets
  tickets: () => request('/tickets'),
  createTicket: (payload) => request('/tickets', { method: 'POST', body: payload }),
  commentTicket: (ticketId, body) => request('/tickets/comment', { method: 'POST', body: { ticketId, body } }),

  // sessions
  session: () => request('/sessions'),
  startSession: (equipId) => request('/sessions', { method: 'POST', body: { equipId } }),
  endSession: () => request('/sessions', { method: 'DELETE' }),

  // misc
  activity: () => request('/activity'),
  users: () => request('/users'),
};
