import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { launchBrowser } from './browser.mjs';
import { serveBuild } from './server.mjs';
const scenes = JSON.parse(await readFile('src/data/scenes.json', 'utf8'));
const server = await serveBuild();
const browser = await launchBrowser();
const errors = [],
  results = [];
await mkdir('artifacts/tests', { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  page.on('pageerror', (error) => errors.push(error.message));
  for (const scene of scenes) {
    await page.goto(`${server.url}/?scene=${scene.id}&t=0`);
    await page.waitForFunction(
      () => document.querySelector('#scene')?.contentWindow?.__dioramaReady,
    );
    const frame = await (
      await page.locator('#scene').elementHandle()
    ).contentFrame();
    const metrics = await frame.evaluate(() => {
      const d = window.__diorama;
      const snapshot = (t) => {
        d.freeze(t);
        d.scene.updateMatrixWorld(true);
        return Object.fromEntries(
          Object.entries(d.entities || {})
            .filter(([, o]) => o?.isObject3D)
            .map(([name, o]) => [
              name,
              [
                ...o.position.toArray(),
                ...o.quaternion.toArray(),
                ...o.scale.toArray(),
                o.visible,
              ],
            ]),
        );
      };
      const first = snapshot(3);
      snapshot(17);
      const repeat = snapshot(3);
      let invalid = 0;
      d.scene.traverse((o) => {
        for (const value of o.geometry?.attributes?.position?.array || [])
          if (!Number.isFinite(value)) invalid++;
      });
      return {
        repeatable: JSON.stringify(first) === JSON.stringify(repeat),
        invalid,
        camera: d.camera.position.toArray(),
      };
    });
    assert(
      metrics.repeatable,
      `${scene.id}: seeking depends on playback history`,
    );
    assert.equal(metrics.invalid, 0, `${scene.id}: invalid geometry`);
    await frame.evaluate(() => window.__diorama.freeze(8));
    assert.deepEqual(
      await frame.evaluate(() => window.__diorama.camera.position.toArray()),
      metrics.camera,
    );
    await page.screenshot({ path: `artifacts/tests/${scene.id}.png` });
    if (scene.id === 'bank-job') {
      const entrance = await frame.evaluate(() => {
        const d = window.__diorama;
        d.freeze(20);
        return {
          angles: d.stage.entrance.doors.map((o) => o.rotation.y),
          lobby: !!d.scene.getObjectByName('bank-lobby'),
        };
      });
      assert(
        entrance.angles[0] < -2.5 && entrance.angles[1] > 2.5 && entrance.lobby,
      );
    }
    results.push({ scene: scene.id, ...metrics });
  }
  const first = scenes[0],
    last = scenes.at(-1);
  await page.goto(`${server.url}/?scene=${first.id}&t=0`);
  await page.waitForFunction(
    () => document.querySelector('#scene')?.contentWindow?.__dioramaReady,
  );
  await page.locator('#previous').click();
  await page.waitForURL((url) => url.searchParams.get('scene') === last.id);
  await page.locator('#next').click();
  await page.waitForURL((url) => url.searchParams.get('scene') === first.id);
  await page.goBack();
  await page.waitForFunction(
    (title) => document.querySelector('#scene').title === title,
    last.title,
  );
  await page.goForward();
  await page.waitForFunction(
    (title) => document.querySelector('#scene').title === title,
    first.title,
  );
  await page.keyboard.press('ArrowRight');
  await page.waitForURL(
    (url) => url.searchParams.get('scene') === scenes[1].id,
  );
  await page.waitForFunction(
    () => document.querySelector('#scene')?.contentWindow?.__dioramaReady,
  );
  const frame = await (
    await page.locator('#scene').elementHandle()
  ).contentFrame();
  await frame.locator('canvas').click();
  await page.keyboard.press('ArrowRight');
  await page.waitForURL(
    (url) => url.searchParams.get('scene') === scenes[2].id,
  );
  for (const [width, height] of [
    [1388, 950],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const selector of ['#previous', '#next']) {
      const box = await page.locator(selector).boundingBox();
      assert(
        box.x >= 0 &&
          box.y >= 0 &&
          box.x + box.width <= width &&
          box.y + box.height <= height &&
          box.width >= 44 &&
          box.height >= 44,
      );
    }
  }
  for (const scene of scenes) {
    await page.goto(
      pathToFileURL(path.resolve(`dioramas/${scene.id}/${scene.id}.html`))
        .href + '?t=3',
    );
    await page.waitForFunction(() => window.__dioramaReady);
  }
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/tests/report.json',
    JSON.stringify({ passed: true, results, errors }, null, 2),
  );
  console.log(
    `Passed: ${scenes.length} scenes, repeatable seeking, gallery navigation, responsive controls, standalone loading.`,
  );
} finally {
  await browser.close();
  await server.close();
}
