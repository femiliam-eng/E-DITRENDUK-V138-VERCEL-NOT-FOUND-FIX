'use strict';
const assert=require('node:assert/strict');
const {originAllowed}=require('../backend/request-security');
const prev=process.env.VERCEL;
try {
 process.env.VERCEL='1';
 const base={method:'POST',fetchSite:'same-origin',isProd:true,appOrigin:'https://editrendukv138.vercel.app',vercelProductionUrl:'editrendukv136.vercel.app',vercelDeploymentUrl:'editrendukv138-branch.vercel.app'};
 assert.equal(originAllowed({...base,origin:'https://editrendukv136.vercel.app'}),true,'production alias login');
 assert.equal(originAllowed({...base,origin:'https://editrendukv138.vercel.app'}),true,'configured canonical login');
 assert.equal(originAllowed({...base,origin:'https://editrendukv138-branch.vercel.app'}),true,'deployment alias login');
 assert.equal(originAllowed({...base,origin:'https://evil.vercel.app'}),false,'reject unrecognized Vercel origin');
 assert.equal(originAllowed({...base,origin:'https://editrendukv136.vercel.app',fetchSite:'cross-site'}),false,'reject cross-site');
 assert.equal(originAllowed({...base,origin:undefined}),false,'reject missing origin');
 assert.equal(originAllowed({...base,origin:'https://editrendukv136.vercel.app.evil.com'}),false,'reject lookalikes');
 assert.equal(originAllowed({...base,origin:'https://editrendukv136.vercel.app',vercelProductionUrl:'editrendukv136.vercel.app/other'}),false,'reject incorrect configured URL path');
 process.env.VERCEL='0';
 assert.equal(originAllowed({...base,origin:'https://editrendukv136.vercel.app'}),false,'do not trust Vercel alias off-platform');
 console.log('PASS V139: trusted Vercel production/preview aliases, CSRF origin protections preserved.');
} finally { if(prev===undefined)delete process.env.VERCEL;else process.env.VERCEL=prev; }
