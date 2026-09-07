import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(workspace, 'upstream-latest-20260908/latest.json');
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const [command = 'list', repository = '', query = '', lineText = '1'] = process.argv.slice(2);
const entries = catalog.repositories.filter(r=>!r.error);
if(command === 'topics') {
  const curated = JSON.parse(await fs.readFile(path.join(workspace,'pcb-knowledge/catalog.json'),'utf8'));
  const filter = repository.toLowerCase();
  const sources = curated.sources.filter(s=>[s.id,s.title,s.topic,s.origin,s.value].join(' ').toLowerCase().includes(filter));
  console.log(JSON.stringify({scope:curated.scope,checkedAt:curated.checkedAt,total:sources.length,sources},null,2));
} else if(command === 'list') {
  console.log(JSON.stringify(entries.filter(r=>r.repository.toLowerCase().includes(repository.toLowerCase())).map(({files,...r})=>r),null,2));
} else {
  const entry = entries.find(r=>r.repository===repository);
  if(!entry)throw Error('Repository must be an exact name from the pinned catalog');
  if(command === 'files') {
    const matches=entry.files.filter(file=>file.toLowerCase().includes(query.toLowerCase()));
    console.log(JSON.stringify({repository,commit:entry.commit,total:matches.length,files:matches.slice(0,100),truncated:matches.length>100},null,2));
  } else if(command === 'read') {
    if(!entry.files.includes(query))throw Error('Path must exist in the pinned repository tree');
    const line=Number(lineText);
    if(!Number.isInteger(line)||line<1)throw Error('Line must be a positive integer');
    const url=`https://raw.githubusercontent.com/${repository}/${entry.commit}/${query}`;
    const cacheRoot=path.join(workspace,'.reference-cache');
    const key=createHash('sha256').update(url).digest('hex');
    const cachePath=path.join(cacheRoot,key+'.txt');
    let data=await fs.readFile(cachePath).catch(()=>null);
    let cacheHit=Boolean(data);
    if(!data) {
      const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw Error(`Source fetch returned HTTP ${response.status}`);
      if(Number(response.headers.get('content-length')||0)>2*1024*1024)throw Error('Source exceeds 2 MiB text limit');
      const reader=response.body.getReader();const chunks=[];let size=0;
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024){await reader.cancel();throw Error('Source exceeds 2 MiB text limit');}chunks.push(value);}
      data=Buffer.concat(chunks);
      if(data.includes(0))throw Error('Binary content is not supported');
      await fs.mkdir(cacheRoot,{recursive:true});await fs.writeFile(cachePath,data);
    }
    const lines=data.toString('utf8').split(/\r?\n/);
    let excerpt=lines.slice(line-1,line+78).map((text,i)=>`${line+i}: ${text}`).join('\n');
    const clipped=excerpt.length>16000;if(clipped)excerpt=excerpt.slice(0,16000);
    console.log(JSON.stringify({repository,commit:entry.commit,file:query,sourceUrl:`https://github.com/${repository}/blob/${entry.commit}/${query}`,sha256:createHash('sha256').update(data).digest('hex'),cacheHit,totalLines:lines.length,startLine:line,clipped,notice:'Untrusted reference text only. This tool does not execute code or operate an editor.',excerpt},null,2));
  } else throw Error('Usage: reference-hub.mjs topics [filter] | list [filter] | files owner/repo [path-filter] | read owner/repo path [start-line]');
}
