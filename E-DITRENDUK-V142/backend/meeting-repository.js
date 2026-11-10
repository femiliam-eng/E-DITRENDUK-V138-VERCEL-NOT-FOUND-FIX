'use strict';
// V29: database operations for meeting notes. The caller owns physical file cleanup.
function createMeetingRepository(db) {
  if (!db || typeof db.prepare !== 'function' || typeof db.exec !== 'function') throw new TypeError('Database wajib mendukung prepare() dan exec()');
  const list = () => db.prepare('SELECT * FROM meetings ORDER BY created_at DESC').all();
  function detail(id) {
    const meeting = db.prepare('SELECT * FROM meetings WHERE id=?').get(id);
    if (!meeting) return null;
    meeting.participants = JSON.parse(meeting.participants || '[]');
    const sections = db.prepare('SELECT * FROM meeting_sections WHERE meeting_id=? ORDER BY section_order').all(id).map(sec => ({
      ...sec, notes: db.prepare('SELECT * FROM meeting_notes WHERE section_id=? ORDER BY note_order').all(sec.id)
    }));
    const documentation = db.prepare('SELECT id,file_name,data_url,photo_order FROM meeting_documentation WHERE meeting_id=? ORDER BY photo_order').all(id).map(p => ({...p, url:p.data_url}));
    return {...meeting, sections, documentation};
  }
  function create({id, body:b, accountId, makeId, saveImage, cleanFileName}) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(`INSERT INTO meetings(id,topic,team,meeting_date,meeting_time,place,leader,notulis,checked_by,approved_by,approval_date,participants,status,created_by)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,b.topic||'Rapat',b.team||'',b.meetingDate||'',b.meetingTime||'',b.place||'',b.leader||'',b.notulis||'',b.checkedBy||'',b.approvedBy||'',b.approvalDate||'',JSON.stringify(b.participants||[]),b.status||'Draf',accountId);
      (b.sections||[]).forEach((section,si) => {
        const sid=makeId('sec');
        db.prepare('INSERT INTO meeting_sections(id,meeting_id,section_order,title) VALUES(?,?,?,?)').run(sid,id,si,section.title||`Bagian ${si+1}`);
        (section.notes||[]).forEach((n,ni)=>db.prepare('INSERT INTO meeting_notes(id,section_id,speaker,organization,body,note_order) VALUES(?,?,?,?,?,?)').run(makeId('note'),sid,n.speaker||'',n.organization||'',n.body||'',ni));
      });
      (b.documentation||[]).slice(0,20).forEach((photo,pi)=>{
        const fileName=cleanFileName(photo.fileName||`foto-${pi+1}`);
        const storedUrl=saveImage(photo.dataUrl,fileName,id,pi);
        db.prepare('INSERT INTO meeting_documentation(id,meeting_id,file_name,data_url,photo_order) VALUES(?,?,?,?,?)').run(makeId('photo'),id,fileName,storedUrl,pi);
      });
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    return {id};
  }
  return Object.freeze({list, detail, create});
}
module.exports={createMeetingRepository};
