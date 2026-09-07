import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, realpathSync, renameSync, rmSync, writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const installer = '@uidotsh/install@0.2.0';
export const knownSkills = [
  'add-dark-mode', 'brand-kit', 'canonicalize-tailwind', 'componentize',
  'dark-mode-image', 'design', 'ideas', 'make-responsive', 'markup-from-image',
];
const script = fileURLToPath(import.meta.url);
const repo = dirname(dirname(script));
const validName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Check real ancestors too: neither downloads nor destinations may enter a repo
// through a symlink. A ~/.git directory also makes home unsuitable for staging.
function outsideGit(path) {
  let ancestor = resolve(path);
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  ancestor = realpathSync(ancestor);
  while (true) {
    if (existsSync(join(ancestor, '.git'))) {
      throw new Error(`Paid skills must stay outside Git repositories: ${path}`);
    }
    const parent = dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
}

function stat(path) {
  try { return lstatSync(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export function snapshot(path, name) {
  const root = stat(path);
  if (!root) return null;
  if (!root.isDirectory() || root.isSymbolicLink()) {
    throw new Error(`Refusing a symlink or non-directory skill: ${name}`);
  }
  const files = {};
  function walk(dir, prefix = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = prefix + entry.name;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full, relative + '/');
      else if (entry.isFile()) files[relative] = createHash('sha256').update(readFileSync(full)).digest('hex');
      else throw new Error(`Unsupported file in skill: ${name}/${relative}`);
    }
  }
  walk(path);
  if (!files['SKILL.md']) throw new Error(`Missing SKILL.md: ${name}`);
  const content = readFileSync(join(path, 'SKILL.md'), 'utf8');
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!frontmatter || !new RegExp(`^name: ${name}\\r?$`, 'm').test(frontmatter)
      || !/^description:\s*\S/m.test(frontmatter)) {
    throw new Error(`Invalid skill metadata: ${name}`);
  }
  return files;
}

function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function restrict(path) {
  const entry = lstatSync(path);
  chmodSync(path, entry.isDirectory() ? 0o700 : (entry.mode & 0o100 ? 0o700 : 0o600));
  if (entry.isDirectory()) for (const name of readdirSync(path)) restrict(join(path, name));
}

function downloadWithFnox(stage) {
  // Isolate this explicit config from unrelated global/project secrets.
  const result = spawnSync('fnox', [
    'exec', '--config', join(repo, 'fnox.toml'), '--profile', 'ui-sh',
    '--no-defaults', '--if-missing', 'error', '--', process.execPath,
    script, '--download', stage,
  ], {
    cwd: repo,
    env: { ...process.env, FNOX_CONFIG_DIR: join(stage, 'fnox') },
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error('ui.sh download failed. Check 1Password CLI sign-in and op://Personal/ui.sh/Token. Existing skills were preserved.');
  }
}

function authenticatedDownload(stage) {
  outsideGit(stage);
  process.umask(0o077);
  const token = process.env.UI_SH_TOKEN;
  if (!token) throw new Error('UI_SH_TOKEN is missing; run mise run bootstrap:jamie.');
  const result = spawnSync('npx', [
    '--yes', installer, '--scope=local', '--agent=codex', '--all-skills', `--token=${token}`,
  ], {
    cwd: stage,
    env: { ...process.env, npm_config_logs_max: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  // Do not print child arguments, raw errors, or installer content. npx receives
  // the token as an argument; fnox does not hide it from process inspection.
  if (result.status !== 0) throw new Error('The ui.sh installer failed; check your token and network connection.');
  for (const file of readdirSync(stage, { recursive: true, withFileTypes: true })) {
    if (file.isFile() && readFileSync(join(file.parentPath, file.name)).includes(Buffer.from(token))) {
      throw new Error('The download contains the installer token; refusing to install it.');
    }
  }
}

export function installSkills({ args = [], home = homedir(), download = downloadWithFnox, log = console.log } = {}) {
  const allowed = ['--dry-run', '--update', '--adopt'];
  if (args.some(arg => !allowed.includes(arg)) || (args.includes('--adopt') && args.includes('--update'))) {
    throw new Error('Usage: bootstrap:jamie [--dry-run] [--update | --adopt]');
  }
  const dryRun = args.includes('--dry-run');
  const update = args.includes('--update');
  const adopt = args.includes('--adopt');
  const skillsDir = join(home, '.agents/skills');
  const stateDir = join(home, '.local/state/ui-sh');
  const manifestPath = join(stateDir, 'manifest.json');
  outsideGit(skillsDir);
  outsideGit(stateDir);
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
  if (manifest && (manifest.version !== 1 || !manifest.skills || Object.keys(manifest.skills).some(name => !validName.test(name)))) {
    throw new Error('Invalid local ui.sh manifest; refusing to change skills.');
  }
  const names = [...new Set([...knownSkills, ...Object.keys(manifest?.skills ?? {})])].sort();
  const before = Object.fromEntries(names.map(name => [name, snapshot(join(skillsDir, name), name)]));
  const complete = names.every(name => before[name]);
  if (dryRun) {
    log(`${complete ? 'Complete' : 'Incomplete'} local ui.sh installation (${names.filter(name => before[name]).length}/${names.length} skills).`);
    log(update ? 'Would authenticate and download all available skills, then check replacements for conflicts.'
      : adopt ? 'Would record existing skills in a private manifest and restrict their permissions.'
        : complete ? 'Would preserve existing skills without authenticating or downloading.'
          : 'Would authenticate with 1Password through fnox and install missing ui.sh skills.');
    return;
  }
  if (complete && !update && !adopt) {
    log('All ui.sh skills are already installed; no authentication or download needed.');
    if (!manifest) log('Use --adopt once to record these existing skills before managed updates.');
    return;
  }
  if (adopt && (!complete || manifest)) {
    throw new Error('--adopt requires a complete installation with no existing manifest.');
  }
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  chmodSync(stateDir, 0o700);
  const lock = join(stateDir, 'install.lock');
  try { mkdirSync(lock); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Another installation may be running. Check before removing ${lock}.`);
    throw error;
  }
  let stage;
  let preserveStage = false;
  try {
    if (adopt) {
      for (const name of names) restrict(join(skillsDir, name));
      writeFileSync(manifestPath, JSON.stringify({ version: 1, adoptedAt: new Date().toISOString(), skills: before }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      log(`Adopted ${names.length} existing skills; contents unchanged.`);
      return;
    }
    stage = mkdtempSync(join(stateDir, 'download-'));
    download(stage);
    const source = join(stage, '.agents/skills');
    const downloaded = readdirSync(source).sort();
    if (!downloaded.length || downloaded.some(name => !validName.test(name)) || knownSkills.some(name => !downloaded.includes(name))) {
      throw new Error('The download is missing expected skills or contains invalid names; existing skills were preserved.');
    }
    const next = Object.fromEntries(downloaded.map(name => [name, snapshot(join(source, name), name)]));
    const changes = [];
    for (const name of downloaded) {
      const current = snapshot(join(skillsDir, name), name);
      if (name in before && !same(current, before[name])) throw new Error(`Skill changed during download: ${name}`);
      if (same(current, next[name])) { log(`unchanged ${name}`); continue; }
      if (current && (!update || !same(current, manifest?.skills[name]))) {
        throw new Error(`Conflict: ${name} is untracked or locally modified. Existing skills were preserved.`);
      }
      changes.push({ name, current });
      log(`${current ? 'update' : 'install'} ${name}`);
    }
    // Retain previously managed skills that the service no longer returns.
    const retained = Object.fromEntries(Object.entries(before).filter(([name, files]) => !downloaded.includes(name) && files));
    const nextManifest = { version: 1, installer, installedAt: new Date().toISOString(), skills: { ...retained, ...next } };
    mkdirSync(skillsDir, { recursive: true, mode: 0o700 });
    const backups = join(stage, 'backups');
    mkdirSync(backups);
    const applied = [];
    try {
      for (const change of changes) {
        const { name, current } = change;
        const target = join(skillsDir, name);
        restrict(join(source, name));
        if (current) renameSync(target, join(backups, name));
        applied.push(change);
        renameSync(join(source, name), target);
      }
      const pending = join(stage, 'manifest.json');
      writeFileSync(pending, JSON.stringify(nextManifest, null, 2) + '\n', { mode: 0o600 });
      renameSync(pending, manifestPath);
    } catch (error) {
      try {
        for (const { name, current } of applied.reverse()) {
          rmSync(join(skillsDir, name), { recursive: true, force: true });
          if (current) renameSync(join(backups, name), join(skillsDir, name));
        }
      } catch {
        preserveStage = true;
        throw new Error(`Could not restore every skill. Recovery files remain at ${stage}.`);
      }
      throw error;
    }
    log(`ui.sh skills installed privately in ${skillsDir}.`);
  } finally {
    if (stage && !preserveStage) rmSync(stage, { recursive: true, force: true });
    rmSync(lock, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === script) {
  try {
    if (process.argv[2] === '--download' && process.argv.length === 4) authenticatedDownload(process.argv[3]);
    else installSkills({ args: process.argv.slice(2) });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
