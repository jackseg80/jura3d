// P5: controlled measurements, not an interaction test or a physical gesture claim.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i++) {
  if (['--smoke', '--help'].includes(args[i])) options[args[i].slice(2)] = true;
  else {
    assert.ok(['--device', '--preset', '--url', '--cdp', '--serial', '--adb', '--network'].includes(args[i]), `Option inconnue: ${args[i]}`);
    assert.ok(args[i + 1] && !args[i + 1].startsWith('--'), `Valeur absente: ${args[i]}`);
    options[args[i].slice(2)] = args[++i];
  }
}
if (options.help) {
  console.log('node scripts/measure-performance.mjs --device desktop|android --preset low|medium|high|ultra [--url http://127.0.0.1:4173/] [--smoke] [--network DESCRIPTION]\nAndroid: --cdp http://127.0.0.1:9228 --serial SERIAL [--adb CHEMIN]\n--network est requis pour une session complete. Rapport unique dans .vite/p5/. Smoke = preparation seulement; parcours complet >= 10 minutes.');
  process.exit(0);
}
assert.ok(['desktop', 'android'].includes(options.device), 'Préciser --device desktop ou android.');
assert.ok(['low', 'medium', 'high', 'ultra'].includes(options.preset), 'Préciser un preset fixe.');
assert.ok(options.smoke || options.network?.trim(), 'Décrire --network pour une session complète.');
const android = options.device === 'android';
assert.ok(!android || (options.cdp && options.serial), 'Android nécessite --cdp et --serial.');
assert.ok(android || (!options.cdp && !options.serial), 'Ne pas associer un endpoint Android à une mesure bureau.');
const url = new URL(options.url ?? 'http://127.0.0.1:4173/');
assert.ok(url.protocol === 'http:' && /^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)$/.test(url.hostname), 'Utiliser la preview privée locale.');
url.searchParams.set('probe', '1');
const normalUrl = new URL(url.href); normalUrl.searchParams.delete('probe'); normalUrl.searchParams.delete('auto');
const adb = options.adb ?? path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const run = promisify(execFile);
const cases = [
  { id: 'terrain', buildings: false, shadows: false, heritage: false, bus: false },
  { id: 'buildings', buildings: true, shadows: false, heritage: false, bus: false },
  { id: 'shadows', buildings: true, shadows: true, heritage: false, bus: false },
  { id: 'heritage', buildings: true, shadows: false, heritage: true, bus: false },
  { id: 'bus', buildings: true, shadows: false, heritage: false, bus: true },
  { id: 'combined', buildings: true, shadows: false, heritage: true, bus: true },
  { id: 'buildings-repeat', buildings: true, shadows: false, heritage: false, bus: false },
];
const places = options.smoke ? ['delemont'] : ['delemont', 'porrentruy', 'saignelegier', 'saint-ursanne'];
const seconds = options.smoke ? 3 : 22;
const startedAt = new Date().toISOString();
const output = path.resolve('.vite/p5', `${startedAt.replaceAll(':', '-')}-${options.device}-${options.smoke ? 'smoke' : 'session'}.json`);
const report = { schemaVersion: 1, startedAt, mode: options.smoke ? 'smoke-preparation' : 'measurement',
  deviceCategory: options.device, preset: options.preset, url: url.href, networkDescription: options.network ?? 'Non renseigné',
  method: 'Chrome bureau sans interface' , cameraMotion: 'Commandes caméra de l’application déclenchées par script, aucun geste physique revendiqué',
  cache: 'Cache HTTP contourné sur la première visite de cet onglet, puis réactivé pour une seconde visite et le parcours; aucun cache global purgé',
  metricLimits: 'FPS Cesium sur fenêtres courtes, pauses observées par requestAnimationFrame au premier plan; mémoire JS et mémoire bâtiments Cesium, pas mémoire totale CPU/GPU; octets encodés CDP, pas trafic total du réseau',
  completed: false, phases: [], issues: [], androidSnapshots: [] };
let browser, page, client, originalQuality, cancelled = false;
process.on('SIGINT', () => { cancelled = true; });
process.on('SIGTERM', () => { cancelled = true; });
const network = { encodedBytes: 0, finishedRequests: 0, diskCacheResponses: 0, serviceWorkerResponses: 0 };
const snapshotNetwork = () => ({ ...network });
const difference = (a, b) => Object.fromEntries(Object.keys(a).map(k => [k, a[k] - b[k]]));
const save = async () => { await writeFile(output, JSON.stringify(report, null, 2) + '\n'); };
async function androidState() {
  if (!android) return;
  const observedAt = new Date().toISOString();
  try {
    const call = async (...command) => (await run(adb, ['-s', options.serial, ...command], { timeout: 8000, windowsHide: true })).stdout.trim();
    const serial = await call('get-serialno');
    assert.equal(serial, options.serial, 'L’appareil ADB ne correspond pas au numéro demandé.');
    const model = await call('shell', 'getprop', 'ro.product.model');
    const version = await call('shell', 'getprop', 'ro.build.version.release');
    const battery = await call('shell', 'dumpsys', 'battery');
    const thermal = await call('shell', 'dumpsys', 'thermalservice');
    const lowPower = await call('shell', 'settings', 'get', 'global', 'low_power');
    const number = (text, key) => { const hit = text.match(new RegExp(`^\\s*${key}:\\s*(-?\\d+)`, 'm')); return hit ? Number(hit[1]) : null; };
    const temperature = number(battery, 'temperature');
    const value = { observedAt, model, androidVersion: version, batteryPercent: number(battery, 'level'),
      batteryTemperatureC: temperature === null ? null : temperature / 10,
      usbCharging: /USB powered: true/.test(battery), acCharging: /AC powered: true/.test(battery),
      thermalStatus: number(thermal, 'Thermal Status'), lowPower: ['0','1'].includes(lowPower) ? lowPower === '1' : null };
    report.androidSnapshots.push(value); return value;
  } catch (error) {
    report.androidSnapshots.push({ observedAt, failure: error.message });
    throw new Error(`Lecture physique ADB interrompue: ${error.message}`);
  }
}
const change = async (selector, value) => page.evaluate(({ selector, value }) => {
  const input = document.querySelector(selector);
  if (input.type === 'checkbox') input.checked = value; else input.value = value;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}, { selector, value });
async function ready(requireHooks = true) {
  await page.waitForFunction(required => (!required || (window.__jura3dCamera && !window.__jura3dCamera().flyingTo)) && document.querySelector('#status')?.dataset.state === 'ready', requireHooks, { timeout: 90000 });
}
const camera = () => page.evaluate(() => ({ camera: window.__jura3dCamera(), rendering: window.__jura3dPerformance(),
  heritage: window.__jura3dHeritage(), transport: window.__jura3dTransport() }));
async function applyRequestedPreset() {
  await page.waitForFunction(() => typeof window.__jura3dCamera === 'function', undefined, { timeout: 30000 });
  await change('#quality', options.preset);
  const state = await camera();
  const expected = { low: [.6, 1], medium: [.75, 1], high: [1, 4], ultra: [1.5, 4] }[options.preset];
  assert.equal(state.camera.quality.profile, options.preset);
  assert.equal(state.rendering.resolutionScale, expected[0]); assert.equal(state.rendering.msaaSamples, expected[1]);
}
const percent = (values, p) => values.length ? [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * p)] : null;
const summarize = values => ({ samples: values.length, minimum: values.length ? Math.min(...values) : null,
  p10: percent(values, .1), median: percent(values, .5), p90: percent(values, .9), maximum: values.length ? Math.max(...values) : null });
async function measureScenario(test) {
  await change('#heritage', test.heritage); await change('#transport', test.bus);
  await change('#buildings', test.buildings); await change('#shadows', test.shadows);
  await page.waitForFunction(({ heritage, bus }) => window.__jura3dHeritage().state === (heritage ? 'ready' : 'off') && window.__jura3dTransport().state === (bus ? 'ready' : 'off'), test, { timeout: 30000 });
  await androidState();
  for (const place of places) {
    if (cancelled) throw new Error('Mesure interrompue par l’utilisateur.');
    const netBefore = snapshotNetwork(); const navigationStarted = Date.now();
    await page.evaluate(place => document.querySelector(`[data-place="${place}"]`).click(), place);
    await page.waitForFunction(place => window.__jura3dCamera().activePlace === place && !window.__jura3dCamera().flyingTo, place, { timeout: 90000 });
    await ready();
    const navigationReadyMs = Date.now() - navigationStarted;
    const before = await camera();
    const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, orientation: screen.orientation.type }));
    assert.equal(before.camera.buildingsShown, test.buildings); assert.equal(before.camera.shadowsShown, test.shadows);
    assert.equal(before.heritage.enabled, test.heritage); assert.equal(before.transport.enabled, test.bus);
    assert.equal(before.camera.quality.measuring, false, 'Auto mesure encore la qualité.');
    assert.equal(before.rendering.resolutionScale, report.rendering.resolutionScale);
    assert.equal(before.rendering.msaaSamples, report.rendering.msaaSamples);
    assert.equal(viewport.width, report.environment.viewport.width); assert.equal(viewport.height, report.environment.viewport.height);
    assert.equal(viewport.orientation, report.environment.viewport.orientation);
    await page.waitForTimeout(options.smoke ? 500 : 2000);
    await page.evaluate(() => {
      const meter = window.__p5Meter = { active: true, gaps: [], hidden: document.hidden ? 1 : 0, samples: 0, maximumGapMs: 0, previous: null };
      const sample = now => {
        if (!meter.active) return;
        if (meter.previous !== null) { const gap = now - meter.previous; meter.samples++; meter.maximumGapMs = Math.max(meter.maximumGapMs, gap); if (gap >= 100) meter.gaps.push({ atMs: now, gapMs: gap }); }
        meter.previous = now;
        if (document.hidden) meter.hidden++;
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const phase = { id: test.id, place, observedAt: new Date().toISOString(), navigationReadyMs, before, viewport, readings: [] };
    report.inProgressPhase = phase; await save();
    const samplingStarted = Date.now(); let movement = 0;
    for (let t = 0; t < seconds; t++) {
      if (cancelled) throw new Error('Mesure interrompue par l’utilisateur.');
      const moving = t >= Math.floor(seconds / 3) && t < Math.floor(2 * seconds / 3);
      if (moving && (t - Math.floor(seconds / 3)) % 2 === 0) {
        await page.evaluate(direction => document.querySelector(`[data-camera="${direction}"]`).click(), movement++ % 2 ? 'left' : 'right');
      }
      await page.waitForTimeout(1000);
      const reading = await page.evaluate(() => ({ fps: Number.parseInt(document.querySelector('.cesium-performanceDisplay-fps')?.textContent, 10),
        visible: !document.hidden, state: document.querySelector('#status').dataset.state }));
      assert.ok(reading.visible, 'Onglet passé en arrière-plan: mesure invalide.');
      assert.ok(Number.isFinite(reading.fps), 'Compteur FPS absent.');
      phase.readings.push({ elapsedMs: Date.now() - samplingStarted, moving, ...reading });
    }
    phase.samplingMs = Date.now() - samplingStarted;
    phase.mainThreadFrames = await page.evaluate(() => { window.__p5Meter.active = false; return window.__p5Meter; });
    assert.equal(phase.mainThreadFrames.hidden, 0, 'Frames observées en arrière-plan.');
    phase.fps = { idle: summarize(phase.readings.filter(v => !v.moving).map(v => v.fps)), moving: summarize(phase.readings.filter(v => v.moving).map(v => v.fps)) };
    const metrics = await client.send('Performance.getMetrics');
    phase.jsHeapUsedBytes = metrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value ?? null;
    phase.network = difference(snapshotNetwork(), netBefore); phase.after = await camera();
    const viewportAfter = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, orientation: screen.orientation.type }));
    assert.deepEqual(viewportAfter, viewport, 'Orientation ou dimensions changées pendant une phase.');
    report.phases.push(phase); delete report.inProgressPhase; await save();
    console.log(`${test.id}/${place}: ${phase.readings.length} lectures; mouvement médiane ${phase.fps.moving.median} FPS; prêt ${navigationReadyMs} ms`);
  }
}
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
try {
  report.buildIndexSha256 = createHash('sha256').update(await readFile(new URL('../dist/index.html', import.meta.url))).digest('hex');
  if (android) {
    const endpoint = new URL(options.cdp);
    assert.ok(endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(endpoint.hostname) && endpoint.port, 'CDP doit être le tunnel ADB local explicite.');
    const forwarding = (await run(adb, ['forward', '--list'], { timeout: 8000, windowsHide: true })).stdout.trim().split(/\r?\n/).map(row => row.split(/\s+/));
    assert.ok(forwarding.some(([serial, local, remote]) => serial === options.serial && local === `tcp:${endpoint.port}` && remote === 'localabstract:chrome_devtools_remote'), 'Le tunnel CDP ne correspond pas à l’appareil ADB déclaré.');
    await androidState();
    browser = await chromium.connectOverCDP(options.cdp, { timeout: 30000 });
    page = await browser.contexts()[0].newPage();
    report.method = 'Chrome Android physique par CDP, viewport et orientation non modifiés';
  } else {
    browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox'] });
    page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  }
  client = await page.context().newCDPSession(page);
  await page.bringToFront();
  await client.send('Network.enable'); await client.send('Performance.enable');
  client.on('Network.loadingFinished', event => { network.finishedRequests++; network.encodedBytes += event.encodedDataLength; });
  client.on('Network.responseReceived', event => { if (event.response.fromDiskCache) network.diskCacheResponses++; if (event.response.fromServiceWorker) network.serviceWorkerResponses++; });
  page.on('pageerror', error => report.issues.push(`page: ${error.message}`));
  page.on('response', response => { if (response.status() >= 400) report.issues.push(`HTTP ${response.status()}: ${new URL(response.url()).hostname}`); });
  await page.addInitScript(({ preset, startedAt }) => {
    window.__p5MeasurementStartedAt = startedAt;
    const originalKey = `jura3d.p5.originalQuality.${startedAt}`;
    if (sessionStorage.getItem(originalKey) === null) {
      sessionStorage.setItem(originalKey, JSON.stringify({ quality: localStorage.getItem('jura3d.quality.v1') }));
    }
    window.__p5OriginalQualityKey = originalKey;
    window.__p5OriginalQuality = JSON.parse(sessionStorage.getItem(originalKey)).quality;
    localStorage.setItem('jura3d.quality.v1', preset);
  }, { preset: options.preset, startedAt });
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  const initialStarted = Date.now(); await page.goto(normalUrl.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
  originalQuality = await page.evaluate(() => window.__p5OriginalQuality);
  report.originalQuality = originalQuality;
  await save();
  report.browser = browser.version();
  report.environment = await page.evaluate(() => ({ userAgent: navigator.userAgent, platform: navigator.platform, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, orientation: screen.orientation.type, touchPoints: navigator.maxTouchPoints } }));
  assert.equal(/Android/i.test(report.environment.userAgent), android, 'Catégorie navigateur incompatible avec l’appareil déclaré.');
  await ready(false); report.initialCacheBypassedReadyMs = Date.now() - initialStarted;
  assert.equal(await page.locator('#quality').inputValue(), options.preset, 'Preset initial normal différent.');
  // Fetch from the measured browser: Android's reverse port exists on the
  // phone, whereas Playwright's APIRequestContext would fetch from the PC.
  const indexBytes = await page.evaluate(async address => {
    const response = await fetch(address);
    if (!response.ok) throw new Error(`Index HTTP ${response.status}`);
    return [...new Uint8Array(await response.arrayBuffer())];
  }, url.href);
  assert.equal(createHash('sha256').update(Buffer.from(indexBytes)).digest('hex'), report.buildIndexSha256, 'Le serveur ne sert pas le build local identifié.');
  await client.send('Network.setCacheDisabled', { cacheDisabled: false });
  const normalStarted = Date.now(); await page.reload({ waitUntil: 'domcontentloaded' });
  await ready(false); assert.equal(await page.locator('#quality').inputValue(), options.preset, 'Preset après rechargement différent.');
  assert.equal(await page.evaluate(() => window.__p5OriginalQuality), originalQuality, 'Préférence initiale perdue au rechargement.');
  report.normalCacheReloadReadyMs = Date.now() - normalStarted;
  // Startup timings above use the ordinary page and its saved preset. The
  // separate diagnostic page starts in High; explicitly configure it before
  // comparing layers, without counting this third load as ordinary startup.
  const diagnosticStarted = Date.now(); await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await applyRequestedPreset(); await ready(); report.diagnosticReadyMs = Date.now() - diagnosticStarted;
  assert.equal(await page.evaluate(() => window.__p5OriginalQuality), originalQuality, 'Préférence initiale perdue à la navigation diagnostic.');
  report.assets = await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name).filter(n => /\/assets\/index-/.test(n)));
  await page.evaluate(() => {
    const date = new Date('2026-06-21T10:00:00Z'); const pad = n => String(n).padStart(2, '0');
    const input = document.querySelector('#datetime'); input.value = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    if (document.querySelector('#toggle-controls').getAttribute('aria-expanded') === 'true') document.querySelector('#toggle-controls').click();
  });
  assert.equal(new Date((await camera()).camera.time).getTime(), Date.parse('2026-06-21T10:00:00Z'));
  report.rendering = (await camera()).rendering;
  report.sessionStartedAt = new Date().toISOString(); const sessionStart = Date.now();
  for (const test of cases) await measureScenario(test);
  await androidState();
  report.sessionElapsedMs = Date.now() - sessionStart;
  assert.ok(options.smoke || report.sessionElapsedMs >= 600000, 'Session inférieure à dix minutes.');
  assert.deepEqual(report.issues, [], 'Erreurs observées pendant la session.');
  report.network = snapshotNetwork(); report.completed = true;
} catch (error) {
  report.failure = error.message; process.exitCode = 1;
} finally {
  report.endedAt = new Date().toISOString();
  if (page && !page.isClosed()) {
    try {
      await page.evaluate(saved => {
        if (window.__p5Meter) window.__p5Meter.active = false;
        const preference = saved === undefined ? window.__p5OriginalQuality : saved;
        if (preference === null) localStorage.removeItem('jura3d.quality.v1');
        else if (preference !== undefined) localStorage.setItem('jura3d.quality.v1', preference);
        if (window.__p5OriginalQualityKey) sessionStorage.removeItem(window.__p5OriginalQualityKey);
      }, originalQuality);
      report.preferenceRestored = true;
      if (client) {
        await client.send('Network.setCacheDisabled', { cacheDisabled: false });
        report.httpCacheRestored = true;
      }
      await page.close(); // only this script's tab
      report.testPageClosed = true;
    } catch (error) { report.cleanupFailure = error.message; process.exitCode = 1; }
  } else if (page) {
    // A dropped Android CDP transport can mark Playwright's page closed while
    // the physical Chrome tab and its saved preference still exist.
    report.cleanupFailure = 'Onglet inaccessible : restauration de préférence/cache et fermeture physique non vérifiées.';
    process.exitCode = 1;
  }
  if (browser && !android) await browser.close();
  await save();
  console.log(JSON.stringify({ output, mode: report.mode, completed: report.completed, phases: report.phases.length, failure: report.failure, cleanupFailure: report.cleanupFailure }));
}
// Disconnect the Android CDP client without sending Browser.close to the device.
process.exit(process.exitCode ?? 0);
