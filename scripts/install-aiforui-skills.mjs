import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(import.meta.url);
const repo = dirname(dirname(script));
const installer = '@aiforui/install@0.1.4';

function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--dry-run') {
    console.log('Would retrieve op://Personal/aiforui.dev/Token through the isolated fnox aiforui profile.');
    console.log(`Would run npx --yes ${installer} --token=<secret> --yes --global.`);
    console.log('Installs all owned skills with their original names for every detected agent in your home directory.');
    console.log('The vendor CLI replaces existing skill files; this preview does not authenticate or download.');
    return;
  }
  if (args.length === 1 && args[0] === '--authenticated') {
    const token = process.env.AIFORUI_TOKEN;
    if (!token) throw new Error('AIFORUI_TOKEN is missing; run mise run skills:aiforui.');
    process.umask(0o077);
    const env = { ...process.env, npm_config_logs_max: '0' };
    // Always send this credential to the vendor's default endpoint.
    delete env.AIFORUI_API;
    const result = spawnSync('npx', [
      '--yes', installer, `--token=${token}`, '--yes', '--global',
    ], {
      cwd: homedir(), env, encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024,
    });
    // Do not print raw errors or child arguments, which may contain the token.
    if (result.status !== 0) throw new Error('The aiforui installer failed; check your token and network connection.');
    console.log((result.stdout ?? '').split(token).join('[REDACTED]').trim());
    return;
  }
  if (args.length) throw new Error('Usage: mise run skills:aiforui [--dry-run]');
  const isolation = mkdtempSync(join(tmpdir(), 'aiforui-fnox-'));
  try {
    const result = spawnSync('fnox', [
      'exec', '--config', join(repo, 'fnox.toml'), '--profile', 'aiforui',
      '--no-defaults', '--if-missing', 'error', '--', process.execPath,
      script, '--authenticated',
    ], {
      cwd: repo, env: { ...process.env, FNOX_CONFIG_DIR: isolation }, stdio: 'inherit',
    });
    if (result.status !== 0) {
      throw new Error('aiforui installation failed. Check 1Password CLI sign-in and op://Personal/aiforui.dev/Token.');
    }
  } finally {
    rmSync(isolation, { recursive: true, force: true });
  }
}

try { main(); }
catch (error) { console.error(error.message); process.exitCode = 1; }
