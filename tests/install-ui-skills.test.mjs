import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { installSkills, knownSkills } from '../scripts/install-ui-skills.mjs';

const scripts = join(dirname(dirname(fileURLToPath(import.meta.url))), 'scripts');

function fixture(t) {
  const home = mkdtempSync(join(tmpdir(), 'ui-sh-test-'));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  const target = join(home, '.agents/skills');
  const state = join(home, '.local/state/ui-sh');
  const messages = [];
  const run = options => installSkills({ home, log: message => messages.push(message), ...options });
  return { home, target, state, messages, run };
}

// Only fabricated text: never read the real installation or contact ui.sh.
function skill(root, name, version = 'first') {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: Synthetic test fixture.\n---\n${version}\n`);
  writeFileSync(join(dir, 'reference.md'), `Synthetic reference ${version}\n`);
}

function download(version = 'first', extra = []) {
  return stage => {
    for (const name of [...knownSkills, ...extra]) skill(join(stage, '.agents/skills'), name, version);
  };
}

test('dry-run never downloads, authenticates, or writes state', t => {
  const f = fixture(t);
  for (const args of [['--dry-run'], ['--update', '--dry-run'], ['--adopt', '--dry-run']]) {
    f.run({ args, download: () => assert.fail('download during preview') });
  }
  assert.deepEqual(readdirSync(f.home), []);
});

test('fresh install records hashes, restricts permissions, and reruns offline', t => {
  const f = fixture(t);
  f.run({ download: download() });
  const manifestPath = join(f.state, 'manifest.json');
  const original = readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(original);
  assert.equal(Object.keys(manifest.skills).length, knownSkills.length);
  assert.equal(lstatSync(join(f.target, 'design')).mode & 0o777, 0o700);
  assert.equal(lstatSync(join(f.target, 'design/SKILL.md')).mode & 0o777, 0o600);
  assert.equal(lstatSync(manifestPath).mode & 0o777, 0o600);
  f.run({ download: () => assert.fail('download on complete installation') });
  assert.equal(readFileSync(manifestPath, 'utf8'), original);
  assert.deepEqual(readdirSync(f.state), ['manifest.json']);
});

test('existing installation is preserved; adoption is explicit and offline', t => {
  const f = fixture(t);
  for (const name of knownSkills) skill(f.target, name);
  const original = readFileSync(join(f.target, 'design/SKILL.md'));
  f.run({ download: () => assert.fail('unexpected download') });
  assert.equal(existsSync(f.state), false);
  f.run({ args: ['--adopt'], download: () => assert.fail('unexpected download') });
  assert.deepEqual(readFileSync(join(f.target, 'design/SKILL.md')), original);
  assert.ok(existsSync(join(f.state, 'manifest.json')));
});

test('missing credentials or a failed download preserves installed skills', t => {
  const f = fixture(t);
  skill(f.target, 'design');
  const original = readFileSync(join(f.target, 'design/SKILL.md'));
  assert.throws(() => f.run({ download: stage => {
    skill(join(stage, '.agents/skills'), 'design', 'partial');
    throw new Error('credentials unavailable');
  } }), /credentials unavailable/);
  assert.deepEqual(readFileSync(join(f.target, 'design/SKILL.md')), original);
  assert.deepEqual(readdirSync(f.state), []);
});

test('authenticated child rejects missing token before invoking npx', t => {
  const f = fixture(t);
  const env = { ...process.env };
  delete env.UI_SH_TOKEN;
  const child = spawnSync(process.execPath, [join(scripts, 'install-ui-skills.mjs'), '--download', f.home], { env, encoding: 'utf8' });
  assert.equal(child.status, 1);
  assert.match(child.stderr, /UI_SH_TOKEN is missing/);
  assert.deepEqual(readdirSync(f.home), []);
});

for (const scenario of ['success', 'failure', 'token-file']) {
  test(`installer subprocess ${scenario} keeps the token out of output`, t => {
    const f = fixture(t);
    const bin = join(f.home, 'bin');
    const stage = join(f.home, 'stage');
    mkdirSync(bin);
    mkdirSync(stage);
    const token = 'synthetic-ui-sh-test-token';
    writeFileSync(join(bin, 'npx'), `#!${process.execPath}\n
const assert = require('node:assert/strict');
const fs = require('node:fs');
assert.deepEqual(process.argv.slice(2), [
  '--yes', '@uidotsh/install@0.2.0', '--scope=local', '--agent=codex',
  '--all-skills', '--token=' + process.env.UI_SH_TOKEN,
]);
assert.equal(process.env.npm_config_logs_max, '0');
console.log(process.env.UI_SH_TOKEN);
console.error(process.env.UI_SH_TOKEN);
if (${JSON.stringify(scenario)} === 'failure') process.exit(1);
if (${JSON.stringify(scenario)} === 'token-file') fs.writeFileSync('unexpected.txt', process.env.UI_SH_TOKEN);
`, { mode: 0o700 });
    const child = spawnSync(process.execPath, [join(scripts, 'install-ui-skills.mjs'), '--download', stage], {
      env: { ...process.env, PATH: bin, UI_SH_TOKEN: token }, encoding: 'utf8',
    });
    assert.equal(child.status, scenario === 'success' ? 0 : 1);
    assert.equal((child.stdout + child.stderr).includes(token), false);
    if (scenario === 'token-file') assert.match(child.stderr, /contains the installer token/);
  });
}

test('a conflicting untracked skill aborts the entire install', t => {
  const f = fixture(t);
  skill(f.target, 'design', 'unrelated');
  assert.throws(() => f.run({ download: download() }), /Conflict: design/);
  assert.deepEqual(readdirSync(f.target), ['design']);
  assert.match(readFileSync(join(f.target, 'design/SKILL.md'), 'utf8'), /unrelated/);
});

test('updates replace managed content, add new skills, and leave unrelated skills alone', t => {
  const f = fixture(t);
  f.run({ download: download() });
  skill(f.target, 'unrelated');
  writeFileSync(join(f.target, 'design/obsolete.txt'), 'local edit');
  assert.throws(() => f.run({ args: ['--update'], download: download('second') }), /Conflict: design/);
  rmSync(join(f.target, 'design/obsolete.txt'));
  f.run({ args: ['--update'], download: download('second', ['new-skill']) });
  assert.match(readFileSync(join(f.target, 'design/SKILL.md'), 'utf8'), /second/);
  assert.ok(existsSync(join(f.target, 'new-skill/SKILL.md')));
  assert.match(readFileSync(join(f.target, 'unrelated/SKILL.md'), 'utf8'), /first/);
});

test('incomplete downloads and symlinks fail before modifying live skills', t => {
  const f = fixture(t);
  f.run({ download: download() });
  const original = readFileSync(join(f.target, 'design/SKILL.md'));
  assert.throws(() => f.run({ args: ['--update'], download: stage => skill(join(stage, '.agents/skills'), 'design') }), /missing expected/);
  assert.throws(() => f.run({ args: ['--update'], download: stage => {
    download('second')(stage);
    symlinkSync('/tmp', join(stage, '.agents/skills/design/unsafe'));
  } }), /Unsupported file/);
  assert.deepEqual(readFileSync(join(f.target, 'design/SKILL.md')), original);
});

test('destinations in a Git repo, including symlinked ancestors, are rejected', t => {
  const f = fixture(t);
  const gitDir = join(f.home, 'checkout');
  mkdirSync(join(gitDir, '.git'), { recursive: true });
  symlinkSync(gitDir, join(f.home, '.agents'));
  assert.throws(() => f.run({ args: ['--dry-run'] }), /outside Git/);
  rmSync(join(f.home, '.agents'));
  mkdirSync(join(f.home, '.git'));
  assert.throws(() => f.run({ download: download() }), /outside Git/);
});

test('an existing lock prevents concurrent installation', t => {
  const f = fixture(t);
  mkdirSync(join(f.state, 'install.lock'), { recursive: true });
  assert.throws(() => f.run({ download: () => assert.fail('download with lock') }), /Another installation/);
});

test('private-content guard rejects forced tracked and renamed skill files', t => {
  const f = fixture(t);
  const git = args => execFileSync('git', args, { cwd: f.home, stdio: 'pipe' });
  git(['init', '-q']);
  // Copy only our public guard and installer source into an isolated test repo.
  mkdirSync(join(f.home, 'scripts'));
  for (const name of ['install-ui-skills.mjs', 'check-private-skills.mjs']) {
    writeFileSync(join(f.home, 'scripts', name), readFileSync(join(scripts, name)));
  }
  const guard = () => spawnSync(process.execPath, [join(f.home, 'scripts/check-private-skills.mjs')], { encoding: 'utf8' });
  assert.equal(guard().status, 0);
  skill(join(f.home, 'renamed'), 'design');
  git(['add', 'renamed']);
  assert.equal(guard().status, 1);
  git(['rm', '-rf', '--cached', 'renamed']);
  mkdirSync(join(f.home, 'dotfiles/codex/skills'), { recursive: true });
  writeFileSync(join(f.home, 'dotfiles/codex/skills/example.txt'), 'synthetic');
  git(['add', '-f', 'dotfiles']);
  assert.equal(guard().status, 1);
});
