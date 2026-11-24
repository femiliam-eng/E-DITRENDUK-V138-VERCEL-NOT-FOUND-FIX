'use strict';
// Production is forbidden until every HTTP route uses PostgreSQL exclusively.
// This gate deliberately cannot be overridden with an environment variable.
function assertProductionRuntime(env = process.env) {
  if (env.NODE_ENV === 'production' || env.NODE_ENV === 'staging') {
    const err = new Error('PUBLIC_DEPLOYMENT_BLOCKED: server.js masih menggunakan SQLite dan jalur hybrid. Migrasikan seluruh repository dan endpoint ke PostgreSQL, lalu lakukan uji integrasi staging sebelum deployment publik.');
    err.code = 'PRODUCTION_BLOCKED_SQLITE';
    throw err;
  }
}
module.exports = { assertProductionRuntime };
