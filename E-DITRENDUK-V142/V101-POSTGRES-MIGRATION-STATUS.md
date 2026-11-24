# V101 — PostgreSQL migration: verified blockers

**Status: NOT FULLY MIGRATED. DO NOT DEPLOY TO PRODUCTION.**

The PostgreSQL repositories, schema and hybrid route handlers already exist, but `server.js` still opens SQLite unconditionally, initializes six legacy repositories and uses direct synchronous SQLite statements. Turning on PG_PRIMARY_* does not make the runtime PostgreSQL-only. Existing production guardrails intentionally reject hybrid mode.

## Implemented in this checkpoint
- `scripts/postgres-full-migration-gate.js`: repeatable, source-derived fail-closed assessment (exit 2 on remaining blockers).
- `scripts/postgres-full-migration-gate-test.js`: positive/negative assertions.
- npm commands `postgres-full-migration-gate` and `postgres-full-migration-gate-test`.

## Required engineering sequence
1. Extract startup/seed/migrations from HTTP entrypoint; run versioned PostgreSQL migrations before starting requests.
2. Replace all SQLite account, session, password-reset, audit, meeting, storage and notulen fallback paths with async PostgreSQL repositories. Preserve authorization and transactional guarantees.
3. Replace direct `db.prepare`, `db.exec` and SQLite health, admin, export and bootstrap routes. Do not use a synchronous emulation layer.
4. Remove hybrid feature flags, demo seeding and SQLite production bypass; make DATABASE_URL mandatory for PostgreSQL-only mode.
5. Add isolated PostgreSQL integration tests for every route and concurrent CAS, then exercise real Supabase private bucket upload/download and rollback.
6. Verify data parity, least privilege, backup/restore, migrations, TLS and staging smoke before production.

No PostgreSQL instance or Supabase credentials are available in this environment, so live validation has NOT occurred. A green offline regression test is not proof of a successful migration.
