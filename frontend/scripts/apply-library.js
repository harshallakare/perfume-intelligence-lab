#!/usr/bin/env node
// Applies library_seed.sql using better-sqlite3 (already a project dependency)
// Usage: node scripts/apply-library.js
const Database = require('better-sqlite3');
const fs       = require('fs');
const path     = require('path');

const dbPath  = path.join(process.cwd(), 'prisma', 'pil.db');
const sqlPath = path.join(process.cwd(), 'scripts', 'library_seed.sql');

if (!fs.existsSync(dbPath))  { console.error('DB not found:', dbPath);  process.exit(1); }
if (!fs.existsSync(sqlPath)) { console.error('SQL not found:', sqlPath); process.exit(1); }

const db  = new Database(dbPath);
const sql = fs.readFileSync(sqlPath, 'utf8');

const before = db.prepare('SELECT COUNT(*) as n FROM perfume_references').get().n;
db.exec(sql);
const after  = db.prepare('SELECT COUNT(*) as n FROM perfume_references').get().n;
db.close();

console.log(`Library: ${before} → ${after} entries (+${after - before} added)`);
