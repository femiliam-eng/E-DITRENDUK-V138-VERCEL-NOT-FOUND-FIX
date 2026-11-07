'use strict';
// Parameterized PostgreSQL audit persistence; independent from HTTP runtime.
function createPostgresAuditRepository(pool) {
  if (!pool || typeof pool.query !== 'function') throw new TypeError('PostgreSQL client diperlukan');
  return Object.freeze({
    async add({id,accountId=null,action,resource,resourceId=null,detail=null}) {
      if (!id || !action || !resource) throw new TypeError('id, action, resource wajib diisi');
      const {rows}=await pool.query('INSERT INTO audit_logs(id,account_id,action,resource,resource_id,detail) VALUES($1,$2,$3,$4,$5,$6::jsonb) RETURNING id,created_at',
        [String(id),accountId,String(action),String(resource),resourceId,detail===null?null:JSON.stringify(detail)]);
      return rows[0]||null;
    },
    async list({accountId=null,resource=null,limit=50,offset=0}={}) {
      const take=Math.min(200,Math.max(1,Number.isInteger(limit)?limit:50));
      const skip=Math.max(0,Number.isInteger(offset)?offset:0);
      const {rows}=await pool.query('SELECT id,account_id,action,resource,resource_id,detail,created_at FROM audit_logs WHERE ($1::text IS NULL OR account_id=$1) AND ($2::text IS NULL OR resource=$2) ORDER BY created_at DESC,id DESC LIMIT $3 OFFSET $4',[accountId,resource,take,skip]);
      return rows;
    }
  });
}
module.exports={createPostgresAuditRepository};
