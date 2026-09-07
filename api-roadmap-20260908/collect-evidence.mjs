import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const headers = { 'User-Agent': 'Codex-EasyEDA-Research', Accept: 'application/vnd.github+json' };
const sources = [
  ['official-open-issues.json', 'https://api.github.com/repos/easyeda/easyeda-api-skill/issues?state=open&per_page=30'],
  ['gateway-pr-2.json', 'https://api.github.com/repos/easyeda/eext-run-api-gateway/pulls/2'],
  ['task-patch-commit.json', 'https://api.github.com/repos/asmoyou/easyeda-api-skill/commits/2c0a8a5d805d88a6c96fef8ee71184668afdfded'],
  ['proposed-execution-tasks.mjs.txt', 'https://raw.githubusercontent.com/asmoyou/easyeda-api-skill/2c0a8a5d805d88a6c96fef8ee71184668afdfded/scripts/execution-tasks.mjs'],
  ['community-tool-schemas.ts.txt', 'https://raw.githubusercontent.com/Dogmeat88/EasyEDA-MCP/main/src/mcp-tool-schemas.ts'],
  ['community-capabilities.ts.txt', 'https://raw.githubusercontent.com/Dogmeat88/EasyEDA-MCP/main/src/bridge-runtime-capabilities.ts'],
  ['native-routing-issue-38.json', 'https://api.github.com/repos/easyeda/pro-api-sdk/issues/38'],
];
const results = await Promise.allSettled(sources.map(async ([name, url]) => {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  const body = await response.text();
  await fs.writeFile(path.join(root, name), body);
  return { name, url, bytes: Buffer.byteLength(body), retrievedAt: new Date().toISOString() };
}));
const health = await Promise.allSettled(Array.from({ length: 10 }, async (_, i) => {
  const port = 49620 + i;
  const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1500) });
  const body = await response.text();
  return { port, status: response.status, body };
}));
const manifest = {
  retrievedAt: new Date().toISOString(),
  scope: 'Read-only research; downloaded source retained as text, not executed. No editor mutation or runtime update.',
  sources: results.map((r, i) => r.status === 'fulfilled' ? r.value : { source: sources[i][1], error: String(r.reason) }),
  health: health.map((r, i) => r.status === 'fulfilled' ? r.value : { port: 49620 + i, error: String(r.reason) }),
};
await fs.writeFile(path.join(root, 'evidence-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
