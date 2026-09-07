import test from 'node:test';
import assert from 'node:assert/strict';
import {guarded,discover,execute,assertVerification,runPlan} from './lib.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {segments,covered} from './geometry.mjs';
import {transformSource} from './source.mjs';
test('Wrong project is rejected before mutation',async()=>{
 const AsyncFunction=Object.getPrototypeOf(async()=>{}).constructor;
 let changed=false;const eda={dmt_SelectControl:{getCurrentDocumentInfo:async()=>({parentProjectUuid:'wrong',uuid:'page',documentType:1})},mutate:()=>{changed=true;}};
 await assert.rejects(new AsyncFunction('eda',guarded('eda.mutate();','project','page'))(eda),/guard rejected/);assert.equal(changed,false);
});
test('Document change during operation is detected',async()=>{
 const AsyncFunction=Object.getPrototypeOf(async()=>{}).constructor;let calls=0;
 const eda={dmt_SelectControl:{getCurrentDocumentInfo:async()=>({parentProjectUuid:'project',uuid:++calls===1?'page':'other',documentType:1})}};
 await assert.rejects(new AsyncFunction('eda',guarded('return true;','project','page'))(eda),/guard rejected/);
});
test('Transport success with EDA error is failure',async()=>{
 await assert.rejects(execute({base:'http://localhost',windowId:'w'},'return 1',async()=>({ok:true,json:async()=>({success:true,result:{error:'not saved'}})})),/not saved/);
});
test('Failed or empty independent verification cannot pass',()=>{
 for(const v of [true,{ok:true,checks:[]},{ok:true,checks:[{pass:false}]},{ok:false,checks:[{pass:true}]}])assert.throws(()=>assertVerification(v));
 assert.doesNotThrow(()=>assertVerification({ok:true,checks:[{pass:true}]}));
});
test('Port discovery verifies identity and rejects multiple windows',async()=>{
 const mock=async url=>({ok:true,json:async()=>url.endsWith('/eda-windows')?{windows:[{connected:true},{connected:true}]}:url.includes(':49623/')?{service:'easyeda-bridge',edaConnected:true,pendingRequests:0}:{service:'unrelated'}});
 await assert.rejects(discover(mock),/window; found 2/);
});
test('Wire paths become independent orthogonal segments without duplicates',()=>{
 assert.deepEqual(segments([[[0,0],[0,10],[10,10]],[[10,10],[0,10]],[[0,0],[0,0]]]),[[0,0,0,10],[0,10,10,10]]);
 assert.throws(()=>segments([[[0,0],[1,1]]]),/Diagonal/);
 assert.throws(()=>segments([[[0,0],[NaN,1]]]),/Invalid/);
});
test('Partial-operation recovery recognizes merged and split wires',()=>{
 assert.equal(covered([0,0,20,0],[[0,0,10,0],[20,0,10,0]]),true);
 assert.equal(covered([0,0,20,0],[[0,0,9,0],[20,0,10,0]]),false);
 assert.equal(covered([0,0,0,20],[[0,-10,0,30]]),true);
 assert.equal(covered([0,0,0,20],[[1,0,1,20]]),false);
});
test('Source transform preserves CRLF and final record terminator',()=>{
 const original='{"type":"TEXT","id":"a"}||{"y":1}|\r\n{"type":"TEXT","id":"b"}||{"y":2}';
 const next=transformSource(original,(h,b)=>({...b,y:b.y+30}));
 assert.equal(next,'{"type":"TEXT","id":"a"}||{"y":31}|\r\n{"type":"TEXT","id":"b"}||{"y":32}');
 assert.equal(transformSource(original,()=>undefined),original);
 const tombstone='{"type":"LINE","id":"deleted"}|||';
 assert.equal(transformSource(tombstone,()=>{throw Error('Must not transform tombstones');}),tombstone);
});
async function fixture(t,expectedHash){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'eda-verified-test-'));
 t.after(async()=>{
  const resolved=await fs.realpath(root),parent=await fs.realpath(os.tmpdir());
  if(path.dirname(resolved)!==parent||!path.basename(resolved).startsWith('eda-verified-test-'))throw Error('Unexpected test cleanup target');
  await fs.rm(resolved,{recursive:true,force:true});
 });
 const p={name:'fixture',projectUuid:'project',pageUuid:'page',script:'apply.js',verifyScript:'verify.js',expectedBeforeSha256:expectedHash};
 await fs.writeFile(path.join(root,'plan.json'),JSON.stringify(p));await fs.writeFile(path.join(root,'apply.js'),'return "MUTATION_MARKER";');await fs.writeFile(path.join(root,'verify.js'),'return "VERIFY_MARKER";');
 let writes=0,reads=0;
 const fetcher=async(url,options={})=>{
  let v;
  if(url.endsWith('/health'))v=url.includes(':49620/')?{service:'easyeda-bridge',edaConnected:true,pendingRequests:0}:{service:'other'};
  else if(url.endsWith('/eda-windows'))v={windows:[{connected:true,windowId:'w'}]};
  else{const code=JSON.parse(options.body).code;
   if(code.includes('MUTATION_MARKER')){writes++;v={success:true,result:{saved:true}};}
   else if(code.includes('VERIFY_MARKER')){reads++;v={success:true,result:{ok:reads>1,checks:[{name:'eventual persisted state',pass:reads>1}]}};}
   else v={success:true,result:{source:'baseline',document:{uuid:'page',parentProjectUuid:'project'}}};
  }
  return {ok:true,json:async()=>v};
 };
 return {root,fetcher,stats:()=>({writes,reads})};
}
test('Workflow writes once while retrying only independent verification',async t=>{
 const f=await fixture(t);const r=await runPlan(path.join(f.root,'plan.json'),'apply',{fetcher:f.fetcher,stateRoot:path.join(f.root,'state')});
 assert.equal(r.status,'verified');assert.deepEqual(f.stats(),{writes:1,reads:2});
 const report=JSON.parse(await fs.readFile(path.join(r.directory,'report.json'),'utf8'));assert.equal(report.verificationAttempts,2);assert.equal(report.status,'verified');
});
test('Changed source rejects stale plan without submitting mutation',async t=>{
 const f=await fixture(t,'stale');await assert.rejects(runPlan(path.join(f.root,'plan.json'),'apply',{fetcher:f.fetcher,stateRoot:path.join(f.root,'state')}),/Source changed/);
 assert.deepEqual(f.stats(),{writes:0,reads:0});
});
test('HTTP 500 retains actionable EDA error detail',async()=>{
 await assert.rejects(execute({base:'http://localhost',windowId:'w'},'x',async()=>({ok:false,status:500,json:async()=>({success:false,error:'source format invalid'})})),/source format invalid/);
});
