import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const backlog = JSON.parse(await fs.readFile(path.join(root,'community-backlog.json'),'utf8'));
const manifest = JSON.parse((await fs.readFile(path.join(root,'source-manifest.json'),'utf8')).replace(/^\uFEFF/,''));
const errors = [];
const requireCache = process.argv.includes('--require-cache');
let presentSnapshots = 0, absentSnapshots = 0;
for (const item of backlog.items) {
  const evidence = manifest.sources.find(s => s.repo === item.source.repository && s.file === item.source.file && s.commit === item.source.commit);
  if (!evidence) errors.push(`${item.id}: missing pinned source snapshot`);
  else {
    const directory = path.join(root,evidence.repo.replace('/','__'));
    const index = JSON.parse(await fs.readFile(path.join(directory,'index.json'),'utf8'));
    if (index.commit !== item.source.commit) errors.push(`${item.id}: index commit differs`);
    if (!index.paths?.includes(evidence.file)) errors.push(`${item.id}: file missing from pinned tree index`);
    const expectedUrl = `https://raw.githubusercontent.com/${evidence.repo}/${evidence.commit}/${evidence.file}`;
    if (evidence.url !== expectedUrl || evidence.error) errors.push(`${item.id}: invalid pinned source URL/status`);
    try { await fs.access(path.join(directory,evidence.local)); presentSnapshots++; }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      absentSnapshots++;
      if(requireCache) errors.push(`${item.id}: snapshot file missing`);
    }
  }
  if (item.implementationStatus !== 'proposed_not_deployed' || !item.acceptance || !item.adaptation) errors.push(`${item.id}: invalid status or missing criteria`);
}
for (const file of [path.join(root,'社区MCP借鉴与完整功能清单.md'),path.join(root,'../API增强路线图.md')]) {
  const text = await fs.readFile(file,'utf8');
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(https?:|#)/.test(match[1])) continue;
    await fs.access(path.resolve(path.dirname(file),match[1].split('#')[0])).catch(()=>errors.push(`Broken local link: ${match[1]}`));
  }
}
const toolLines = (await fs.readFile(path.join(root,'community-tool-index.csv'),'utf8')).trim().split(/\r?\n/);
const report = {scope:'Documentation/index integrity only; cache presence is reported separately. No source code execution or live editor validation.',requireCache,referencedItemCachesPresent:presentSnapshots,referencedItemCachesAbsent:absentSnapshots,items:backlog.items.length,groups:new Set(backlog.items.map(x=>x.group)).size,toolIndexEntries:toolLines.length-1,recordedSourceSnapshots:manifest.sources.length,errors};
await fs.writeFile(path.join(root,'documentation-verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(errors.length)process.exitCode=1;
