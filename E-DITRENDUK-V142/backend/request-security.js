'use strict';
// Production requests must come from the explicitly configured canonical origin.
// Do not derive a security boundary from untrusted Host/X-Forwarded-* headers.
function canonicalHttpsOrigin(value) {
  try {
    const url = new URL(String(value || '').startsWith('https://') ? String(value) : `https://${value}`);
    if (url.protocol !== 'https:' || !url.hostname || url.pathname !== '/' || url.search || url.hash || url.username || url.password) return null;
    return url.origin;
  } catch { return null; }
}
// V139: Vercel's system-provided production/branch/deployment URLs are trusted
// configuration values, unlike incoming Host or X-Forwarded-Host headers.
// This supports a stable production domain even if APP_ORIGIN was configured
// for an older deployment, without accepting arbitrary cross-origin requests.
function originAllowed({method,origin,fetchSite,appOrigin,isProd,host,devOrigins=[],vercelProductionUrl,vercelDeploymentUrl,vercelBranchUrl}) {
  if (['GET','HEAD','OPTIONS'].includes(method)) return true;
  if(fetchSite==='cross-site')return false;
  if(isProd){
    const canonical=canonicalHttpsOrigin(appOrigin);
    if(!canonical)return false;
    const accepted=new Set([canonical]);
    if(process.env.VERCEL==='1'){
      for(const candidate of [vercelProductionUrl,vercelDeploymentUrl,vercelBranchUrl]) {
        const normalized=canonicalHttpsOrigin(candidate);
        // System deployment aliases must belong to Vercel's own HTTPS domain.
        if(normalized && new URL(normalized).hostname.endsWith('.vercel.app'))accepted.add(normalized);
      }
    }
    return typeof origin==='string' && accepted.has(origin);
  }
  const expected=`http://${host}`;
  return !origin||origin===expected||devOrigins.includes(origin);
}
function csp(isProd){
  const connect=isProd?"'self'":"'self' http://localhost:3000 http://127.0.0.1:3000";
  return `default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src ${connect}; frame-ancestors 'self'; base-uri 'self'; form-action 'self'`;
}
module.exports={originAllowed,csp};
