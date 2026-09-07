import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const selection = {
  'Dogmeat88/EasyEDA-MCP': ['SDK.en.md', 'src/bridge-runtime-capabilities.ts', 'src/host-primitive-finalizer.ts', 'src/schematic-pin-stub.ts', 'src/pcb-pad-anchor.ts', 'src/pcb-pad-geometry.ts', 'src/layout-agent.ts', 'src/mcp-tool-runtime.ts', 'src/bridge-session.ts', 'src/host-method-timeout.ts'],
  'oaslananka/easyeda-mcp-pro': ['docs/professional-schematic-layout.md', 'docs/architecture/production-schematic-engine.md', 'docs/reference/tools.md', 'docs/reference/save-export-rollback-safety.md', 'src/layout/planner.ts', 'src/schematic-model/model-validator.ts', 'src/schematic-model/connectivity-fingerprint.ts', 'src/schematic-model/pin-semantics.ts', 'src/workflows/planner.ts', 'src/workflows/schematic-safe-region.ts', 'src/workflows/schematic-layout-qa.ts', 'src/workflows/schematic-post-write-qa.ts', 'src/power-tree/analysis.ts', 'src/bom-quality/quality.ts', 'src/transactions/manager.ts', 'src/net-validation/index.ts', 'src/tools/L2_workflows.ts', 'src/tools/L2_simulation.ts', 'src/vendors/sourcing-facade.ts', 'src/simulation/runner.ts', 'src/export-manifest/validation.ts', 'src/catalog/validation.ts'],
  'cheewee2000/easyeda-mcp': ['index.mjs', 'eda-tools.mjs', 'package.json'],
  'biosshot/easyeda-copilot': ['mcp/README.md', 'mcp/docs/schematic/circuit-mod.md', 'mcp/docs/verification.md', 'mcp/src/operations/manager.ts', 'mcp/src/tools/checkpoint.ts', 'mcp/src/tools/circuit.ts', 'mcp/src/tools/pcb/pcb-preview.ts', 'mcp/src/routing/easyeda-autoroute-adapter.ts'],
  'Spectoda/easyeda-mcp': ['src/server/tool-registry.ts', 'src/bridge/mock.ts'],
};
const queue = [];
for (const [repo, files] of Object.entries(selection)) {
  const directory = path.join(root, repo.replace('/', '__'));
  const index = JSON.parse(await fs.readFile(path.join(directory, 'index.json')));
  for (const file of files) queue.push({ repo, commit: index.commit, directory, file });
}
const results = [];
async function worker() {
  while (queue.length) {
    const item = queue.shift();
    const url = `https://raw.githubusercontent.com/${item.repo}/${item.commit}/${item.file}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`${response.status}`);
      const body = await response.text();
      const local = item.file.replaceAll('/', '__') + '.txt';
      await fs.writeFile(path.join(item.directory, local), body);
      results.push({ repo: item.repo, commit: item.commit, file: item.file, local, url, bytes: Buffer.byteLength(body) });
    } catch (e) { results.push({ repo: item.repo, file: item.file, url, error: String(e) }); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
await fs.writeFile(path.join(root, 'source-manifest.json'), JSON.stringify({ retrievedAt: new Date().toISOString(), scope: 'Static reading only; no installation, remote code execution, or live editor modification', sources: results }, null, 2));
console.log(JSON.stringify({ downloaded: results.filter(x => !x.error).length, errors: results.filter(x => x.error), bytes: results.reduce((n,x) => n + (x.bytes || 0), 0) }));
