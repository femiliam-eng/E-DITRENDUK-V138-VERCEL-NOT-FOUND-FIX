'use strict';
// V28: audit persistence and paginated search isolated from HTTP.
function createAuditRepository(db) {
  if (!db || typeof db.prepare !== 'function') throw new TypeError('Database wajib mendukung prepare()');
  return Object.freeze({
    record({id,accountId,action,resource,resourceId,detail}) {
      return db.prepare('INSERT INTO audit_logs(id,account_id,action,resource,resource_id,detail) VALUES(?,?,?,?,?,?)').run(id,accountId||null,action,resource,resourceId||null,JSON.stringify(detail||{}));
    },
    search({q='',action='',resource='',page=1,limit=25}={}) {
      const p=Math.max(1,Math.floor(Number(page)||1));
      const n=Math.min(100,Math.max(10,Math.floor(Number(limit)||25)));
      const where=[],params=[];
      if(q){where.push('(a.name LIKE ? OR l.action LIKE ? OR l.resource LIKE ? OR l.resource_id LIKE ? OR l.detail LIKE ?)');for(let i=0;i<5;i++)params.push(`%${q}%`);}
      if(action){where.push('l.action=?');params.push(action);}
      if(resource){where.push('l.resource=?');params.push(resource);}
      const clause=where.length?` WHERE ${where.join(' AND ')}`:'';
      const total=db.prepare(`SELECT COUNT(*) total FROM audit_logs l LEFT JOIN accounts a ON a.id=l.account_id${clause}`).get(...params).total;
      const rows=db.prepare(`SELECT l.*,a.name account_name,a.username FROM audit_logs l LEFT JOIN accounts a ON a.id=l.account_id${clause} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`).all(...params,n,(p-1)*n);
      return {rows,pagination:{page:p,limit:n,total,pages:Math.max(1,Math.ceil(total/n))}};
    },
    recentByAccount(accountId,limit=5) {
      const n=Math.min(100,Math.max(1,Math.floor(Number(limit)||5)));
      return db.prepare('SELECT action,resource,resource_id,created_at FROM audit_logs WHERE account_id=? ORDER BY created_at DESC LIMIT ?').all(accountId,n);
    }
  });
}
module.exports={createAuditRepository};
