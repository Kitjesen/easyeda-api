import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const root = path.dirname(fileURLToPath(import.meta.url));
async function api(endpoint) {
  const { stdout } = await exec('gh', ['api', endpoint], { timeout: 25000, maxBuffer: 12 * 1024 * 1024, windowsHide: true });
  return JSON.parse(stdout);
}
const search = await api('search/repositories?q=easyeda+mcp+in:name,description&sort=updated&order=desc&per_page=20');
await fs.writeFile(path.join(root,'discovery.json'), JSON.stringify({ checkedAt:new Date().toISOString(), totalCount:search.total_count, items:search.items.map(r=>({repository:r.full_name,description:r.description,url:r.html_url,updatedAt:r.updated_at,pushedAt:r.pushed_at,archived:r.archived})) },null,2));
const queue = process.argv.length > 2 ? process.argv.slice(2) : [
  'easyeda/easyeda-api-skill','easyeda/eext-run-api-gateway','easyeda/easyeda-enhanced-schematic-skill',
  'Dogmeat88/EasyEDA-MCP','oaslananka/easyeda-mcp-pro','cheewee2000/easyeda-mcp','biosshot/easyeda-copilot','Spectoda/easyeda-mcp',
  'InkRoad/jlc-mcp','VLab-Software/easyeda_mcp','hiroki-sawada-a/easy_eda_mcp','Atmel2005/EasyEDA_MCP','sheares/easyeda-mcp-fix',
  'zhoushoujianwork/easyeda-agent','hyndex/easyeda-mcp','easyeda/jlc-mcli',
  'jan-guenter/easyeda-pro-agent-plugin','carter-howell/pcb-designer','salitronic/eda-agent',
];
const results=[];
async function worker() {
  while(queue.length) {
    const repository=queue.shift();
    try {
      const [meta,commits,releaseResult] = await Promise.all([api(`repos/${repository}`),api(`repos/${repository}/commits?per_page=1`),api(`repos/${repository}/releases/latest`).then(x=>({data:x}),e=>({error:String(e.message).slice(0,150)}))]);
      const commit=commits[0];
      const tree=await api(`repos/${repository}/git/trees/${commit.sha}?recursive=1`);
      const files=tree.tree.filter(x=>x.type==='blob').map(x=>x.path);
      const r={repository,url:meta.html_url,checkedAt:new Date().toISOString(),archived:meta.archived,defaultBranch:meta.default_branch,license:meta.license?.spdx_id ?? null,pushedAt:meta.pushed_at,commit:commit.sha,commitDate:commit.commit.committer.date,commitTitle:commit.commit.message.split('\n')[0],latestRelease:releaseResult.data?{tag:releaseResult.data.tag_name,publishedAt:releaseResult.data.published_at,url:releaseResult.data.html_url}:null,releaseLookupError:releaseResult.error,treeTruncated:tree.truncated,files};
      const directory=path.join(root,repository.replace('/','__'));
      await fs.mkdir(directory,{recursive:true});
      await fs.writeFile(path.join(directory,'index.json'),JSON.stringify(r,null,2));
      for(const file of [files.find(x=>/^readme(?:\.md)?$/i.test(x)),files.find(x=>x==='package.json')].filter(Boolean)) {
        const response=await fetch(`https://raw.githubusercontent.com/${repository}/${commit.sha}/${file}`,{signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw Error(`raw ${response.status} ${file}`);
        await fs.writeFile(path.join(directory,file==='package.json'?'package.source.json':'README.source.md'),await response.text());
      }
      results.push(r);
    } catch(e) {results.push({repository,error:String(e.message).slice(0,250)});}
  }
}
await Promise.all(Array.from({length:4},worker));
const previous = await fs.readFile(path.join(root,'latest.json'),'utf8').then(JSON.parse).catch(()=>({repositories:[]}));
const merged = [...new Map([...previous.repositories,...results].map(r=>[r.repository,r])).values()];
await fs.writeFile(path.join(root,'latest.json'),JSON.stringify({checkedAt:new Date().toISOString(),scope:'Default-branch commit and latest stable GitHub release checked independently; no installation performed',repositories:merged},null,2));
console.log(JSON.stringify({discovered:search.total_count,searchTop:search.items.slice(0,10).map(x=>({repo:x.full_name,pushedAt:x.pushed_at})),checked:results.map(({files,...r})=>r)},null,2));
