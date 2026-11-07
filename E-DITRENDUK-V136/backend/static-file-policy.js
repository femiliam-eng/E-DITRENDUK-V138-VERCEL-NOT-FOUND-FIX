'use strict';
const fs=require('node:fs');
const path=require('node:path');
const MIME=Object.freeze({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon'});
const TOP_FILES=new Set(['login.html','landing.html','index.html','monitoring.html','logbook.html','arsip.html','audit.html','diagnostics.html','jadwal.html','notulen.html','pengguna.html','rakom.html','repository.html','task-deadline.html','agenda.html','fasilitasi.html','favicon.ico','assets-logo.png']);
const ASSET_DIRS=new Set(['assets','css','js','partials']);
function resolvePublicFile(root,pathname){
 if(typeof pathname!=='string'||pathname.includes('\0')||pathname.includes('\\'))return null;
 let decoded;try{decoded=decodeURIComponent(pathname)}catch{return null}
 if(!decoded.startsWith('/')||decoded.includes('\\')||decoded.includes('\0'))return null;
 const parts=decoded.split('/').filter(Boolean);
 if(parts.some(p=>p==='.'||p==='..'||p.startsWith('.')||p.endsWith('~')))return null;
 if(parts.length===1&&!TOP_FILES.has(parts[0]))return null;
 if(parts.length>1&&!ASSET_DIRS.has(parts[0]))return null;
 if(parts.length===0)return null;
 const ext=path.extname(parts.at(-1)).toLowerCase();if(!MIME[ext])return null;
 const file=path.resolve(root,...parts);
 if(!file.startsWith(path.resolve(root)+path.sep))return null;
 // Disallow symlinks in *any* path segment to prevent leaking external files.
 let current=path.resolve(root);
 for(const part of parts){current=path.join(current,part);try{if(fs.lstatSync(current).isSymbolicLink())return null}catch{return null}}
 try{if(!fs.statSync(file).isFile())return null}catch{return null}
 return {file,mime:MIME[ext]};
}
module.exports={resolvePublicFile};
