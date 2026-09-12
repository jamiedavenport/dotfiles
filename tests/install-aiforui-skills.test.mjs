import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repo = dirname(dirname(fileURLToPath(import.meta.url)));
const script = join(repo, 'scripts/install-aiforui-skills.mjs');

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'aiforui-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const env = { ...process.env, PATH: dir, AIFORUI_API: 'https://invalid.example' };
  delete env.AIFORUI_TOKEN;
  const stub = (name, code) => writeFileSync(join(dir, name), `#!${process.execPath}\n${code}`, { mode: 0o700 });
  const run = args => spawnSync(process.execPath, [script, ...args], { env, encoding: 'utf8' });
  return { dir, env, stub, run };
}

test('preview works without credentials or executables; invalid flags fail', t => {
  const f = fixture(t);
  const preview = f.run(['--dry-run']);
  assert.equal(preview.status, 0);
  assert.match(preview.stdout, /--yes --global/);
  assert.equal(f.run(['--project']).status, 1);
  const missing = f.run(['--authenticated']);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /AIFORUI_TOKEN is missing/);
});

test('fnox receives only the explicit profile and removes its temporary config directory', t => {
  const f = fixture(t);
  const capture = join(f.dir, 'capture.json');
  f.stub('fnox', `require('node:fs').writeFileSync(${JSON.stringify(capture)}, JSON.stringify({args: process.argv.slice(2), isolation: process.env.FNOX_CONFIG_DIR}));`);
  assert.equal(f.run([]).status, 0);
  const { args, isolation } = JSON.parse(readFileSync(capture, 'utf8'));
  assert.deepEqual(args, ['exec', '--config', join(repo, 'fnox.toml'), '--profile', 'aiforui', '--no-defaults', '--if-missing', 'error', '--', process.execPath, script, '--authenticated']);
  assert.equal(existsSync(isolation), false);
});

test('installer receives global flags, redacts output, and suppresses secret-bearing errors', t => {
  const f = fixture(t);
  f.env.AIFORUI_TOKEN = 'synthetic-aiforui-token';
  f.stub('npx', `
    const assert = require('node:assert/strict');
    assert.deepEqual(process.argv.slice(2), ['--yes', '@aiforui/install@0.1.4', '--token=synthetic-aiforui-token', '--yes', '--global']);
    assert.equal(process.env.AIFORUI_API, undefined);
    assert.equal(process.env.npm_config_logs_max, '0');
    console.log(process.env.AIFORUI_TOKEN);
    console.error(process.env.AIFORUI_TOKEN);
  `);
  const success = f.run(['--authenticated']);
  assert.equal(success.status, 0);
  assert.match(success.stdout, /\[REDACTED\]/);
  assert.equal(success.stderr, '');
  f.stub('npx', 'console.error(process.env.AIFORUI_TOKEN); process.exit(1);');
  const failure = f.run(['--authenticated']);
  assert.equal(failure.status, 1);
  assert.doesNotMatch(failure.stdout + failure.stderr, /synthetic-aiforui-token/);
  assert.match(failure.stderr, /installer failed/);
});
