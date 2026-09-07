import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const repos = ['Dogmeat88/EasyEDA-MCP', 'oaslananka/easyeda-mcp-pro', 'cheewee2000/easyeda-mcp', 'biosshot/easyeda-copilot', 'Spectoda/easyeda-mcp'];
async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Codex-EasyEDA-Research' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
const results = await Promise.allSettled(repos.map(async repo => {
  const [metadata, commits] = await Promise.all([get(`https://api.github.com/repos/${repo}`), get(`https://api.github.com/repos/${repo}/commits?per_page=1`)]);
  const commit = commits[0].sha;
  const tree = await get(`https://api.github.com/repos/${repo}/git/trees/${commit}?recursive=1`);
  const directory = path.join(root, repo.replace('/', '__'));
  await fs.mkdir(directory, { recursive: true });
  const record = { repo, commit, retrievedAt: new Date().toISOString(), license: metadata.license?.spdx_id, archived: metadata.archived, description: metadata.description, paths: tree.tree.filter(x => x.type === 'blob').map(x => x.path), treeTruncated: tree.truncated };
  await fs.writeFile(path.join(directory, 'index.json'), JSON.stringify(record, null, 2));
  const readme = record.paths.find(x => /^readme\.md$/i.test(x));
  if (readme) {
    const response = await fetch(`https://raw.githubusercontent.com/${repo}/${commit}/${readme}`, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`README ${response.status}: ${repo}`);
    await fs.writeFile(path.join(directory, 'README.source.md'), await response.text());
  }
  return { ...record, paths: record.paths.filter(x => /(^src\/|^lib\/|^test|^docs\/|^index|^SKILL|^SDK|^package|^LICENSE)/.test(x) && /tool|schematic|workflow|bom|erc|netlist|layout|rout|export|capabil|catalog|design|transaction|state|bridge|index|LICENSE|package|SDK/i.test(x)).slice(0, 90) };
}));
await fs.writeFile(path.join(root, 'repository-discovery.json'), JSON.stringify(results.map((r, i) => r.status === 'fulfilled' ? r.value : { repo: repos[i], error: String(r.reason) }), null, 2));
console.log(JSON.stringify(results.map((r, i) => r.status === 'fulfilled' ? r.value : { repo: repos[i], error: String(r.reason) }), null, 2));
