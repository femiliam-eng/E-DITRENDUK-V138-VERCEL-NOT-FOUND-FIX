# V103 — PostgreSQL cutover inventory

## Verified
- `npm run release-check` passes (automated regression tests).
- `npm run postgres-cutover-inventory-test` passes.
- `npm run postgres-cutover-inventory` exits 2 (intended: full migration not complete).
- Production runtime remains fail-closed, including when `ALLOW_SQLITE_PUBLIC` is set.

## Remaining migration work
1. Remove SQLite open and initialization from `server.js`.
2. Port 31 direct SQLite call sites to async PostgreSQL repository methods; handle transactions, seed, health, exports, notulen, and admin routes.
3. Remove 6 SQLite repository constructors after PostgreSQL implementations cover their API contracts.
4. Retire hybrid flags and legacy public override.
5. Run real PostgreSQL integration tests, storage tests, restore drill, and HTTPS staging tests.

**Do not deploy to production.** No Supabase project, hosting or public URL was provisioned by this checkpoint.
