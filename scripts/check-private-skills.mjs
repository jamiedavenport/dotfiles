import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const privateSkillNames = [
  'add-dark-mode', 'brand-kit', 'canonicalize-tailwind', 'componentize',
  'dark-mode-image', 'design', 'ideas', 'make-responsive', 'markup-from-image',
];

const repo = dirname(dirname(fileURLToPath(import.meta.url)));
const files = execFileSync('git', ['ls-files', '-z'], { cwd: repo, encoding: 'utf8' }).split('\0').filter(Boolean);
const forbidden = files.filter(file => {
  if (/^(?:dotfiles\/codex\/skills|\.agents\/skills|\.codex\/skills)\//.test(file)) return true;
  if (/(?:^|\/)\.?fnox(?:\.[^/]+)?\.local\.toml$/.test(file)) return true;
  // Read the index: catch paid skills even if renamed or removed from the worktree.
  if (file.endsWith('/SKILL.md') || file === 'SKILL.md') {
    const content = execFileSync('git', ['show', `:${file}`], { cwd: repo, encoding: 'utf8' });
    return privateSkillNames.some(name => new RegExp(`^name: ${name}\\r?$`, 'm').test(content));
  }
  return false;
});
if (forbidden.length) {
  console.error('Private skill content or secret overrides must not be tracked:\n' + forbidden.join('\n'));
  process.exitCode = 1;
} else {
  console.log('No private skill content or local secret overrides tracked.');
}
