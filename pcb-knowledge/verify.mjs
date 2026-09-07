import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.dirname(root);
const catalog = JSON.parse(await fs.readFile(path.join(root,'catalog.json'),'utf8'));
const upstream = JSON.parse(await fs.readFile(path.join(workspace,'upstream-latest-20260908/latest.json'),'utf8'));
const errors=[],warnings=[],ids=new Set();
for(const s of catalog.sources){
  if(ids.has(s.id))errors.push(`Duplicate source ${s.id}`);
  ids.add(s.id);
  if(!s.value||!s.limitation||!s.evidence||s.status!=='reference_collected_not_integrated')errors.push(`Missing assessment/status: ${s.id}`);
  if(!/^https:\/\//.test(s.source.url))errors.push(`Invalid source URL: ${s.id}`);
  if(s.source.kind==='github'){
    const e=s.source;
    if(!/^[a-f0-9]{40}$/.test(e.commit)||!/^[a-f0-9]{64}$/.test(e.sha256))errors.push(`Missing pinned evidence: ${s.id}`);
    if(e.url!==`https://github.com/${e.repository}/blob/${e.commit}/${e.file}`)errors.push(`URL differs from pinned source: ${s.id}`);
    const entry=upstream.repositories.find(r=>r.repository===e.repository&&!r.error);
    if(!entry)errors.push(`Missing repository index: ${s.id}`);
    else if(entry.commit!==e.commit)warnings.push(`${s.id}: upstream catalog moved; curated URL retains historical commit`);
    else {
      for(const file of [e.file,e.supportingFile?.path].filter(Boolean))if(!entry.files.includes(file))errors.push(`Missing file in pinned tree: ${s.id}/${file}`);
    }
  }
}
for(const file of ['README.md','docs/DESIGN-GUIDE.md','pcb-knowledge/README.md','pcb-knowledge/PCB-DESIGN-GUIDE.md','pcb-knowledge/SOURCES.md']){
  const text=await fs.readFile(path.join(workspace,file),'utf8');
  for(const m of text.matchAll(/\]\(([^)]+)\)/g)){
    if(/^(https?:|#)/.test(m[1]))continue;
    await fs.access(path.resolve(path.dirname(path.join(workspace,file)),m[1].split('#')[0])).catch(()=>errors.push(`Broken link ${file}: ${m[1]}`));
  }
  if(file.startsWith('pcb-knowledge/'))for(const m of text.matchAll(/\b[OCAMH]\d{2}\b/g))if(!ids.has(m[0]))errors.push(`Unknown source ID in ${file}: ${m[0]}`);
}
const report={scope:'Curated reference structure, pinned source metadata and local links only; no PCB rule execution or upstream algorithm tests',sources:catalog.sources.length,githubSources:catalog.sources.filter(s=>s.source.kind==='github').length,webSources:catalog.sources.filter(s=>s.source.kind==='web').length,errors,warnings};
await fs.writeFile(path.join(root,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
if(errors.length)process.exitCode=1;
