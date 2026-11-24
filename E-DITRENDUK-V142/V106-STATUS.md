# E-DITRENDUK V106 — Deduplication checkpoint

- Removed `assets-logo.png` because it was byte-identical to `assets/logo-bkkbn.png` and no references to the root filename were found in the application entry points checked.
- Added `npm run duplicate-source-audit`, a SHA-256 audit that reports remaining byte-identical project files.
- PostgreSQL-only migration is **NOT COMPLETE**. `backend/database.js` still opens `node:sqlite`; `server.js` still initializes SQLite repositories and executes SQLite queries. Do not deploy publicly.
- A real PostgreSQL/Supabase instance is still required for end-to-end validation.
