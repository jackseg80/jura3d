// Chrome sur appareil physique, déjà relié par ADB/CDP. Aucun émulateur,
// redimensionnement, effacement de cache ou changement de réglage Android.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const endpoint = process.env.JURA3D_CDP_URL;
const url = process.env.JURA3D_ANDROID_URL;
const capturePrefix = process.env.JURA3D_CAPTURE_PREFIX ?? 'android';
const captureScreenshots = process.env.JURA3D_ANDROID_SCREENSHOTS !== '0';
const capture = async (page, path) => {
  if (captureScreenshots) await page.screenshot({ path });
};
assert.match(capturePrefix, /^[a-z0-9-]+$/, 'Préfixe de capture limité aux lettres, chiffres et tirets.');
assert.ok(endpoint && url, 'Définir JURA3D_CDP_URL et JURA3D_ANDROID_URL après le tunnel USB.');
const report = { checkedAt: new Date().toISOString(), device: process.env.JURA3D_DEVICE_LABEL ?? 'Android physique', url, inputs: 'Événements tactiles injectés dans Chrome sur appareil physique', cache: 'Non purgé, services éventuellement déjà en cache', screenshots: captureScreenshots, issues: [], stages: [] };
let browser;
try {
  browser = await chromium.connectOverCDP(endpoint, { timeout: 60000 });
  const context = browser.contexts()[0];
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  page.on('pageerror', (error) => report.issues.push(`page: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') report.issues.push(`console: ${message.text()}`); });
  page.on('response', (response) => { if (response.status() >= 400) report.issues.push(`HTTP ${response.status()}: ${response.url()}`); });
  const waitReady = () => page.waitForFunction(() => document.querySelector('#status')?.dataset.state === 'ready', undefined, { timeout: 60000 });
  const camera = () => page.evaluate(() => window.__jura3dCamera());
  const tapAt = async (x, y) => {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const tap = async (selector) => {
    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    const box = await element.boundingBox();
    assert.ok(box, selector);
    await tapAt(box.x + box.width / 2, box.y + box.height / 2);
  };
  const samples = async (moving, values = []) => {
    for (let i = 0; i < (process.env.JURA3D_ANDROID_MODE === 'fps' ? 4 : 6); i++) {
      if (moving) await tap(i % 2 ? '[data-camera="left"]' : '[data-camera="right"]');
      await page.waitForTimeout(1100);
      values.push(parseInt(await page.locator('.cesium-performanceDisplay-fps').textContent(), 10));
    }
    return values;
  };
  const started = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitReady();
  report.initialReadyMs = Date.now() - started;
  report.browser = browser.version();
  report.viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio, orientation: screen.orientation.type, touchPoints: navigator.maxTouchPoints }));
  report.assets = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => /\/assets\/index-/.test(name)));
  report.stages.push('Scène réelle prête');
  if (await page.locator('#toggle-controls').getAttribute('aria-expanded') === 'false') {
    await capture(page, `probe-${capturePrefix}-collapsed.png`);
    await tap('#toggle-controls');
    await page.waitForFunction(() => document.querySelector('#toggle-controls').getAttribute('aria-expanded') === 'true');
    report.stages.push('Panneau compact ouvert par toucher');
  }
  await page.waitForFunction(() => /^\d+ FPS$/.test(document.querySelector('.cesium-performanceDisplay-fps')?.textContent ?? ''));
  report.rendering = await page.evaluate(() => {
    const canvas = document.querySelector('#cesiumContainer canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    return { canvas: { width: canvas.width, height: canvas.height, cssWidth: canvas.clientWidth, cssHeight: canvas.clientHeight },
      gpu: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'Non exposé' };
  });
  if (['performance', 'quality', 'presets'].includes(process.env.JURA3D_ANDROID_MODE)) {
    await tap('[data-place="delemont"]');
    await page.waitForFunction(() => !window.__jura3dCamera().flyingTo);
    await waitReady();
    if (!await page.locator('#settings').evaluate((element) => element.open)) await tap('#settings summary');
    await page.locator('#datetime').fill('2026-06-21T12:00');
    await page.locator('#datetime').dispatchEvent('change');
    await tap('#toggle-controls');
    const configure = (options) => page.evaluate((value) => window.__jura3dPerformance(value), options);
    const measure = async (id, options) => {
      await configure(options);
      await waitReady();
      await page.waitForTimeout(3500);
      const readings = [];
      for (let i = 0; i < 6; i++) {
        await page.waitForTimeout(1100);
        readings.push({ fps: parseInt(await page.locator('.cesium-performanceDisplay-fps').textContent(), 10),
          ...await configure({}) });
      }
      const result = { id, camera: await camera(), readings };
      report.performance.push(result);
      if (['full', 'none', 'cast', 'sse-64', 'sse-128', 'msaa-1'].includes(id)) await capture(page, `probe-${capturePrefix}-shadows-${id}.png`);
      if (id.startsWith('preset-')) await capture(page, `probe-${capturePrefix}-${id}.png`);
      console.log(JSON.stringify({ id, fps: readings.map((value) => value.fps),
        tiles: readings.at(-1).tiles, triangles: readings.at(-1).triangles, commands: readings.at(-1).commands }));
    };
    report.performance = [];
    try {
      await configure({ lockCamera: true });
      if (process.env.JURA3D_ANDROID_MODE === 'presets') {
        await configure({ range: 1800 });
        for (const preset of ['high', 'medium', 'low', 'auto']) {
          await tap('#toggle-controls');
          await page.locator('#quality').selectOption(preset);
          await tap('#toggle-controls');
          if (preset === 'auto') await page.waitForFunction(() => !window.__jura3dCamera().quality.measuring, undefined, { timeout: 90000 });
          await measure(`preset-${preset}`, {});
          const state = await camera();
          assert.equal(state.buildingsShown, true, 'les presets conservent les bâtiments');
          assert.equal(state.quality.mode, preset);
        }
        report.stages.push('Presets Élevé/Moyen/Faible et choix Auto mesuré, bâtiments conservés');
      } else if (process.env.JURA3D_ANDROID_MODE === 'quality') {
        await measure('quality-baseline', { range: 1800, shadows: false, screenSpaceError: 16, msaaSamples: 4, resolutionScale: 1 });
        for (const screenSpaceError of [32, 64, 128]) await measure(`sse-${screenSpaceError}`, { range: 1800, screenSpaceError });
        await measure('msaa-1', { range: 1800, screenSpaceError: 16, msaaSamples: 1 });
        await measure('resolution-075', { range: 1800, resolutionScale: .75 });
        await measure('quality-restored', { range: 1800, msaaSamples: 4, resolutionScale: 1 });
        report.stages.push('Seuil 16/32/64/128, MSAA 4/1, résolution 1/0,75 puis restauration');
      } else {
        await measure('full', { range: 1800, shadows: true, softShadows: true, buildingShadows: 'enabled' });
        await measure('none', { range: 1800, shadows: false });
        await measure('full-restored', { range: 1800, shadows: true });
        await measure('cast', { range: 1800, buildingShadows: 'cast' });
        await measure('hard', { range: 1800, buildingShadows: 'enabled', softShadows: false });
        for (const range of [900, 3600]) await measure(`range-${range}-no-shadows`, { range, shadows: false, softShadows: true });
        report.stages.push('Ombres complètes/sans/rétablies, projection seule, filtrage et deux distances');
      }
      report.passed = report.issues.length === 0;
    } finally {
      if (process.env.JURA3D_ANDROID_MODE === 'presets') await configure({ lockCamera: false });
      else await configure({ range: 1800, shadows: true, softShadows: true, buildingShadows: 'enabled', screenSpaceError: 16, msaaSamples: 4, resolutionScale: 1, lockCamera: false });
    }
  } else if (process.env.JURA3D_ANDROID_MODE === 'fps') {
    await tap('[data-place="delemont"]');
    await page.waitForFunction(() => !window.__jura3dCamera().flyingTo);
    await waitReady();
    if (!await page.locator('#settings').evaluate((element) => element.open)) await tap('#settings summary');
    await page.locator('#datetime').fill('2026-06-21T12:00');
    await page.locator('#datetime').dispatchEvent('change');
    report.fixedCamera = await camera();
    report.fps = { buildingsOn: [], buildingsOff: [], buildingsRestored: [] };
    await samples(false, report.fps.buildingsOn);
    await capture(page, `probe-${capturePrefix}-fps.png`);
    await tap('#buildings');
    await page.waitForFunction(() => !window.__jura3dCamera().buildingsShown);
    assert.equal((await camera()).buildingsShown, false);
    await waitReady();
    await samples(false, report.fps.buildingsOff);
    await tap('#buildings');
    await page.waitForFunction(() => window.__jura3dCamera().buildingsShown);
    await waitReady();
    await samples(false, report.fps.buildingsRestored);
    report.stages.push('Même caméra : bâtiments actifs, masqués, rétablis');
    report.passed = report.issues.length === 0;
  } else {
  await page.waitForFunction(() => !window.__jura3dCamera().quality.measuring, undefined, { timeout: 90000 });
  report.initialQuality = (await camera()).quality;
  report.performanceAfterAuto = await page.evaluate(() => window.__jura3dPerformance());
  const initial = await camera();
  report.destinations = [];
  for (const id of ['delemont', 'porrentruy', 'saignelegier', 'saint-ursanne']) {
    const start = Date.now();
    await tap(`[data-place="${id}"]`);
    await page.waitForFunction((expected) => window.__jura3dCamera().activePlace === expected && !window.__jura3dCamera().flyingTo, id);
    await waitReady();
    report.destinations.push({ id, readyMs: Date.now() - start });
  }
  report.stages.push('Quatre destinations par toucher');
  await tap('#home');
  await page.waitForFunction(() => window.__jura3dCamera().activePlace === 'delemont' && !window.__jura3dCamera().flyingTo);
  await waitReady();
  const returned = await camera();
  for (const key of ['longitude', 'latitude', 'height', 'heading', 'pitch']) assert.ok(Math.abs(returned[key] - initial[key]) < .001, `retour initial : ${key}`);
  report.stages.push('Retour initial');
  report.fps = { idle: [], cameraButtons: [] };
  await samples(false, report.fps.idle);
  await samples(true, report.fps.cameraButtons);
  await capture(page, `probe-${capturePrefix}-fps.png`);
  const before = await camera();
  await tap('[data-camera="zoom-in"]');
  await tap('[data-camera="tilt"]');
  const after = await camera();
  assert.ok(Math.abs(before.height - after.height) > 5 && Math.abs(before.pitch - after.pitch) > .2);
  report.stages.push('Zoom et inclinaison tactiles');
  const viewport = report.viewport;
  const gesture = async (frames) => {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: frames[0] });
    for (const points of frames.slice(1)) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points });
      await page.waitForTimeout(35);
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(500);
  };
  const x = viewport.width * .7;
  const y = viewport.height * .7;
  const dragBefore = await camera();
  await gesture(Array.from({ length: 12 }, (_, i) => [{ x: x + i * 4, y, id: 1 }]));
  const dragAfter = await camera();
  assert.ok(Math.abs(dragBefore.longitude - dragAfter.longitude) + Math.abs(dragBefore.latitude - dragAfter.latitude) > .00001);
  await gesture(Array.from({ length: 12 }, (_, i) => [{ x: x - 40 - i * 3, y, id: 1 }, { x: x + 40 + i * 3, y, id: 2 }]));
  assert.ok(Math.abs((await camera()).height - dragAfter.height) > 5);
  report.stages.push('Glissement et pincement sur appareil');
  await tap('[data-place="delemont"]');
  await page.waitForFunction(() => !window.__jura3dCamera().flyingTo);
  await waitReady();
  const target = await page.evaluate(() => window.__jura3dBuildingTarget());
  assert.ok(target, 'cible bâtiment réelle');
  await tapAt(target.x, target.y);
  assert.equal((await camera()).selectionKind, 'building');
  report.selection = { title: await page.locator('#selection-title').textContent(), description: await page.locator('#selection-description').textContent() };
  await capture(page, `probe-${capturePrefix}-selection.png`);
  await tap('#clear-selection');
  if (!await page.locator('#settings').evaluate((element) => element.open)) await tap('#settings summary');
  const shadowsBefore = (await camera()).shadowsShown;
  await tap('#shadows');
  assert.equal((await camera()).shadowsShown, !shadowsBefore);
  await tap('#shadows');
  assert.equal((await camera()).shadowsShown, shadowsBefore);
  await tap('#fps');
  await page.waitForFunction(() => !document.querySelector('.cesium-performanceDisplay-fps'));
  await tap('#fps');
  await page.waitForFunction(() => /^\d+ FPS$/.test(document.querySelector('.cesium-performanceDisplay-fps')?.textContent ?? ''));
  report.stages.push('Sélection réelle et masquage/rétablissement FPS');
  report.passed = report.issues.length === 0;
  }
} catch (error) {
  report.passed = false;
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  // Le processus termine sa connexion CDP ; ne pas envoyer Browser.close à
  // Chrome et ne pas fermer les autres onglets de l'utilisateur.
  await writeFile('probe-android-report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report.performance ? { checkedAt: report.checkedAt, assets: report.assets,
    initialReadyMs: report.initialReadyMs, passed: report.passed, issues: report.issues, failure: report.failure } : report, null, 2));
}
// Couper uniquement le client CDP de ce processus, sans commande Browser.close.
process.exit(process.exitCode ?? 0);
