# V111: PostgreSQL-only runtime (development integration candidate)

Run: `DATABASE_URL=... npm run start:postgres` after applying PostgreSQL migrations and provisioning an account. Unlike `server.js`, this entrypoint does not import or open SQLite and does not seed SQLite. No database is provisioned by this package.

Implemented routes: health/ready, login/logout/me, change password, sessions list/revoke, account admin, Agenda/Task Deadline, Agenda attachments (when private Supabase Storage is configured), unified payload modules, dashboard/bootstrap/audit, notulen submissions (when private storage is configured), and static frontend. All routes use PostgreSQL repositories or return an explicit error. No silent SQLite fallback.

Outstanding: route parity audit against all frontend API calls; PostgreSQL password reset and admin reset notifications are not yet wired into this entrypoint; upload rate limiting in this entrypoint is currently a stub (do not expose publicly); full integration and migrations against a live PostgreSQL instance, Supabase storage, concurrency and security tests. Therefore **not production ready**. The original SQLite server is retained for backwards-compatible tests and migration, not used by `start:postgres`.

`npm run postgres-only-runtime-test` runs mock-pool smoke tests only; it does not prove real PostgreSQL correctness.
