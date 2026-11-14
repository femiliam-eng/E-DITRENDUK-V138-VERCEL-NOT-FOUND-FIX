#!/usr/bin/env node
'use strict';
// Both phases are mandatory for live acceptance. No mutations except revoking test sessions.
const {run:infrastructure}=require('./v126-employee-go-live-gate');
const {run:authentication}=require('./v127-employee-login-smoke');
async function run(env=process.env,options={}){
 const infra=await infrastructure(env,options);
 if(!infra.ok)return {ok:false,stage:'infrastructure-and-accounts',infrastructure:infra};
 const auth=await authentication(env,options);
 return {ok:auth.ok,stage:auth.ok?'technical-acceptance-passed':'authenticated-roles',infrastructure:{ok:true,stage:infra.stage},authentication:auth,note:'Technical gate is not user acceptance testing or permission to publish real employee data.'};
}
if(require.main===module)run().then(r=>{console.log(JSON.stringify(r,null,2));if(!r.ok)process.exitCode=1;}).catch(()=>{console.error('FAIL: penerimaan teknis belum lulus.');process.exitCode=1;});
module.exports={run};
