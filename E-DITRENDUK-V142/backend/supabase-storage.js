'use strict';
const {URL}=require('node:url');
function createSupabaseStorage({url,key,bucket='notulen-private',fetchImpl=globalThis.fetch,timeoutMs=20000}={}){
 if(!url||!key)throw Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib untuk Supabase Storage');
 const base=new URL(url);
 if(base.protocol!=='https:' && !(['localhost','127.0.0.1'].includes(base.hostname)&&base.protocol==='http:'))throw Error('Supabase Storage memerlukan HTTPS');
 if(base.username||base.password||base.search||base.hash||base.pathname!=='/')throw Error('SUPABASE_URL harus URL proyek tanpa path/query');
 if(!/^[a-z0-9][a-z0-9_-]{1,62}$/i.test(bucket))throw Error('Nama bucket tidak valid');
 if(typeof fetchImpl!=='function')throw Error('fetch diperlukan');
 const api=new URL('/storage/v1/object/',base);
 function objectUrl(keyName){
  if(!/^[a-z0-9_-]{1,100}\.(pdf|docx|doc|jpg|png)$/i.test(keyName))throw Error('Object key tidak valid');
  return new URL(encodeURIComponent(bucket)+'/'+encodeURIComponent(keyName),api).toString();
 }
 async function send(method,name,body,mime){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeoutMs);
  try{
   const res=await fetchImpl(objectUrl(name),{method,headers:{
    apikey:key,Authorization:'Bearer '+key,
    ...(mime?{'Content-Type':mime,'x-upsert':'false'}:{})
   },...(body?{body}:{}),signal:ctrl.signal,redirect:'error'});
   if(!res.ok){
    // Never echo upstream body: it may contain internal project details.
    throw Error('Supabase Storage HTTP '+res.status);
   }
   return res;
  }finally{clearTimeout(timer)}
 }
 return Object.freeze({
  async put(name,bytes,mime){
   if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>6*1024*1024)throw Error('Ukuran file tidak valid');
   await send('POST',name,bytes,mime);
  },
  async get(name){
   const res=await send('GET',name);
   const bytes=Buffer.from(await res.arrayBuffer());
   if(bytes.length>6*1024*1024)throw Error('File dari storage melebihi batas');
   return bytes;
  },
  async remove(name){await send('DELETE',name)}
 });
}
module.exports={createSupabaseStorage};
