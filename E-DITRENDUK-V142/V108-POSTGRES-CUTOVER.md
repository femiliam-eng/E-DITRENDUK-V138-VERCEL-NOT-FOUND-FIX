# V108 PostgreSQL cutover status

## Implemented
- Removed a second MIME-to-extension mapping in the legacy notulen upload path; both legacy and PostgreSQL use `postgres-notulen-handler.validate()` and its `ext` result.
- Full `npm run release-check` passed in this checkpoint.

## Remaining blockers (do not deploy publicly)
- `server.js` unconditionally opens SQLite and creates SQLite repositories.
- SQLite startup migrations/seeding and direct SQL calls remain.
- Auth, account, agenda, audit, notulen and other route branches still have SQLite implementations.
- PostgreSQL staging database and private object storage are not provisioned; no live integration tests have been run.

## Cutover order
1. Build PostgreSQL bootstrap/migrations with rollback and tested backup/restore.
2. Move all remaining route handlers and authentication/session operations to PostgreSQL repositories.
3. Remove unconditional SQLite startup and legacy SQL, and make PostgreSQL connection mandatory.
4. Run end-to-end integration tests on a real PostgreSQL instance, including concurrent attachments, auth, permissions and file rollback.
5. Only after those pass, replace the staging/production fail-closed gate and deploy HTTPS.

Do not claim PostgreSQL-only until static inspection AND live integration tests pass.
