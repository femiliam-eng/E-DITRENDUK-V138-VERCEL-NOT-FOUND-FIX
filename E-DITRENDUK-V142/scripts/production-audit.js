'use strict';
// Pemeriksaan statis konfigurasi rilis; tidak menggantikan pentest atau uji browser.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const issues = [];
const compose = fs.readFileSync(path.join(root, 'compose.yaml'), 'utf8');
const docker = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8');
const env = fs.readFileSync(path.join(root, '.env.production.example'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const pkg = require(path.join(root, 'package.json'));
function check(condition, message) { if (!condition) issues.push(message); else console.log('OK:', message); }
check(compose.includes('127.0.0.1:${APP_PORT:-3000}:3000'), 'Port aplikasi hanya terikat loopback host');
check(compose.includes('editrenduk_data:/app/backend/data') && compose.includes('editrenduk_uploads:/var/lib/editrenduk/notulen'), 'Data SQLite dan upload memakai volume persisten');
check(compose.includes("profiles: ['postgres-tools']"), 'PostgreSQL terpisah sebagai tool migrasi, bukan runtime palsu');
check(docker.includes('USER node'), 'Docker berjalan sebagai non-root');
check(env.includes('SESSION_SECRET=') && env.includes('APP_ORIGIN='), 'Contoh environment produksi tersedia');
check(server.includes('SESSION_SECRET wajib diatur'), 'Server menolak secret production yang tidak diatur');
check(pkg.scripts['verify-backup'] && pkg.scripts['production-audit'], 'Perintah audit dan verifikasi backup tersedia');
check(fs.readFileSync(path.join(root, '.gitignore'),'utf8').split(/\r?\n/).includes('.env') && fs.readFileSync(path.join(root, '.dockerignore'),'utf8').includes('.env'), 'File .env privat dikecualikan dari Git dan Docker build');
if (issues.length) { console.error('AUDIT GAGAL:', issues.join('; ')); process.exit(1); }
console.log('Audit konfigurasi statis V16 LULUS. PostgreSQL runtime dan deployment publik BELUM diuji.');
