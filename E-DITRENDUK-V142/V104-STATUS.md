# V104 — Fail-closed staging guard

Implemented: `NODE_ENV=staging` now fails closed at process startup, just like production, because the server still opens SQLite and mixes database backends. Expanded tests cover staging, including attempted PostgreSQL feature-flag bypass.

This is a safety change, **not** a PostgreSQL migration. Existing development/test workflows remain available locally. Production and staging must not be deployed yet.

Next engineering work: replace SQLite initialization, direct SQL routes and legacy repositories with asynchronous PostgreSQL-only code, then run integration tests against a real PostgreSQL instance and private object storage.
