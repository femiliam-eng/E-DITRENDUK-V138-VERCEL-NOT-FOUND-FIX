# V112 PostgreSQL runtime: password reset parity

Implemented unauthenticated forgot-password, superadmin reset notification/list/resolve on the PostgreSQL-only runtime. Password reset resolution uses the repository transaction to update account, revoke sessions, and close request atomically. Rate limiting is in-memory and therefore not distributed across instances.

Remaining: audit all frontend endpoints for parity, actual PostgreSQL integration, security review, storage configuration. Not production-ready. SQLite legacy runtime retained solely for compatibility/migration.
