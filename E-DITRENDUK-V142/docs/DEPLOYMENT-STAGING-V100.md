# E-DITRENDUK V100 — staging deployment operator guide

**BLOCK: Do not expose this release to public traffic.** The server still initializes SQLite and several endpoints retain SQLite access. PostgreSQL configuration flags do not make it PostgreSQL-only. No live Supabase or hosting environment has been provisioned or tested.

## Before provisioning
1. Create a Supabase project owned by the organization; enable MFA on administrative accounts and set billing alerts. Choose the region and retention policy appropriate for the institution.
2. Create a private bucket `notulen-private` with least-privilege access. Never expose the service role key to browser code, logs, or Git.
3. Choose a Node.js host supporting HTTPS, persistent storage if needed, environment secrets, health checks, and rollback. Do not expose PostgreSQL directly.
4. Generate a unique session secret using a cryptographically secure generator; store it only in hosting secrets. Do not reuse credentials between staging and production.
5. Copy `.env.staging.example` into a secure local secret manager, replace every placeholder and use the real HTTPS staging hostname for `APP_ORIGIN` and `PUBLIC_URL`.

## Engineering gate — required before deploying staging
- Finish migration of *all* routes, repositories, session/auth, audit and attachments to PostgreSQL; remove SQLite startup and file dependencies.
- Run `npm run release-check` and `node scripts/v94-deployment-audit.js` with deployment-safe variables; both must pass.
- Run schema migrations against an isolated Supabase staging database, then real integration tests: CRUD, authorization, multi-instance attachment CAS (HTTP 409), private storage and cleanup, backups and restore drill.
- Test HTTPS, cookie security, CSRF/origin checks, logs without secrets, concurrency and restart behavior.

## Backup, rollback and go-live
- Capture an encrypted database backup and private storage inventory before cutover; verify restore in staging.
- Establish a documented rollback plan (app image tag, schema compatibility, data recovery and owner approval).
- Use a temporary staging URL first; enable production DNS and HTTPS only after signed acceptance and successful restore drill.
- Never upload real personal or confidential documents to a free or unapproved staging environment.
