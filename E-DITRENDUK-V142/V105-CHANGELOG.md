# V105 — Hybrid database readiness correction

- `/api/ready` now returns HTTP 503 when SQLite `PRAGMA quick_check` reports corruption, instead of HTTP 200 with `ok:false`.
- Extracted database readiness into `backend/database-readiness.js`, testing SQLite and PostgreSQL in hybrid mode.
- Added unit coverage for healthy SQLite, healthy hybrid, corrupt SQLite, absent PostgreSQL pool and failed PostgreSQL connection.
- Production and staging remain intentionally blocked. This is **not** a PostgreSQL-only migration.
- `npm run release-check` passed before wiring the new test into its command; the new test also passed independently.

Next: migrate remaining SQLite repositories and routes, then run integration tests against real PostgreSQL and Supabase staging.
