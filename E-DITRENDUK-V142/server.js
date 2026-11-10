'use strict';
// V137: The Node/Vercel default entrypoint must never start the legacy SQLite backend.
// Route every production request to the PostgreSQL-only HTTP function.
const handle = require('./api/index.js');
module.exports = handle;
// Local development still uses `npm start` -> server-postgres.js.
if (require.main === module) {
  require('./server-postgres').start().catch(err => {
    console.error('PostgreSQL startup failed:',err.message);
    process.exitCode=1;
  });
}
