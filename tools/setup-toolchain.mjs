import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'toolchain/manifest.json'), 'utf8'));
let target = path.join(root, 'official-skill');
let source = manifest.repository;
let skipDeps = false;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--skip-deps') skipDeps = true;
  else if (args[i] === '--target' || args[i] === '--source') {
    const flag = args[i], value = args[++i];
    if (!value || value.startsWith('--')) throw Error(`${flag} requires a value`);
    if (flag === '--target') target = path.resolve(value);
    else source = path.resolve(value);
  } else throw Error(`Unknown option: ${args[i]}`);
}
const run = (command, commandArgs, cwd = root) => execFileSync(command, commandArgs, {
  cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], timeout: 180000,
}).trim();
const hash = data => createHash('sha256').update(data).digest('hex');
async function expectHash(file, expected) {
  const actual = hash(await fs.readFile(file));
  if (actual !== expected) throw Error(`Hash mismatch: ${path.basename(file)}`);
}

// Require a fresh path, including rejecting existing/broken symlinks. Never remove a failed install.
try { await fs.lstat(target); throw Error('Target already exists; inspect it or choose a new --target directory'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const patch = path.join(root, 'toolchain/bridge-local-v2.patch');
await expectHash(patch, manifest.patchSha256);
console.log('Cloning pinned official toolchain; no service will be started.');
run('git', ['-c', 'core.autocrlf=false', 'clone', '--no-checkout', '--', source, target]);
run('git', ['config', 'core.autocrlf', 'false'], target);
run('git', ['checkout', '--detach', manifest.commit], target);
if (run('git', ['rev-parse', 'HEAD'], target) !== manifest.commit) throw Error('Unexpected upstream HEAD');
const pkg = JSON.parse(await fs.readFile(path.join(target, 'package.json'), 'utf8'));
if (pkg.version !== manifest.version) throw Error('Unexpected package version');
await expectHash(path.join(target, manifest.file), manifest.upstreamSha256);
await expectHash(path.join(target, 'package-lock.json'), manifest.packageLockSha256);
run('git', ['apply', '--check', patch], target);
run('git', ['apply', patch], target);
await expectHash(path.join(target, manifest.file), manifest.patchedSha256);
for (const name of ['start-bridge.ps1', 'verify-bridge.mjs']) {
  await fs.copyFile(path.join(root, 'toolchain/local-additions/scripts', name), path.join(target, 'scripts', name));
}
await fs.writeFile(path.join(target, 'local-runtime.json'), JSON.stringify({
  connectionRoot: root, verifiedCli: path.join(root, 'eda-verified/cli.mjs'), upstreamVersion: manifest.version,
}, null, 2) + '\n');
await fs.writeFile(path.join(target, '_meta.json'), JSON.stringify({
  source: manifest.repository, version: manifest.version, commit: manifest.commit,
  localPatchVersion: manifest.localPatchVersion, installedAt: new Date().toISOString(),
}, null, 2) + '\n');
await fs.writeFile(path.join(target, 'LOCAL-ENVIRONMENT.md'), `# Local API workspace\n\nConnection root: ${root}\n\nRead the workspace AGENTS.md, README.md and docs/KNOWN-ISSUES.md. Use the verified CLI with explicit project/page UUIDs. Reuse the existing Bridge; this setup does not start one. Logs and operation state stay local.\n`);
await fs.appendFile(path.join(target, 'SKILL.md'), '\n\n## Local environment\n\nSee [LOCAL-ENVIRONMENT.md](LOCAL-ENVIRONMENT.md) for this checkout.\n');
run(process.execPath, ['--check', path.join(target, manifest.file)]);
if (!skipDeps) {
  console.log('Installing dependencies using the official lockfile (lifecycle scripts disabled).');
  if (process.platform === 'win32') {
    // Static command only: npm.cmd requires the Windows command interpreter.
    run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm ci --ignore-scripts --omit=dev'], target);
  } else run('npm', ['ci', '--ignore-scripts', '--omit=dev'], target);
  await expectHash(path.join(target, 'package-lock.json'), manifest.packageLockSha256);
}
const report = {
  commit: manifest.commit, version: manifest.version, localPatchVersion: manifest.localPatchVersion,
  patchedSha256: manifest.patchedSha256, dependenciesInstalled: !skipDeps, bridgeStarted: false,
  globalConfigurationChanged: false, installedAt: new Date().toISOString(),
};
await fs.writeFile(path.join(target, 'installation-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
