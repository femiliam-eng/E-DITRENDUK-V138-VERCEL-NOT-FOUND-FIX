'use strict';
const assert=require('node:assert/strict');
const {originAllowed,csp}=require('../backend/request-security');
const origin='https://editrenduk.example.go.id';
const base={method:'POST',appOrigin:origin,isProd:true,host:'evil.example'};
assert(originAllowed({...base,origin}));
for(const forged of [undefined,null,'null','https://evil.example','https://sub.editrenduk.example.go.id','http://editrenduk.example.go.id'])
 assert(!originAllowed({...base,origin:forged}),`should deny ${forged}`);
assert(!originAllowed({...base,origin,fetchSite:'cross-site'}));
assert(!originAllowed({...base,origin,appOrigin:'http://editrenduk.example.go.id'}));
assert(!originAllowed({...base,origin,appOrigin:'https://editrenduk.example.go.id/path'}));
assert(originAllowed({...base,method:'GET',origin:undefined}));
assert(originAllowed({method:'POST',origin:undefined,host:'localhost:3000',isProd:false}));
assert(originAllowed({method:'POST',origin:'http://localhost:5500',host:'localhost:3000',isProd:false,devOrigins:['http://localhost:5500']}));
assert(!csp(true).includes('localhost'));
assert(csp(false).includes('localhost'));
console.log('PASS production origin fail-closed, subdomain CSRF guard, CSP no localhost');
