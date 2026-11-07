'use strict';
// Production requests must come from the explicitly configured canonical origin.
// Do not derive a security boundary from untrusted Host/X-Forwarded-* headers.
function originAllowed({method,origin,fetchSite,appOrigin,isProd,host,devOrigins=[]}) {
  if (['GET','HEAD','OPTIONS'].includes(method)) return true;
  if(fetchSite==='cross-site')return false;
  if(isProd){
    if(!appOrigin)return false;
    let canonical;
    try { const u=new URL(appOrigin);if(u.protocol!=='https:'||u.pathname!=='/'||u.search||u.hash||u.username||u.password)return false;canonical=u.origin; }
    catch{return false}
    // Browser fetches from this app send Origin on unsafe requests; deny missing Origin
    // to prevent cross-site form submission and forged same-site subdomain requests.
    return origin===canonical;
  }
  const expected=`http://${host}`;
  return !origin||origin===expected||devOrigins.includes(origin);
}
function csp(isProd){
  const connect=isProd?"'self'":"'self' http://localhost:3000 http://127.0.0.1:3000";
  return `default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src ${connect}; frame-ancestors 'self'; base-uri 'self'; form-action 'self'`;
}
module.exports={originAllowed,csp};
