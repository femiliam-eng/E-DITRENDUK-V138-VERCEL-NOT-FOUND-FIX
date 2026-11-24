'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
function createLocalPrivateStorage({directory}={}){
 if(!directory||!path.isAbsolute(directory))throw Error('Direktori private storage harus absolut');
 function target(name){if(!/^[a-z0-9_-]{1,100}\.(pdf|docx|doc|jpg|png)$/i.test(name))throw Error('Nama file privat tidak valid');return path.join(directory,name);}
 async function prepare(){await fs.mkdir(directory,{recursive:true,mode:0o700});}
 return Object.freeze({
  async put(name,bytes){if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>6*1024*1024)throw Error('Ukuran file tidak valid');await prepare();await fs.writeFile(target(name),bytes,{flag:'wx',mode:0o600});},
  async get(name){const bytes=await fs.readFile(target(name));if(bytes.length>6*1024*1024)throw Error('File terlalu besar');return bytes;},
  async remove(name){await fs.unlink(target(name));}
 });
}
module.exports={createLocalPrivateStorage};
