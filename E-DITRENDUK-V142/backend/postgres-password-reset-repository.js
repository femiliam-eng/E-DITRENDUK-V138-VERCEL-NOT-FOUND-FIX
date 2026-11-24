'use strict';
function createPostgresPasswordResetRepository(pool){
 if(!pool||typeof pool.query!=='function')throw new TypeError('PostgreSQL query client diperlukan');
 return Object.freeze({
  async activeIdentity(identity){
   const {rows}=await pool.query("SELECT id,username,name FROM accounts WHERE status='Aktif' AND (lower(username)=lower($1) OR lower(email)=lower($1)) LIMIT 1",[String(identity)]);return rows[0]||null;
  },
  async request(id,accountId,identity){
   const {rowCount}=await pool.query(`INSERT INTO password_reset_requests(id,account_id,requested_identity)
     SELECT $1,$2,$3 WHERE NOT EXISTS (SELECT 1 FROM password_reset_requests WHERE account_id=$2 AND status='Menunggu')
     ON CONFLICT(id) DO NOTHING`,[id,accountId,identity]);return rowCount===1;
  },
  async list(){
   const {rows}=await pool.query(`SELECT r.id,r.account_id,r.requested_identity,r.status,r.requested_at,r.resolved_at,r.resolved_by,
     a.name,a.username FROM password_reset_requests r JOIN accounts a ON a.id=r.account_id ORDER BY r.requested_at DESC LIMIT 500`);
   return rows;
  },
  async resolve(id,passwordHash,adminId){
   const client=await pool.connect();
   try{
    await client.query('BEGIN');
    const {rows}=await client.query("SELECT account_id FROM password_reset_requests WHERE id=$1 AND status='Menunggu' FOR UPDATE",[id]);
    if(!rows.length){await client.query('ROLLBACK');return false}
    await client.query('UPDATE accounts SET password_hash=$2,must_change_password=true,updated_at=now() WHERE id=$1',[rows[0].account_id,passwordHash]);
    await client.query('UPDATE auth_sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL',[rows[0].account_id]);
    await client.query("UPDATE password_reset_requests SET status='Selesai',resolved_at=now(),resolved_by=$2 WHERE id=$1",[id,adminId]);
    await client.query('COMMIT');return true;
   }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
  }
 });
}
module.exports={createPostgresPasswordResetRepository};
