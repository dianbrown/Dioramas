import { readFile, mkdir, copyFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const scenes = JSON.parse(
  await readFile(path.join(root, 'src/data/scenes.json'), 'utf8'),
);
const ids = new Set();
for (const scene of scenes) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(scene.id) || ids.has(scene.id)) {
    throw new Error(`Invalid or duplicate scene id: ${scene.id}`);
  }
  ids.add(scene.id);
  const source = path.join(root, 'dioramas', scene.id);
  await access(path.join(source, 'build.mjs'));
  execFileSync(process.execPath, ['build.mjs', '--minify'], {
    cwd: source,
    stdio: 'inherit',
  });
  const destination = path.join(root, 'public/scenes', scene.id);
  await mkdir(destination, { recursive: true });
  await copyFile(
    path.join(source, `${scene.id}.html`),
    path.join(destination, 'index.html'),
  );
}
if (!scenes.length) throw new Error('Register at least one scene.');
