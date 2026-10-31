// Dependency-free guard for the PUBLIC GitHub Pages source.
// Inspect tracked files, since .gitignore cannot protect already-tracked files.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const paths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const blockedNames = [
  /(^|\/)\.env(?:\.|$)/i,
  /(^|\/)(?:private|secrets?|backups?|\.claude|\.cursor)(?:\/|$)/i,
  /(^|\/)(?:id_rsa[^/]*|id_ed25519[^/]*|\.npmrc|\.netrc|\.mcp\.json)$/i,
  /\.(?:pem|key|p12|pfx|kdbx|sqlite3?|db)$/i,
  /^media\//i
];
const fingerprints = [
  ['GitHub token', /(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{20,})/],
  ['Supabase secret', /sb_secret_[A-Za-z0-9_-]{20,}/],
  ['AI provider secret', /sk-(?:proj-)?[A-Za-z0-9_-]{30,}/],
  ['Google API credential', /AIza[0-9A-Za-z_-]{30,}/],
  ['AWS access key', /(?:AKIA|ASIA)[A-Z0-9]{16}/],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['Windows user path', /C:\\Users\\[^\\\s]+\\/],
  ['macOS user path', /\/Users\/[^/\s]+\//],
  ['Linux home path', /\/home\/[^/\s]+\//]
];
const problems = [];
for (const path of paths) {
  if (blockedNames.some(r => r.test(path))) {
    problems.push(path + ': private-looking filename');
    continue;
  }
  const size = statSync(path).size;
  if (size > 2_000_000) continue;
  const bytes = readFileSync(path);
  if (bytes.includes(0)) continue; // Binary files require separate metadata review.
  const contents = bytes.toString('utf8');
  for (const [label, regex] of fingerprints) {
    if (regex.test(contents)) problems.push(path + ': ' + label);
  }
}
if (problems.length) {
  console.error('Public repository privacy check FAILED:\n' + problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Public repository privacy check passed (' + paths.length + ' tracked paths).');
}
