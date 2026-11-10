#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const required = ['server.js','Dockerfile','compose.yaml','scripts/production-readiness-gate.js','scripts/v92-public-url-check.js'];
const missing = required.filter(f => !fs.existsSync(path.join(root,f)));
const compose = fs.readFileSync(path.join(root,'compose.yaml'),'utf8');
const server = fs.readFileSync(path.join(root,'server.js'),'utf8');
const checks = {
  'source files present': missing.length === 0,
  'compose still pins SQLite (migration blocker)': !/DB_DRIVER:\s*sqlite\b/.test(compose),
  'server no longer opens SQLite directly (migration blocker)': !/\bopenDatabase\s*\(|new\s+(?:sqlite3\.)?Database\s*\(|require\(['"](?:better-sqlite3|sqlite3)['"]\)/.test(server),
  'production origin configured': /^https:\/\/[^/\s]+$/.test(process.env.APP_ORIGIN || '') && !/example\.|\.invalid$/.test(process.env.APP_ORIGIN || ''),
  'staging PostgreSQL configured': !!process.env.DATABASE_URL && /^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL),
  'hosting URL configured': /^https:\/\//.test(process.env.PUBLIC_URL || '')
};
console.log('V93 deployment gate — report only; never prints secrets');
for (const [name,pass] of Object.entries(checks)) console.log(`${pass?'PASS':'BLOCK'} ${name}`);
if (missing.length) console.log('Missing: '+missing.join(', '));
if (Object.values(checks).some(v=>!v)) {
 console.error('NOT READY: no public production URL or production approval.');
 process.exitCode=1;
} else console.log('Configuration prerequisites passed; live security and database tests still mandatory.');
