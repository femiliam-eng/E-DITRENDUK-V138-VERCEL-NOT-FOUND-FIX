'use strict';
// V28: storage metadata only. Physical file writes/deletes remain in server.js.
function createStorageRepository(db) {
  if (!db || typeof db.prepare !== 'function') throw new TypeError('Database wajib mendukung prepare()');
  return Object.freeze({
    save({id,resource,resourceId,fileName,storedPath,mimeType,sizeBytes}) {
      return db.prepare('INSERT OR REPLACE INTO storage_files(id,resource,resource_id,file_name,stored_path,mime_type,size_bytes) VALUES(?,?,?,?,?,?,?)').run(id,resource,resourceId,fileName,storedPath,mimeType,sizeBytes);
    },
    removeByPath(storedPath) {return db.prepare('DELETE FROM storage_files WHERE stored_path=?').run(storedPath);},
    removeByResource(resource,resourceId) {return db.prepare('DELETE FROM storage_files WHERE resource=? AND resource_id=?').run(resource,resourceId);},
    list() {return db.prepare('SELECT * FROM storage_files ORDER BY created_at DESC').all();},
    usage() {return db.prepare('SELECT stored_path,size_bytes FROM storage_files').all();}
  });
}
module.exports={createStorageRepository};
