// npm run rig:push [-- --yes] [-- --name="label"]
// Pushes Meera's rig to the Rive file https://editor.rive.app/file/meera/2718334, from a temporary
// copy, so the repo never changes: `rive push` writes ids back into the .rml and a push: link into
// rive.yaml. The copy is linked to the existing file, so every push updates that same file.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RIVE_FILE = { projectId: 772524, fileId: 2718334 };
const ROOT = path.join(__dirname, '..');
// What a push needs: the project file and the scene. Everything else in rive/ is excluded by rive.yaml anyway.
const SKIP = new Set(['build', 'contact', 'reference', 'parts', 'source', 'rig', 'static']);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'meera-rive-push-'));
let status = 1;
try {
  fs.cpSync(ROOT, tmp, { recursive: true, filter: (src) => !SKIP.has(path.relative(ROOT, src).split(path.sep)[0]) && !src.endsWith('.riv') });
  const yaml = path.join(tmp, 'rive.yaml');
  const lines = fs.readFileSync(yaml, 'utf8').replace(/\npush:[\s\S]*?(?=\n\S|$)/, '');
  fs.writeFileSync(yaml, `${lines.trimEnd()}\npush:\n  projectId: ${RIVE_FILE.projectId}\n  fileId: ${RIVE_FILE.fileId}\n`);
  const args = process.argv.slice(2);
  if (!args.some((a) => a.startsWith('--name'))) args.push(`--name=JobBuddy ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
  const run = spawnSync('rive', ['push', tmp, ...args], { stdio: 'inherit' });
  status = run.status ?? 1;
  if (status === 0) console.log(`\nPushed. Open it: https://editor.rive.app/file/meera/${RIVE_FILE.fileId}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
process.exit(status);
