// Seeds the database with staff, equipment and sample records.
// Usage: npm run db:seed   (safe to re-run — clears and reloads demo data)
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  console.error('✗ DATABASE_URL is not set.');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

// Every seeded account uses this password. CHANGE IT after first login in production.
const DEFAULT_PW = process.env.SEED_PASSWORD || 'dris2026';

const USERS = [
  ['omar.harbi',    'Omar Al-Harbi',      'Technologist', 'Emergency Radiology', '130994', 'alharbio@ngha.med.sa',  'Day · 07:00–19:00'],
  ['nadiyah.otaibi','Nadiyah Al-Otaibi',  'Technologist', 'Inpatient Imaging',   '130459', 'alotaibin@ngha.med.sa', 'Day · 07:00–19:00'],
  ['faisal.zahrani','Faisal Al-Zahrani',  'Technologist', 'ICU Portables',       '130643', 'alzahranif@ngha.med.sa','Night · 19:00–07:00'],
  ['hadeel.qahtani','Hadeel Al-Qahtani',  'Supervisor',   'Diagnostic Imaging',  '130652', 'alqahtanih@ngha.med.sa','Day · 07:00–17:00'],
  ['mohammed.aqeeli','Mohammed Aqeeli',   'Supervisor',   'Diagnostic Imaging',  '902887', 'aqeelim@ngha.med.sa',   'Day · 08:00–18:00'],
  ['khalid.enezi',  'Khalid Al-Enezi',    'Manager',      'Medical Imaging',     '33605',  'alenezik@ngha.med.sa',  'Admin'],
  ['sara.dosari',   'Sara Al-Dosari',     'Operations',   'Operations Command',  '31570',  'aldosaris@ngha.med.sa', 'Admin'],
];

const mkP = (n, status, dept, li, ppm, qc, bat) =>
  [`PX-${String(n).padStart(2,'0')}`, `PX-${String(n).padStart(2,'0')}`, `Portable #${n}`, 'Portable', 'Samsung GM85 Fit', `GM85-${4200+n}`, status, dept, li, ppm, qc, bat];
const mkR = (n, status, dept, li, ppm, qc) =>
  [`RM-${String(n).padStart(2,'0')}`, `RM-${String(n).padStart(2,'0')}`, `Room ${n}`, 'Room', 'Siemens Ysio Max', `YSX-${7700+n}`, status, dept, li, ppm, qc, null];

const T = new Date().toISOString().slice(0, 10);
const EQUIP = [
  mkP(2,'In Use',      'Emergency Department', T,           '2026-08-12','2026-09-01',84),
  mkP(3,'Available',   'Intensive Care Unit',  T,           '2026-08-03','2026-08-28',96),
  mkP(4,'Maintenance', 'Biomedical Workshop',  '2026-07-21','2026-07-29','2026-10-04',12),
  mkP(5,'Available',   'Neonatal ICU',         T,           '2026-09-02','2026-09-15',71),
  mkP(6,'In Use',      'Surgical Ward',        T,           '2026-08-19','2026-09-22',58),
  mkP(7,'Reserved',    'Medical Physics',      '2026-07-23','2026-08-26','2026-07-27',88),
  mkP(8,'Available',   'Orthopedics',          T,           '2026-09-09','2026-10-11',93),
  mkP(9,'Offline',     'Store — Level 1',      '2026-07-15','2026-08-05','2026-09-30',4),
  mkP(10,'Available',  'Medical Ward',         T,           '2026-08-30','2026-10-18',67),
  mkR(1,'In Use',      'Main Radiology',       T,           '2026-08-14','2026-09-05'),
  mkR(2,'Available',   'Main Radiology',       T,           '2026-08-21','2026-09-12'),
  mkR(3,'Available',   'Outpatient Wing',      T,           '2026-09-04','2026-09-19'),
  mkR(4,'Maintenance', 'Outpatient Wing',      '2026-07-22','2026-07-28','2026-10-02'),
  mkR(5,'Available',   'Emergency Wing',       T,           '2026-08-08','2026-09-26'),
  mkR(6,'Reserved',    'Medical Physics',      '2026-07-23','2026-09-16','2026-07-26'),
  mkR(7,'Available',   'Pediatrics',           T,           '2026-08-25','2026-10-09'),
];

console.log('→ Clearing existing demo data…');
await sql`TRUNCATE ticket_comments, tickets, inspections, sessions, activity, equipment, users RESTART IDENTITY CASCADE`;

console.log('→ Seeding users…');
const hash = await bcrypt.hash(DEFAULT_PW, 10);
const userIds = {};
for (const [username, name, role, dept, badge, email, shift] of USERS) {
  const rows = await sql`
    INSERT INTO users (username, password_hash, name, role, department, badge, email, shift)
    VALUES (${username}, ${hash}, ${name}, ${role}, ${dept}, ${badge}, ${email}, ${shift})
    RETURNING id`;
  userIds[name] = rows[0].id;
}

console.log('→ Seeding equipment…');
for (const [id, tag, name, kind, model, serial, status, dept, li, ppm, qc, bat] of EQUIP) {
  await sql`
    INSERT INTO equipment (id, tag, name, kind, model, serial, status, department, last_inspection, next_ppm, next_qc, battery)
    VALUES (${id}, ${tag}, ${name}, ${kind}, ${model}, ${serial}, ${status}, ${dept}, ${li}, ${ppm}, ${qc}, ${bat})`;
}

console.log('→ Seeding inspections (mixed inspectors, to prove role visibility)…');
const INSP = [
  ['PX-04','Faisal Al-Zahrani',[false,true,true], 'Generator fault code E-14 on boot. Unit removed from service.', true],
  ['RM-04','Nadiyah Al-Otaibi',[true,false,true], 'Collimator lamp intermittent, needs biomedical review.', true],
  ['PX-03','Omar Al-Harbi',    [true,true,true],  '', false],
  ['RM-01','Nadiyah Al-Otaibi',[true,true,true],  '', false],
  ['PX-09','Omar Al-Harbi',    [false,false,true],'Battery will not hold charge. Unit taken offline.', true],
];
for (const [eq, by, ans, comment, flagged] of INSP) {
  await sql`INSERT INTO inspections (equipment_id, inspector_id, inspector_name, answers, comment, flagged)
    VALUES (${eq}, ${userIds[by]}, ${by}, ${JSON.stringify(ans)}, ${comment}, ${flagged})`;
}

console.log('→ Seeding tickets…');
const TIX = [
  ['MT-2208','PX-04','Generator fault E-14','Critical','With Biomedical','Unit fails self-test at power on. Removed from clinical use.','Hadeel Al-Qahtani'],
  ['MT-2209','RM-04','Collimator lamp intermittent','High','Open','Field light cuts out after ~30s of use.','Mohammed Aqeeli'],
  ['MT-2210','PX-09','Battery will not hold charge','High','In Progress','Runtime under 20 minutes from full charge.','Hadeel Al-Qahtani'],
  ['MT-2205','PX-06','Wheel lock seized','Low','Closed','Rear left wheel lock stiff. Serviced on site.','Mohammed Aqeeli'],
];
for (const [id, eq, problem, pri, status, desc, by] of TIX) {
  await sql`INSERT INTO tickets (id, equipment_id, problem, priority, status, description, created_by)
    VALUES (${id}, ${eq}, ${problem}, ${pri}, ${status}, ${desc}, ${by})`;
}
await sql`INSERT INTO ticket_comments (ticket_id, author, body) VALUES
  ('MT-2208','Hadeel Al-Qahtani','Escalated to Biomedical Engineering, priority critical.'),
  ('MT-2208','Biomedical Engineering','Generator board ordered, ETA 4 working days.'),
  ('MT-2209','Mohammed Aqeeli','Room still usable, flagged for next PPM window.')`;

console.log('→ Seeding activity…');
await sql`INSERT INTO activity (who, what, kind) VALUES
  ('Omar Al-Harbi','completed the daily inspection for Portable #3.','inspection'),
  ('Nadiyah Al-Otaibi','started a session on Room 1.','session'),
  ('Hadeel Al-Qahtani','escalated MT-2208 to Biomedical Engineering.','ticket'),
  ('Medical Physics','scheduled QC for Portable #7 on 27 July.','qc')`;

console.log('\n✓ Seed complete.');
console.log('  Accounts (password for all): ' + DEFAULT_PW);
for (const [username, name, role] of USERS) console.log(`    ${role.padEnd(13)} ${username}`);
console.log('\n  ⚠ Change these passwords before real production use.');
