// Runs db/schema.sql against DATABASE_URL. Idempotent.
// Usage: npm run db:migrate
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('✗ DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schema = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf8');

// Split on semicolons that end a statement. The schema uses DO $$ ... $$ blocks,
// so we split carefully on ";\n" boundaries outside of dollar-quotes.
function splitStatements(text) {
  const out = [];
  let buf = '';
  let inDollar = false;
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.includes('$$')) inDollar = !inDollar || (line.split('$$').length - 1) % 2 === 0 ? inDollar : inDollar;
    // simpler: toggle on each $$ occurrence
    const dollars = (line.match(/\$\$/g) || []).length;
    if (dollars % 2 === 1) inDollar = !inDollar;
    buf += line + '\n';
    if (!inDollar && line.trim().endsWith(';')) { out.push(buf); buf = ''; }
  }
  if (buf.trim()) out.push(buf);
  return out.filter((s) => s.trim() && !s.trim().startsWith('--'));
}

const statements = splitStatements(schema);

console.log(`→ Applying ${statements.length} statements to the database…`);
for (const stmt of statements) {
  try {
    await sql.query(stmt);
  } catch (e) {
    console.error('✗ Failed on statement:\n', stmt.slice(0, 120), '…\n', e.message);
    process.exit(1);
  }
}
console.log('✓ Migration complete. All tables are ready.');
