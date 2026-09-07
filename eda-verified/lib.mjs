import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const sha256 = text => createHash('sha256').update(text).digest('hex');
const home = path.dirname(fileURLToPath(import.meta.url));
export function guarded(code, projectUuid, pageUuid) {
  if (!projectUuid || !pageUuid) throw Error('Exact projectUuid and pageUuid are required');
  const match = `d?.parentProjectUuid===${JSON.stringify(projectUuid)}&&d?.uuid===${JSON.stringify(pageUuid)}&&d?.documentType===1`;
  return `const checkDoc=async()=>{const d=await eda.dmt_SelectControl.getCurrentDocumentInfo();if(!(${match}))throw Error('Project/page guard rejected operation: '+JSON.stringify(d));return d;};await checkDoc();const value=await(async()=>{${code}\n})();await checkDoc();return value;`;
}
export async function discover(fetcher = fetch) {
  const found=[];
  for(let port=49620;port<=49629;port++) {
    const base=`http://127.0.0.1:${port}`;
    try {
      const r=await fetcher(base+'/health',{signal:AbortSignal.timeout(800)});
      if(!r.ok)continue;
      const h=await r.json();
      if(h.service==='easyeda-bridge' && h.edaConnected)found.push({base,health:h});
    } catch {}
  }
  if(found.length!==1)throw Error(`Expected one connected bridge; found ${found.length}`);
  const {base,health}=found[0];
  if(health.pendingRequests)throw Error('Bridge is busy; do not overlap EDA operations');
  const r=await fetcher(base+'/eda-windows',{signal:AbortSignal.timeout(2000)});
  if(!r.ok)throw Error('Could not enumerate EDA windows');
  const w=await r.json(),windows=w.windows?.filter(v=>v.connected)||[];
  if(windows.length!==1)throw Error(`Expected one connected EDA window; found ${windows.length}`);
  return {base,windowId:windows[0].windowId};
}
export async function execute(connection, code, fetcher=fetch) {
  const r=await fetcher(connection.base+'/execute',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({windowId:connection.windowId,code}),signal:AbortSignal.timeout(45000)
  });
  const v=await r.json();
  if(!r.ok)throw Error(`HTTP ${r.status}; execution status may be uncertain: ${JSON.stringify(v)}`);
  if(v.success!==true)throw Error('Bridge rejected/failed: '+JSON.stringify(v));
  if(v.result?.error)throw Error('EDA script returned error: '+JSON.stringify(v.result));
  return v.result;
}
export function assertVerification(v) {
  if(v?.ok!==true || !Array.isArray(v.checks) || !v.checks.length || v.checks.some(c=>c.pass!==true))
    throw Error('Independent verification did not pass: '+JSON.stringify({ok:v?.ok,checks:v?.checks?.filter(c=>c.pass!==true)}));
}
export async function runPlan(planPath, mode, {fetcher=fetch,stateRoot=path.join(home,'state')}={}) {
  if(!['read','apply'].includes(mode))throw Error('Mode must be read or apply');
  const abs=path.resolve(planPath),root=path.dirname(abs),p=JSON.parse(await fs.readFile(abs,'utf8'));
  if(!p.name||!p.script)throw Error('Plan needs name and script');
  if(mode==='apply'&&!p.verifyScript)throw Error('Writes require an independent verifyScript');
  const code=await fs.readFile(path.resolve(root,p.script),'utf8');
  const wrapped=guarded(code,p.projectUuid,p.pageUuid);
  const verify=mode==='apply'?guarded(await fs.readFile(path.resolve(root,p.verifyScript),'utf8'),p.projectUuid,p.pageUuid):null;
  await fs.mkdir(stateRoot,{recursive:true});
  const lockPath=path.join(stateRoot,'operation.lock');
  const lock=await fs.open(lockPath,'wx').catch(()=>{throw Error('Another verified operation holds the lock. Inspect it before recovery.');});
  const id=randomUUID(),dir=path.join(stateRoot,id),report={id,name:p.name,mode,status:'prepared',started:new Date().toISOString(),scriptSha256:sha256(code)};
  let submitted=false;
  try {
    await lock.writeFile(JSON.stringify({id,pid:process.pid,plan:abs}));
    await fs.mkdir(dir);
    await fs.writeFile(path.join(dir,'plan.json'),JSON.stringify(p,null,2));
    await fs.writeFile(path.join(dir,'script.js'),code);
    const connection=await discover(fetcher);report.connection=connection;
    const before=await execute(connection,guarded('return {document:await eda.dmt_SelectControl.getCurrentDocumentInfo(),source:await eda.sys_FileManager.getDocumentSource()};',p.projectUuid,p.pageUuid),fetcher);
    if(typeof before?.source!=='string'||!before.source.length)throw Error('Empty source backup');
    await fs.writeFile(path.join(dir,'before.json'),JSON.stringify(before));
    report.beforeSha256=sha256(before.source);
    if(p.expectedBeforeSha256 && p.expectedBeforeSha256!==report.beforeSha256)throw Error('Source changed since plan; re-read and re-plan');
    submitted=true;report.status='executing';
    await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2));
    const result=await execute(connection,wrapped,fetcher);
    await fs.writeFile(path.join(dir,'result.json'),JSON.stringify(result,null,2));
    if(mode==='apply') {
      report.status='verifying';
      let v;
      for(let attempt=1;attempt<=3;attempt++){
        if(attempt>1)await new Promise(resolve=>setTimeout(resolve,250));
        v=await execute(connection,verify,fetcher);
        await fs.writeFile(path.join(dir,`verification-${attempt}.json`),JSON.stringify(v,null,2));
        report.verificationAttempts=attempt;
        if(v?.ok===true&&Array.isArray(v.checks)&&v.checks.length&&v.checks.every(c=>c.pass===true))break;
      }
      await fs.writeFile(path.join(dir,'verification.json'),JSON.stringify(v,null,2));
      assertVerification(v);report.status='verified';report.checks=v.checks;
    } else report.status='read';
    if(p.output)await fs.writeFile(path.resolve(root,p.output),JSON.stringify(result,null,2));
    return {...report,directory:dir};
  } catch(e) {
    report.status=mode==='apply'&&submitted?'unverified':'rejected';
    report.error=String(e);throw Object.assign(e,{operationDirectory:dir,status:report.status});
  } finally {
    report.finished=new Date().toISOString();
    try {await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2));}
    finally {await lock.close();await fs.unlink(lockPath);}
  }
}
