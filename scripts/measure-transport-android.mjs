// P6: physical Android comparison. Never resizes the device or closes Chrome.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const run = promisify(execFile);
const serial = process.env.JURA3D_SERIAL;
const adb = process.env.JURA3D_ADB ?? 'C:\\Users\\jacks\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const cdp = process.env.JURA3D_CDP_URL ?? 'http://127.0.0.1:9228';
const socket = process.env.JURA3D_CHROME_SOCKET ?? 'chrome_devtools_remote';
assert.match(socket, /^chrome_devtools_remote(?:_\d+)?$/);
const preset = process.env.JURA3D_PRESET ?? 'medium';
const smoke = process.argv.includes('--smoke');
assert.ok(serial, 'JURA3D_SERIAL requis');
assert.ok(['low', 'medium'].includes(preset));
const endpoint = new URL(cdp);
assert.ok(endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(endpoint.hostname));
const startedAt = new Date().toISOString();
const key = `jura3d.p6.originalQuality.${startedAt}`;
const variants = [
  { id: 'before', url: process.env.JURA3D_BEFORE_URL ?? 'http://127.0.0.1:4176/', index: '.vite/p6/before-dist/index.html' },
  { id: 'after', url: process.env.JURA3D_AFTER_URL ?? 'http://127.0.0.1:4175/', index: 'dist/index.html' },
];
for (const v of variants) {
  const u = new URL(v.url); assert.ok(u.protocol === 'http:' && u.hostname === '127.0.0.1');
  u.searchParams.set('probe', '1'); v.url = u.href;
  v.sha256 = createHash('sha256').update(await readFile(v.index)).digest('hex');
}
assert.notEqual(variants[0].sha256, variants[1].sha256, 'Versions identiques');
const report = { startedAt, category: 'android-physical', serial, preset, smoke, variants,
  method: 'USB/CDP, écran physique sans redimensionnement, ordre avant/après inversé une localité sur deux',
  limits: 'FPS Cesium, pauses RAF et callbacks CPU ; pas de mesure GPU ni mémoire totale, USB en charge, réseau/caches et fréquences non verrouillés',
  completed: false, phases: [], androidSnapshots: [], issues: [], originalPreferences: {}, cleanup: {} };
report.scriptSha256 = createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex');
await mkdir('.vite/p6', { recursive: true });
const output = `.vite/p6/${startedAt.replaceAll(':', '-')}-android-${smoke ? 'smoke' : 'comparison'}.json`;
const save = () => writeFile(output, JSON.stringify(report, null, 2) + '\n');
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
const command = async (...args) => (await run(adb, ['-s', serial, ...args], { timeout: 10000, windowsHide: true })).stdout.trim();
const number = (text, field) => { const m = text.match(new RegExp(`^\\s*${field}:\\s*(-?\\d+)`, 'm')); return m ? Number(m[1]) : null; };
const summary = values => {
  const a = values.filter(Number.isFinite).sort((x, y) => x - y);
  const q = p => a[Math.floor((a.length - 1) * p)] ?? null;
  return { n: a.length, min: a[0] ?? null, p10: q(.1), median: q(.5), p90: q(.9), max: a.at(-1) ?? null };
};
async function physicalState() {
  assert.equal(await command('get-serialno'), serial);
  const model = await command('shell', 'getprop', 'ro.product.model');
  const battery = await command('shell', 'dumpsys', 'battery');
  const thermal = await command('shell', 'dumpsys', 'thermalservice');
  const lowPower = await command('shell', 'settings', 'get', 'global', 'low_power');
  const activity = await command('shell', 'dumpsys', 'activity', 'activities');
  const resumed = activity.split(/\r?\n/).find(line => line.includes('topResumedActivity=')) ?? '';
  const temperature = number(battery, 'temperature');
  const snapshot = { observedAt: new Date().toISOString(), model,
    batteryPercent: number(battery, 'level'), batteryTemperatureC: temperature === null ? null : temperature / 10,
    usbCharging: /USB powered: true/.test(battery), thermalStatus: number(thermal, 'Thermal Status'), lowPower,
    chromeForeground: resumed.includes('com.android.chrome/') };
  report.androidSnapshots.push(snapshot); await save();
  assert.ok(snapshot.thermalStatus !== null && snapshot.thermalStatus < 2, 'Appareil en limitation thermique : arrêter la comparaison');
  assert.equal(lowPower, '0', 'Économie active : conditions à clarifier');
  assert.ok(snapshot.chromeForeground, 'Chrome Android n’est pas au premier plan');
  return snapshot;
}
let browser, page, client;
let interrupted = false;
process.on('SIGINT', () => { interrupted = true; });
const ready = async () => {
  await page.waitForFunction(() => window.__jura3dCamera && !window.__jura3dCamera().flyingTo
    && ['ready', 'error'].includes(document.querySelector('#status')?.dataset.state), undefined, { timeout: 90000 });
  const state = await page.locator('#status').getAttribute('data-state');
  assert.equal(state, 'ready', await page.locator('#status').textContent());
};
const environment = () => page.evaluate(() => ({ userAgent: navigator.userAgent,
  width: innerWidth, height: innerHeight, dpr: devicePixelRatio, orientation: screen.orientation.type,
  camera: window.__jura3dCamera(), rendering: window.__jura3dPerformance() }));
const checkEnvironment = current => {
  assert.match(current.userAgent, /Android/);
  assert.equal(current.camera.quality.profile, preset);
  assert.equal(current.camera.quality.measuring, false);
  for (const field of ['width', 'height', 'dpr', 'orientation']) assert.equal(current[field], report.environment[field], `${field} modifié`);
  assert.equal(current.camera.quality.gpu, report.environment.camera.quality.gpu);
  assert.equal(current.camera.time, report.environment.camera.time);
  for (const field of ['resolutionScale', 'msaaSamples', 'screenSpaceError']) assert.equal(current.rendering[field], report.environment.rendering[field]);
};
try {
  const forwards = (await run(adb, ['forward', '--list'], { timeout: 10000, windowsHide: true })).stdout;
  assert.ok(forwards.split(/\r?\n/).some(row => row.trim().split(/\s+/).join(' ') === `${serial} tcp:${endpoint.port} localabstract:${socket}`), 'Tunnel CDP non associé à cet appareil');
  await physicalState();
  browser = await chromium.connectOverCDP(cdp, { timeout: 20000 });
  report.browser = browser.version();
  report.androidVersion = await command('shell', 'getprop', 'ro.build.version.release');
  report.chromeSocket = socket;
  page = await browser.contexts()[0].newPage();
  client = await page.context().newCDPSession(page); await client.send('Performance.enable');
  report.targetId = (await client.send('Target.getTargetInfo')).targetInfo.targetId;
  page.on('pageerror', e => report.issues.push(e.message));
  page.on('response', r => { if (r.status() >= 400) report.issues.push(`HTTP ${r.status()} ${new URL(r.url()).hostname}`); });
  page.on('requestfailed', r => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') report.issues.push(`${r.failure()?.errorText} ${new URL(r.url()).hostname}`); });
  await page.addInitScript(({ key, preset, startedAt }) => {
    window.__p6AndroidStartedAt = startedAt;
    if (sessionStorage.getItem(key) === null) sessionStorage.setItem(key, JSON.stringify({ quality: localStorage.getItem('jura3d.quality.v1') }));
    localStorage.setItem('jura3d.quality.v1', preset);
    const nativeRaf = requestAnimationFrame.bind(window);
    const meter = window.__p6aMeter = { active: false, cpu: new Map(), gaps: [], hidden: 0, previous: null };
    window.requestAnimationFrame = callback => nativeRaf(timestamp => {
      const start = performance.now();
      try { callback(timestamp); } finally { if (meter.active) meter.cpu.set(timestamp, (meter.cpu.get(timestamp) ?? 0) + performance.now() - start); }
    });
    const sample = timestamp => {
      if (meter.active) {
        if (meter.previous !== null) meter.gaps.push(timestamp - meter.previous);
        meter.previous = timestamp; if (document.hidden) meter.hidden++;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }, { key, preset, startedAt });
  const modes = [
    { id: 'off', enabled: false }, { id: 'stops', enabled: true, stops: true, lines: false },
    { id: 'lines', enabled: true, stops: false, lines: true }, { id: 'all', enabled: true, stops: true, lines: true },
    { id: 'off-repeat', enabled: false },
  ];
  const places = smoke ? ['delemont'] : ['delemont', 'porrentruy', 'saignelegier', 'saint-ursanne'];
  for (let index = 0; index < places.length; index++) {
    const place = places[index];
    for (const variant of index % 2 ? [...variants].reverse() : variants) {
      if (interrupted) throw new Error('Interruption demandée');
      report.stage = { variant: variant.id, place, action: 'navigation', at: new Date().toISOString() }; await save();
      await page.bringToFront(); await page.goto(variant.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      report.originalPreferences[new URL(variant.url).origin] = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).quality, key); await save();
      await page.waitForFunction(() => typeof window.__jura3dCamera === 'function');
      await page.evaluate(preset => {
        const q = document.querySelector('#quality'); q.value = preset; q.dispatchEvent(new Event('change', { bubbles: true }));
        if (document.querySelector('#toggle-controls').getAttribute('aria-expanded') === 'true') document.querySelector('#toggle-controls').click();
      }, preset);
      await ready();
      const served = await page.evaluate(async () => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await (await fetch('./')).arrayBuffer()))).map(x => x.toString(16).padStart(2, '0')).join(''));
      assert.equal(served, variant.sha256, 'Version servie différente');
      const initial = await environment(); report.environment ??= initial; checkEnvironment(initial);
      await physicalState();
      for (const mode of smoke ? modes.filter(m => ['off', 'lines', 'all'].includes(m.id)) : modes) {
        if (interrupted) throw new Error('Interruption demandée');
        report.inProgress = { variant: variant.id, place, mode: mode.id, at: new Date().toISOString() }; await save();
        await page.evaluate(({ place, mode }) => {
          const change = (id, value) => { const e = document.getElementById(id); e.checked = value; e.dispatchEvent(new Event('change', { bubbles: true })); };
          change('heritage', false); change('shadows', false); change('buildings', true); change('transport', mode.enabled);
          if (mode.enabled) { change('transport-stops', mode.stops); change('transport-lines', mode.lines); change('transport-zones', false); }
          document.querySelector(`[data-place="${place}"]`).click();
        }, { place, mode });
        await ready(); await page.waitForFunction(enabled => window.__jura3dTransport().state === (enabled ? 'ready' : 'off'), mode.enabled);
        await page.waitForTimeout(smoke ? 500 : 2200);
        for (let n = 0; n < (smoke ? 2 : 4); n++) {
          await page.evaluate(n => document.querySelector(`[data-camera="${n % 2 ? 'left' : 'right'}"]`).click(), n);
          await page.waitForTimeout(700);
        }
        await ready(); await page.waitForTimeout(1000); checkEnvironment(await environment());
        await page.evaluate(() => { const m = window.__p6aMeter; m.cpu.clear(); m.gaps = []; m.hidden = 0; m.previous = null; m.active = true; });
        const readings = [], sampleStarted = Date.now();
        for (let n = 0; n < (smoke ? 3 : 10); n++) {
          if (interrupted) throw new Error('Interruption demandée');
          await page.evaluate(n => document.querySelector(`[data-camera="${n % 2 ? 'left' : 'right'}"]`).click(), n);
          await page.waitForTimeout(1000);
          const reading = await page.evaluate(() => ({ fps: Number.parseFloat(document.querySelector('.cesium-performanceDisplay-fps')?.textContent), state: document.querySelector('#status').dataset.state, visible: !document.hidden }));
          assert.ok(reading.visible && Number.isFinite(reading.fps), 'Mesure masquée ou compteur absent'); assert.notEqual(reading.state, 'error');
          readings.push({ elapsedMs: Date.now() - sampleStarted, ...reading });
        }
        const measured = await page.evaluate(() => { const m = window.__p6aMeter; m.active = false; return { cpu: [...m.cpu.values()], gaps: m.gaps, hidden: m.hidden, transport: window.__jura3dTransport() }; });
        assert.equal(measured.hidden, 0); const final = await environment(); checkEnvironment(final); await ready();
        report.phases.push({ variant: variant.id, place, mode: mode.id, readings, fps: summary(readings.map(r => r.fps)), cpuRafMs: summary(measured.cpu),
          frameGapMs: summary(measured.gaps), pausesOver100ms: measured.gaps.filter(g => g >= 100).length,
          environment: final, transport: { ...measured.transport, filtered: measured.transport.filtered.reduce((a, f) => { a[f.kind] = (a[f.kind] ?? 0) + 1; return a; }, {}) } });
        delete report.inProgress; await save(); console.log(`${variant.id}/${place}/${mode.id}: ${report.phases.at(-1).fps.median} FPS`);
      }
      await physicalState();
    }
  }
  assert.equal(report.phases.length, smoke ? 6 : 40); assert.deepEqual(report.issues, []); report.completed = true;
} catch (error) { report.failure = error.message; process.exitCode = 1; }
finally {
  if (page && !page.isClosed()) {
    try {
      const pending = await page.evaluate(key => ({ origin: location.origin, stored: sessionStorage.getItem(key) }), key);
      if (pending.stored !== null && !Object.hasOwn(report.originalPreferences, pending.origin)) {
        report.originalPreferences[pending.origin] = JSON.parse(pending.stored).quality;
      }
      for (const [origin, quality] of Object.entries(report.originalPreferences)) {
        // Static JSON stops the 3D renderer before restoring each origin.
        // Chrome's JSON viewer need not emit the usual DOMContentLoaded event.
        await page.goto(`${origin}/jura/transport-link-checks.json`, { waitUntil: 'commit', timeout: 15000 });
        const restored = await page.evaluate(({ quality, key }) => {
          if (quality === null) localStorage.removeItem('jura3d.quality.v1'); else localStorage.setItem('jura3d.quality.v1', quality);
          sessionStorage.removeItem(key);
          return localStorage.getItem('jura3d.quality.v1');
        }, { quality, key });
        assert.equal(restored, quality, 'Préférence non restaurée');
        report.cleanup[origin] = { preferenceRestored: true };
      }
      await page.close(); report.testPageClosed = true;
    } catch (error) { report.cleanupFailure = error.message; process.exitCode = 1; }
  } else if (page) { report.cleanupFailure = 'Onglet inaccessible : restauration et fermeture physique non vérifiées'; process.exitCode = 1; }
  report.endedAt = new Date().toISOString(); await save();
  console.log(JSON.stringify({ output, completed: report.completed, phases: report.phases.length, failure: report.failure, cleanupFailure: report.cleanupFailure }));
}
// Disconnect the CDP client by ending this process, never Browser.close Android.
process.exit(process.exitCode ?? 0);
