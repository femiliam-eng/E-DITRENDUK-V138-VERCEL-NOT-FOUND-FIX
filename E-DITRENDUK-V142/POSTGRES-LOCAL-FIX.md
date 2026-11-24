# PostgreSQL-only local runtime fix

- Local Windows runtime now supports private file uploads without Supabase credentials; no SQLite is loaded by `server-postgres.js`.
- Private files are stored in `backend/data/private-uploads` (or `PRIVATE_STORAGE_DIR`), never served by the static-file route.
- Production does not enable local storage automatically; configure Supabase Storage before deployment.
- Startup now prints `http://localhost:3000/login.html` after listening, and reports port conflicts.
- Test: `node scripts/local-private-storage-test.js`.
- Important: SQLite data import and successful login were confirmed on the user's Windows machine; this package does not access or re-import the user's PostgreSQL database. Existing legacy notulen files may require a separate attachment-file migration; database rows alone do not move file bytes.
