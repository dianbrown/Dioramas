import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
export async function buildScene(slug) {
  await mkdir('dist', { recursive: true });
  await build({
    entryPoints: ['src/main.js'],
    outfile: 'dist/app.js',
    bundle: true,
    format: 'iife',
    target: 'es2020',
    minify: true,
    legalComments: 'none',
    logLevel: 'warning',
  });
  const js = (await readFile('dist/app.js', 'utf8')).replace(
    /<\/script/gi,
    '<\\/script',
  );
  const page = (script) =>
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>${slug} · Dioramas</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:white}canvas{display:block;width:100%;height:100%;image-rendering:pixelated}#error{position:fixed;inset:40%;font:16px system-ui;color:#333}</style></head><body><canvas id="stage" aria-label="${slug} live animated diorama"></canvas><p id="error" hidden></p>${script}</body></html>`;
  await writeFile('index.html', page('<script src="./dist/app.js"></script>'));
  await writeFile(`${slug}.html`, page(`<script>${js}</script>`));
  console.log(
    `built ${slug}: live Three.js, ${(js.length / 1024).toFixed(0)} kB`,
  );
}
