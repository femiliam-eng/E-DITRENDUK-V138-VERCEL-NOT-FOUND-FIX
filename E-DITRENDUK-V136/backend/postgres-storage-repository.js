'use strict';
// Stores file metadata only. Physical uploads still require a durable file volume.
function createPostgresStorageRepository(pool) {
  if (!pool || typeof pool.query !== 'function') throw new TypeError('PostgreSQL client diperlukan');
  return Object.freeze({
    async add({id,resource,resourceId,fileName,storedPath,mimeType=null,sizeBytes=0}) {
      if (![id,resource,resourceId,fileName,storedPath].every(Boolean)) throw new TypeError('Metadata file tidak lengkap');
      if (!Number.isSafeInteger(sizeBytes)||sizeBytes<0) throw new RangeError('Ukuran file tidak valid');
      const {rows}=await pool.query('INSERT INTO storage_files(id,resource,resource_id,file_name,stored_path,mime_type,size_bytes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,created_at',
        [id,resource,resourceId,fileName,storedPath,mimeType,sizeBytes]);
      return rows[0]||null;
    },
    async list(resource,resourceId) {
      const {rows}=await pool.query('SELECT id,resource,resource_id,file_name,stored_path,mime_type,size_bytes,created_at FROM storage_files WHERE resource=$1 AND resource_id=$2 ORDER BY created_at DESC,id DESC',[resource,resourceId]);
      return rows;
    },
    async remove(id) {
      const {rowCount}=await pool.query('DELETE FROM storage_files WHERE id=$1',[id]);
      return rowCount>0;
    }
  });
}
module.exports={createPostgresStorageRepository};
