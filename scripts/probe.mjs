import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { probeHeritage } from './probe-heritage.mjs';
import { probeTransport } from './probe-transport.mjs';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  // Per-process diagnostic preference, no Windows/browser-profile setting changed.
  args: ['--no-sandbox', ...(process.env.JURA3D_PROBE_GPU === 'high' ? ['--force_high_performance_gpu'] : [])],
});

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const issues = [];
  const responses = { map: 0, terrain: 0, buildings: 0 };
  const mapLevels = new Set();

  page.on('pageerror', (error) => issues.push(`page: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(`console: ${message.text()}`);
  });
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('wmts.geo.admin.ch') && response.ok()) {
      responses.map++;
      const level = url.match(/\/3857\/(\d+)\//)?.[1];
      if (level) mapLevels.add(Number(level));
    }
    if (url.includes('ch.swisstopo.terrain.3d') && response.ok()) responses.terrain++;
    if (url.includes('ch.swisstopo.swissbuildings3d.3d') && response.ok()) responses.buildings++;
    if (response.status() >= 400) issues.push(`HTTP ${response.status()}: ${url}`);
  });
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText === 'net::ERR_ABORTED') return;
    issues.push(`request: ${request.failure()?.errorText} ${request.url()}`);
  });

  const probeUrl = new URL(process.env.JURA3D_URL ?? 'http://127.0.0.1:5173/');
  probeUrl.searchParams.set('probe', '1');
  const initialStarted = Date.now();
  await page.goto(probeUrl.href, { waitUntil: 'domcontentloaded' });
  const waitReady = (target) => target.waitForFunction(() => document.querySelector('#status')?.dataset.state === 'ready', undefined, { timeout: 60000 });
  await waitReady(page);
  const initialReadyMs = Date.now() - initialStarted;
  const initialCamera = await page.evaluate(() => window.__jura3dCamera());
  console.log(`Probe P1 — GPU effectif : ${initialCamera.quality.gpu}`);
  await page.waitForFunction(() => /^\d+ FPS$/.test(document.querySelector('.cesium-performanceDisplay-fps')?.textContent ?? ''));
  assert.equal(initialCamera.shadowsShown, true);
  const qualityChecks = [];
  for (const [profile, scale, shadows] of [['low', .6, false], ['medium', .75, false], ['high', 1, true], ['ultra', 1.5, true]]) {
    await page.locator('#quality').selectOption(profile);
    await page.waitForFunction((expected) => window.__jura3dPerformance().resolutionScale === expected, scale);
    await page.waitForFunction((expected) => window.__jura3dPerformance().canvas.width === Math.round(innerWidth * expected), scale);
    const state = await page.evaluate(() => ({ camera: window.__jura3dCamera(), rendering: window.__jura3dPerformance() }));
    assert.equal(state.camera.shadowsShown, shadows);
    assert.equal(state.camera.buildingsShown, true);
    assert.equal(state.rendering.screenSpaceError, 16 * scale);
    qualityChecks.push({ profile, scale, shadows });
  }
  // Un onglet sans focus ne doit pas être classé à partir de sa cadence ralentie.
  await page.evaluate(() => Object.defineProperty(document, 'hasFocus', { configurable: true, value: () => false }));
  await page.locator('#quality').selectOption('auto');
  await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(() => window.__jura3dCamera().quality.measuring), true);
  assert.equal(await page.evaluate(() => window.__jura3dCamera().quality.history.length), 0);
  await page.evaluate(() => { delete document.hasFocus; });
  await page.waitForFunction(() => !window.__jura3dCamera().quality.measuring, undefined, { timeout: 90000 });
  const automaticQuality = await page.evaluate(() => window.__jura3dCamera().quality);
  assert.ok(['low', 'medium', 'high'].includes(automaticQuality.profile));
  assert.ok(automaticQuality.measuredFps > 0);
  assert.ok(automaticQuality.history.length >= 2, 'Auto doit confirmer son choix');
  await page.locator('#shadows').check();
  await page.locator('#shadows').uncheck();
  assert.equal(await page.evaluate(() => window.__jura3dCamera().quality.mode), 'custom');
  assert.equal(await page.evaluate(() => window.__jura3dCamera().shadowsShown), false);
  await page.locator('#quality').selectOption('low');
  const preferencePage = await page.context().newPage();
  const preferenceUrl = new URL(probeUrl);
  preferenceUrl.searchParams.delete('probe');
  await preferencePage.goto(preferenceUrl.href, { waitUntil: 'domcontentloaded' });
  await waitReady(preferencePage);
  assert.equal(await preferencePage.locator('#quality').inputValue(), 'low');
  assert.equal(await preferencePage.locator('#shadows').isChecked(), false);
  await preferencePage.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(preferencePage);
  assert.equal(await preferencePage.locator('#quality').inputValue(), 'low');
  await preferencePage.close();
  await page.bringToFront();
  await page.locator('#quality-gpu').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'probe-quality-settings.png', fullPage: true });
  await page.locator('#quality').selectOption('high');
  // Après retour au premier plan/changement de preset, attendre une nouvelle
  // fenêtre de mesure ; l'ancienne lecture peut encore être celle de la pause.
  await page.waitForFunction(() => parseInt(document.querySelector('.cesium-performanceDisplay-fps')?.textContent, 10) > 0,
    undefined, { timeout: 15000 });
  const fpsLabel = await page.locator('.cesium-performanceDisplay-fps').textContent();
  assert.ok(parseInt(fpsLabel, 10) > 0, 'compteur FPS sans valeur positive');
  await page.locator('#fps').uncheck();
  await page.waitForFunction(() => !document.querySelector('.cesium-performanceDisplay-fps'));
  await page.locator('#fps').check();
  await page.waitForFunction(() => /^\d+ FPS$/.test(document.querySelector('.cesium-performanceDisplay-fps')?.textContent ?? ''));
  await page.screenshot({ path: 'probe-delémont.png', fullPage: true });
  const status = await page.locator('#status').textContent();
  await page.locator('#datetime').fill('2026-12-21T09:00');
  await page.locator('#datetime').dispatchEvent('change');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'probe-hiver.png', fullPage: true });
  await page.locator('#buildings').uncheck();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'probe-sans-batiments.png', fullPage: true });
  await page.locator('#buildings').check();
  await page.locator('#datetime').fill('2026-06-21T16:00');
  await page.locator('#datetime').dispatchEvent('change');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'probe-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  const slider = page.locator('#time-slider');
  const setSlider = (minutes) => slider.evaluate((element, value) => {
    element.value = String(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, minutes);
  await setSlider(0);
  await page.waitForTimeout(500);
  const midnight = await page.evaluate(() => ({
    label: document.querySelector('#time-value').value,
    datetime: document.querySelector('#datetime').value,
    clock: window.__jura3dCamera().time,
  }));
  await page.screenshot({ path: 'probe-nuit.png', fullPage: true });
  await setSlider(720);
  await page.waitForTimeout(500);
  const midday = await page.evaluate(() => ({
    label: document.querySelector('#time-value').value,
    datetime: document.querySelector('#datetime').value,
    clock: window.__jura3dCamera().time,
  }));
  await page.screenshot({ path: 'probe-midi.png', fullPage: true });
  if (midnight.label !== '00:00' || midday.label !== '12:00') issues.push('slider label did not update');
  if (!midnight.datetime.endsWith('T00:00') || !midday.datetime.endsWith('T12:00')) issues.push('slider and datetime are out of sync');
  if (midnight.clock === midday.clock) issues.push('slider did not update Cesium clock');
  if (await page.evaluate(() => window.__jura3dCamera().imageryMaximumLevel) !== 20) issues.push('aerial imagery is not available through level 20');
  const cameraBefore = await page.evaluate(() => window.__jura3dCamera());
  const canvas = page.locator('#cesiumContainer canvas').first();
  const box = await canvas.boundingBox();
  const startX = box.x + box.width * 0.6;
  const startY = box.y + box.height * 0.55;
  await page.mouse.move(startX, startY);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(startX + 180, startY, { steps: 20 });
  await page.mouse.up({ button: 'right' });
  await page.waitForTimeout(700);
  const cameraAfterOrbit = await page.evaluate(() => window.__jura3dCamera());
  await page.mouse.move(startX, startY);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(startX, startY + 100, { steps: 15 });
  await page.mouse.up({ button: 'right' });
  await page.waitForTimeout(700);
  const cameraAfterTilt = await page.evaluate(() => window.__jura3dCamera());
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(700);
  const cameraAfterWheel = await page.evaluate(() => window.__jura3dCamera());
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(1000);
  const cameraClose = await page.evaluate(() => window.__jura3dCamera());
  const headingChange = Math.abs(cameraAfterOrbit.heading - cameraBefore.heading);
  const pitchChange = Math.abs(cameraAfterTilt.pitch - cameraAfterOrbit.pitch);
  const wheelHeightChange = Math.abs(cameraAfterWheel.height - cameraAfterTilt.height);
  if (headingChange < 0.02) issues.push(`right drag did not orbit: ${headingChange}`);
  if (pitchChange < 0.02) issues.push(`right drag did not tilt: ${pitchChange}`);
  if (wheelHeightChange < 10) issues.push(`wheel did not zoom: ${wheelHeightChange}`);
  const destinations = [];
  const centers = {
    delemont: [7.3448, 47.3653], porrentruy: [7.0755, 47.4156],
    saignelegier: [6.9977, 47.2560], 'saint-ursanne': [7.1547, 47.3652],
  };
  for (const [id, [longitude, latitude]] of Object.entries(centers)) {
    const started = Date.now();
    await page.locator(`[data-place="${id}"]`).click();
    assert.equal(await page.locator('#status').getAttribute('data-state'), 'loading');
    await page.waitForFunction((expected) => {
      const camera = window.__jura3dCamera();
      return camera.activePlace === expected && camera.flyingTo === null;
    }, id);
    await waitReady(page);
    const readyMs = Date.now() - started;
    const camera = await page.evaluate(() => window.__jura3dCamera());
    assert.ok(Math.abs(camera.longitude - longitude) < .025 && Math.abs(camera.latitude - latitude) < .025, `destination hors cadrage : ${id}`);
    assert.equal(await page.locator(`[data-place="${id}"]`).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-place][aria-pressed="true"]').count(), 1);
    assert.equal(camera.buildingsLoaded, true);
    assert.equal(camera.globeLoaded, true);
    await page.screenshot({ path: `probe-p1-${id}.png`, fullPage: true });
    destinations.push({ id, readyMs, longitude: camera.longitude, latitude: camera.latitude });
  }
  // Deux demandes rapprochées : seule la dernière doit devenir active.
  await page.locator('[data-place="porrentruy"]').click();
  await page.locator('[data-place="saignelegier"]').click();
  await page.waitForFunction(() => window.__jura3dCamera().activePlace === 'saignelegier' && !window.__jura3dCamera().flyingTo);
  await waitReady(page);
  await page.locator('#home').click();
  await page.waitForFunction(() => window.__jura3dCamera().activePlace === 'delemont' && !window.__jura3dCamera().flyingTo);
  await waitReady(page);
  const returned = await page.evaluate(() => window.__jura3dCamera());
  for (const key of ['longitude', 'latitude', 'height', 'heading', 'pitch']) {
    assert.ok(Math.abs(returned[key] - initialCamera[key]) < .001, `retour initial : ${key}`);
  }
  await page.locator('#basemap').selectOption('topo');
  await waitReady(page);
  assert.equal(await page.evaluate(() => window.__jura3dCamera().imageryMaximumLevel), 18);
  await page.locator('#basemap').selectOption('aerial');
  await waitReady(page);
  await page.locator('[data-place="delemont"]').click();
  await page.waitForFunction(() => !window.__jura3dCamera().flyingTo);
  await waitReady(page);
  const target = await page.evaluate(() => window.__jura3dBuildingTarget());
  assert.ok(target, 'aucun bâtiment réel trouvé dans le cadrage');
  await page.mouse.click(target.x, target.y);
  assert.equal(await page.evaluate(() => window.__jura3dCamera().selectionKind), 'building');
  const sourceName = ['NAME_KOMPLETT', 'name', 'Name', 'NAME', 'nom', 'NOM'].map((key) => target.properties.find((p) => p.key === key)?.value)
    .find((value) => typeof value === 'string' && value.trim());
  assert.equal(await page.locator('#selection-title').textContent(), sourceName?.trim() ?? 'Bâtiment 3D');
  await page.screenshot({ path: 'probe-p1-selection.png', fullPage: true });
  await page.locator('#buildings').uncheck();
  assert.equal(await page.locator('#selection').isVisible(), false);
  assert.equal(await page.evaluate(() => window.__jura3dCamera().buildingsShown), false);
  await page.mouse.click(1000, 650);
  assert.equal(await page.evaluate(() => window.__jura3dCamera().selectionKind), 'point');
  assert.equal(await page.locator('#selection-title').textContent(), 'Point sur la carte');
  await page.locator('#clear-selection').click();
  assert.equal(await page.locator('#selection').isVisible(), false);
  await page.locator('#buildings').check();
  await waitReady(page);

  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const touchPage = await touchContext.newPage();
  touchPage.on('pageerror', (error) => issues.push(`touch page: ${error.message}`));
  const touchStarted = Date.now();
  await touchPage.goto(probeUrl.href, { waitUntil: 'domcontentloaded' });
  await waitReady(touchPage);
  assert.ok(await touchPage.locator('.cesium-performanceDisplay-fps').evaluate((element) => {
    const counter = element.getBoundingClientRect();
    const panel = document.querySelector('.controls').getBoundingClientRect();
    return counter.top >= 0 && counter.right <= innerWidth && counter.bottom <= panel.top;
  }), 'compteur FPS superposé au panneau tactile');
  const touchInitialMs = Date.now() - touchStarted;
  assert.equal(await touchPage.locator('#settings').getAttribute('open'), null);
  assert.equal(await touchPage.locator('#toggle-controls').getAttribute('aria-expanded'), 'false');
  assert.equal(await touchPage.locator('#controls-body').isVisible(), false);
  await touchPage.screenshot({ path: 'probe-p1-touch-collapsed.png', fullPage: true });
  await touchPage.locator('#toggle-controls').tap();
  assert.equal(await touchPage.locator('#controls-body').isVisible(), true);
  await touchPage.locator('[data-place="porrentruy"]').tap();
  await touchPage.waitForFunction(() => window.__jura3dCamera().activePlace === 'porrentruy' && !window.__jura3dCamera().flyingTo);
  await waitReady(touchPage);
  const touchBefore = await touchPage.evaluate(() => window.__jura3dCamera());
  await touchPage.locator('[data-camera="zoom-in"]').tap();
  await touchPage.locator('[data-camera="right"]').tap();
  await touchPage.locator('[data-camera="tilt"]').tap();
  const touchAfter = await touchPage.evaluate(() => window.__jura3dCamera());
  assert.ok(Math.abs(touchAfter.height - touchBefore.height) > 10, 'bouton zoom tactile');
  assert.ok(Math.abs(touchAfter.heading - touchBefore.heading) > .1, 'bouton rotation tactile');
  assert.ok(Math.abs(touchAfter.pitch - touchBefore.pitch) > .2, 'bouton inclinaison tactile');
  // Gestes sur la carte : le panneau ouvert peut couvrir les coordonnées du test.
  await touchPage.locator('#toggle-controls').tap();
  assert.equal(await touchPage.locator('#controls-body').isVisible(), false);
  assert.ok(await touchPage.evaluate(() => [140, 240, 295].every(x => document.elementFromPoint(x, 550)?.tagName === 'CANVAS')),
    'zone de geste réellement sur le canvas');
  const client = await touchContext.newCDPSession(touchPage);
  const gesture = async (frames) => {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: frames[0] });
    for (const points of frames.slice(1)) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points });
      await touchPage.waitForTimeout(30);
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touchPage.waitForTimeout(500);
  };
  const dragBefore = await touchPage.evaluate(() => window.__jura3dCamera());
  await gesture(Array.from({ length: 12 }, (_, i) => [{ x: 240 + i * 5, y: 550, id: 1 }]));
  const dragAfter = await touchPage.evaluate(() => window.__jura3dCamera());
  assert.ok(Math.abs(dragAfter.longitude - dragBefore.longitude) + Math.abs(dragAfter.latitude - dragBefore.latitude) > .00001, 'glissement tactile');
  await gesture(Array.from({ length: 12 }, (_, i) => [{ x: 140 - i * 3, y: 560, id: 1 }, { x: 240 + i * 3, y: 560, id: 2 }]));
  const pinchAfter = await touchPage.evaluate(() => window.__jura3dCamera());
  assert.ok(Math.abs(pinchAfter.height - dragAfter.height) > 5, 'pincement tactile');
  await touchPage.locator('#toggle-controls').tap();
  await touchPage.locator('#home').tap();
  await touchPage.waitForFunction(() => window.__jura3dCamera().activePlace === 'delemont' && !window.__jura3dCamera().flyingTo);
  await waitReady(touchPage);
  await touchPage.screenshot({ path: 'probe-p1-touch-portrait.png', fullPage: true });
  await touchPage.locator('#settings summary').tap();
  const controls = await touchPage.locator('button, select, input[type="datetime-local"], summary, #time-slider, .checkbox').evaluateAll((elements) => elements
    .filter((element) => element.getClientRects().length)
    .map((element) => ({ name: element.id || element.textContent.trim() || element.getAttribute('aria-label'), height: element.getBoundingClientRect().height })));
  assert.ok(controls.every((control) => control.height >= 44), 'cible tactile inférieure à 44px');
  await touchPage.locator('#basemap').selectOption('topo');
  await waitReady(touchPage);
  await touchPage.locator('#datetime').fill('2026-06-21T12:00');
  await touchPage.locator('#datetime').dispatchEvent('change');
  assert.equal(await touchPage.locator('#time-value').textContent(), '12:00');
  await touchPage.locator('#shadows').tap();
  assert.equal(await touchPage.evaluate(() => window.__jura3dCamera().shadowsShown), false);
  await touchPage.locator('#shadows').tap();
  assert.equal(await touchPage.evaluate(() => window.__jura3dCamera().shadowsShown), true);
  await touchPage.locator('#buildings').uncheck();
  await touchPage.screenshot({ path: 'probe-p1-touch-settings.png', fullPage: true });
  await touchPage.locator('#settings summary').tap();
  // New optional sections can change panel height. Select actual free terrain,
  // never a fixed coordinate that may now hit a panel or its credits.
  const touchTerrainPoint = await touchPage.evaluate(() => {
    for (const y of [innerHeight * .72, innerHeight * .82]) {
      for (const x of [innerWidth - 20, innerWidth * .8, innerWidth * .5]) {
        if (document.elementFromPoint(x, y)?.tagName === 'CANVAS') return { x, y,
          previousTarget: document.elementFromPoint(300, 600)?.tagName };
      }
    }
    return null;
  });
  assert.ok(touchTerrainPoint, 'aucune zone de terrain réellement libre');
  console.log(`Cible terrain tactile : ${JSON.stringify(touchTerrainPoint)}`);
  await touchPage.touchscreen.tap(touchTerrainPoint.x, touchTerrainPoint.y);
  assert.equal(await touchPage.evaluate(() => window.__jura3dCamera().selectionKind), 'point');
  await touchPage.screenshot({ path: 'probe-p1-touch-selection.png', fullPage: true });
  await touchPage.locator('#clear-selection').tap();
  await touchPage.locator('#toggle-controls').tap();
  assert.equal(await touchPage.locator('#controls-body').isVisible(), false);
  await touchPage.setViewportSize({ width: 844, height: 390 });
  const landscapePanel = () => touchPage.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector).getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    const content = document.querySelector('#controls-body');
    return { width: innerWidth, height: innerHeight, panel: rect('.controls'), button: rect('#toggle-controls'),
      fps: rect('.cesium-performanceDisplay-defaultContainer'), credit: rect('.credit'),
      content: { clientHeight: content.clientHeight, scrollHeight: content.scrollHeight } };
  });
  const collapsedLandscape = await landscapePanel();
  assert.ok(collapsedLandscape.panel.width <= 340, 'bandeau replié paysage trop large');
  await touchPage.locator('#toggle-controls').tap();
  if (!await touchPage.locator('#settings').evaluate((element) => element.open)) await touchPage.locator('#settings summary').tap();
  await touchPage.locator('#fps').scrollIntoViewIfNeeded();
  const landscape = await landscapePanel();
  assert.ok(landscape.panel.width <= 380, 'menu ouvert paysage trop large');
  assert.ok(landscape.panel.height >= landscape.height - 60 && Math.abs(landscape.panel.bottom - (landscape.height - 40)) < 1, 'menu ouvert paysage arrêté avant le bas');
  assert.ok(landscape.content.scrollHeight > landscape.content.clientHeight, 'réglages longs sans défilement');
  assert.ok(landscape.button.right <= landscape.fps.left, 'FPS recouvre Replier en paysage');
  assert.ok(collapsedLandscape.panel.height < landscape.panel.height, 'replier ne réduit pas la hauteur');
  await touchPage.screenshot({ path: 'probe-p1-touch-landscape.png', fullPage: true });
  assert.equal(await touchPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'débordement horizontal');
  const creditVisible = await touchPage.locator('.credit').evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
  });
  assert.ok(creditVisible, 'crédit hors de la fenêtre en paysage');
  // A53: the two ready layer summaries used to consume almost the entire
  // short landscape panel. Keep enough space to browse the actual controls.
  await touchPage.evaluate(() => {
    for (const id of ['heritage', 'transport']) {
      const input = document.getElementById(id); input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await touchPage.waitForFunction(() => window.__jura3dHeritage().state === 'ready' && window.__jura3dTransport().state === 'ready');
  await touchPage.setViewportSize({ width: 722, height: 274 });
  // Resize can expose new tiles and temporarily show the loading message.
  // This check concerns space available with the scene and both layers ready.
  await touchPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await waitReady(touchPage);
  await touchPage.locator('#controls-body').evaluate(e => { e.scrollTop = 0; });
  const shortLandscape = await landscapePanel();
  assert.ok(shortLandscape.content.clientHeight >= 100, 'commandes presque invisibles avec P3/P4 en paysage A53');
  assert.ok(await touchPage.locator('.controls-scroll-hint').isVisible(), 'défilement non indiqué');
  await touchPage.locator('#toggle-controls').tap();
  const shortCollapsed = await landscapePanel();
  assert.ok(shortCollapsed.panel.height < 140, 'résumés des couches encombrent le bandeau replié');
  await touchPage.locator('#toggle-controls').tap();
  await touchPage.screenshot({ path: 'probe-p1-touch-short-landscape.png', fullPage: true });
  await touchPage.setViewportSize({ width: 1205, height: 600 });
  const tabletLandscape = await landscapePanel();
  assert.ok(tabletLandscape.panel.height >= tabletLandscape.height - 60 && Math.abs(tabletLandscape.panel.bottom - (tabletLandscape.height - 40)) < 1, 'menu tablette arrêté à mi-hauteur');
  assert.ok(tabletLandscape.button.right <= tabletLandscape.fps.left, 'FPS recouvre Replier sur tablette');
  assert.ok(tabletLandscape.credit.bottom <= tabletLandscape.panel.bottom, 'crédit hors du menu tablette');
  await touchPage.screenshot({ path: 'probe-p1-touch-tablet-landscape.png', fullPage: true });
  await touchPage.locator('#toggle-controls').tap();
  assert.ok((await touchPage.locator('.controls').boundingBox()).height < tabletLandscape.panel.height, 'replier ne réduit pas le menu tablette');
  await touchContext.close();

  // Pannes simulées, puis données réelles après réessai. Aucune panne injectée
  // n'entre dans la liste des erreurs du parcours normal.
  const failures = [
    { name: 'terrain-root', match: /ch\.swisstopo\.terrain\.3d\/v1\/layer\.json/, label: 'Relief' },
    { name: 'terrain-tile', match: /ch\.swisstopo\.terrain\.3d\/v1\/.*\.terrain/, label: 'Relief' },
    { name: 'buildings-root', match: /ch\.swisstopo\.swissbuildings3d\.3d\/v1\/tileset\.json/, label: 'Bâtiments' },
    { name: 'buildings-tile', match: /ch\.swisstopo\.swissbuildings3d\.3d\/v1\/(?!tileset\.json).+/, label: 'Bâtiments' },
    { name: 'imagery-tile', match: /wmts\.geo\.admin\.ch\/.*\.jpeg/, label: 'Fond de carte' },
  ];
  const recovered = [];
  for (const failure of failures) {
    const landscapeFailure = failure.name === 'buildings-root';
    const failurePage = await browser.newPage({ viewport: landscapeFailure ? { width: 844, height: 390 } : { width: 1000, height: 800 }, hasTouch: landscapeFailure, isMobile: landscapeFailure });
    failurePage.on('pageerror', (error) => issues.push(`${failure.name} page: ${error.message}`));
    let injected = 0;
    await failurePage.route(failure.match, async (route) => {
      injected++;
      await route.fulfill({ status: 503, body: 'Probe : service temporairement indisponible', headers: { 'access-control-allow-origin': '*' } });
    });
    await failurePage.goto(probeUrl.href, { waitUntil: 'domcontentloaded' });
    await failurePage.waitForFunction((label) => document.querySelector('#status').dataset.state === 'error'
      && document.querySelector('#status').textContent.includes(label), failure.label, { timeout: 60000 });
    assert.ok(injected > 0, `${failure.name} : panne non injectée`);
    if (landscapeFailure) {
      await failurePage.locator('#toggle-controls').tap();
      assert.equal(await failurePage.locator('#controls-body').isVisible(), false);
      await failurePage.locator('#toggle-controls').tap();
      const panel = await failurePage.locator('.controls').boundingBox();
      assert.ok(Math.abs(panel.y + panel.height - 350) < 1, 'erreur : menu paysage arrêté avant le bas');
    }
    assert.equal(await failurePage.locator('#retry').isVisible(), true);
    for (const selector of ['#status', '#retry', '.credit']) {
      assert.ok(await failurePage.locator(selector).evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= innerHeight;
      }), `${failure.name} : ${selector} hors fenêtre`);
    }
    if (failure.name === 'buildings-root') await failurePage.screenshot({ path: 'probe-p1-error.png', fullPage: true });
    await failurePage.unroute(failure.match);
    await failurePage.locator('#retry').click();
    await waitReady(failurePage);
    assert.equal(await failurePage.locator('#retry').isVisible(), false);
    recovered.push(failure.name);
    await failurePage.close();
  }
  console.log('P1 terminé ; contrôle P3 patrimoine…');
  const heritage = await probeHeritage(browser, probeUrl.href);
  console.log('P3 terminé ; contrôle P4 transports et invariants P6…');
  const transport = await probeTransport(browser, probeUrl.href);
  const report = { checkedAt: new Date().toISOString(), browser: browser.version(), url: probeUrl.href, heritage, transport,
    status, initialReadyMs, quality: { presets: qualityChecks, auto: automaticQuality, foregroundGuard: true, persistentChoice: true, manualOverride: true, shadowsToggle: true }, fps: { label: fpsLabel, toggle: true }, responses, mapLevels: [...mapLevels].sort((a, b) => a - b),
    timeSlider: { midnight, midday }, camera: { headingChange, pitchChange, wheelHeightChange },
    destinations, returnedToInitial: true,
    selection: { propertyKeys: target.properties.map((p) => p.key), name: sourceName ?? null, egid: target.properties.find((p) => p.key === 'EGID')?.value },
    touch: { simulated: true, touchInitialMs, controls, drag: true, pinch: true, cameraButtons: true, collapsiblePanel: true, portraitAndLandscape: true, fullHeightLandscape: { phone: landscape, tablet: tabletLandscape }, creditVisible },
    recovered, issues: issues.slice(0, 20), issueCount: issues.length };
  await writeFile('probe-p1-report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (issues.length || responses.map === 0 || responses.terrain === 0 || responses.buildings < 3) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
