// P6 desktop comparison. Never a substitute for a physical Android benchmark.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const label = process.argv[2];
assert.ok(label && /^[a-z0-9-]+$/.test(label), 'Label requis : before, after, etc.');
const url = new URL(process.env.JURA3D_URL ?? 'http://127.0.0.1:4300/');
url.searchParams.set('probe', '1');
const startedAt = new Date().toISOString();
await mkdir('.vite/p6', { recursive: true });
const output = `.vite/p6/${startedAt.replaceAll(':', '-')}-${label}.json`;
const report = { startedAt, label, url: url.href, method: 'Chrome Windows physique sans interface, GPU PC ; aucun appareil Android',
  limits: 'Instrumentation identique avant/après ; FPS plafonnés par le rafraîchissement. CPU = callbacks RAF et métriques CDP, pas profil complet ; GPU = timer WebGL de la scène entière si disponible, pas coût isolé de la couche.',
  completed: false, phases: [], issues: [] };
const save = () => writeFile(output, JSON.stringify(report, null, 2) + '\n');
const quantiles = values => { const a = values.filter(Number.isFinite).sort((a, b) => a - b); return { n: a.length,
  median: a[Math.floor((a.length - 1) * .5)] ?? null, p90: a[Math.floor((a.length - 1) * .9)] ?? null }; };
let browser;
try {
  browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 753, height: 1030 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    const nativeRaf = window.requestAnimationFrame.bind(window);
    const timing = window.__p6Timing = { active: false, cpu: new Map(), fps: [], gpu: [], disjoint: 0, draws: 0, frames: 0 };
    window.requestAnimationFrame = callback => nativeRaf(timestamp => {
      const start = performance.now();
      try { callback(timestamp); } finally { if (timing.active) timing.cpu.set(timestamp, (timing.cpu.get(timestamp) ?? 0) + performance.now() - start); }
    });
  });
  const page = await context.newPage();
  page.on('pageerror', e => report.issues.push(e.message));
  page.on('response', r => { if (r.status() >= 400) report.issues.push(`HTTP ${r.status()} ${new URL(r.url()).hostname}`); });
  page.on('requestfailed', r => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') report.issues.push(`${r.failure()?.errorText} ${new URL(r.url()).hostname}`); });
  const client = await context.newCDPSession(page); await client.send('Performance.enable');
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  const ready = () => page.waitForFunction(() => document.querySelector('#status')?.dataset.state === 'ready' && !window.__jura3dCamera().flyingTo, undefined, { timeout: 90000 });
  await ready(); await page.locator('#quality').selectOption('medium');
  await ready();
  report.browser = browser.version();
  report.buildSha256 = createHash('sha256').update(await readFile('dist/index.html')).digest('hex');
  const servedHash = await page.evaluate(async () => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await (await fetch('./')).arrayBuffer()))).map(x => x.toString(16).padStart(2, '0')).join(''));
  assert.equal(servedHash, report.buildSha256);
  report.environment = await page.evaluate(() => ({ camera: window.__jura3dCamera(), rendering: window.__jura3dPerformance(), width: innerWidth, height: innerHeight, dpr: devicePixelRatio }));
  if (process.argv[3]) {
    const reference = JSON.parse(await readFile(process.argv[3], 'utf8'));
    assert.equal(reference.completed, true, 'Référence incomplète');
    for (const field of ['width', 'height', 'dpr']) assert.equal(report.environment[field], reference.environment[field], `Fenêtre différente : ${field}`);
    assert.equal(report.environment.camera.quality.gpu, reference.environment.camera.quality.gpu, 'GPU différent de la référence');
    assert.equal(report.environment.camera.time, reference.environment.camera.time, 'Heure solaire différente');
    for (const field of ['resolutionScale', 'msaaSamples', 'screenSpaceError']) assert.equal(report.environment.rendering[field], reference.environment.rendering[field], `Rendu différent : ${field}`);
    report.reference = process.argv[3];
  }
  report.gpuTimer = await page.evaluate(() => {
    const timing = window.__p6Timing;
    const canvas = document.querySelector('.cesium-widget canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return { supported: false, reason: 'WebGL2 absent' };
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const pending = []; let current; let lastFps = 0;
    // Start at the first rendering command, not at the end of the previous RAF:
    // a query spanning the idle interval would not measure this frame's GPU work.
    for (const name of ['clear', 'drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const original = gl[name].bind(gl);
      gl[name] = (...args) => {
        if (timing.active) {
          if (name !== 'clear') timing.draws++;
          if (ext && !current && !gl.getQuery(ext.TIME_ELAPSED_EXT, gl.CURRENT_QUERY)) { current = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, current); }
        }
        return original(...args);
      };
    }
    function frame() {
      if (current) { gl.endQuery(ext.TIME_ELAPSED_EXT); pending.push(current); current = undefined; }
      const disjoint = ext && gl.getParameter(ext.GPU_DISJOINT_EXT);
      for (let i = pending.length - 1; i >= 0; i--) {
        const q = pending[i];
        if (disjoint || gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) {
          if (timing.active && !disjoint) timing.gpu.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
          if (disjoint) timing.disjoint++;
          gl.deleteQuery(q); pending.splice(i, 1);
        }
      }
      if (timing.active) {
        timing.frames++;
        if (performance.now() - lastFps > 1000) { const text = document.querySelector('.cesium-performanceDisplay-fps')?.textContent; timing.fps.push(Number.parseFloat(text)); lastFps = performance.now(); }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return { supported: !!ext, scope: 'Du premier clear/draw au callback suivant le rendu de la scène ; attente inter-frame exclue, aucun gl.finish, queries disjoint exclues' };
  });
  const metrics = async () => Object.fromEntries((await client.send('Performance.getMetrics')).metrics.filter(x => ['TaskDuration', 'ScriptDuration', 'JSHeapUsedSize'].includes(x.name)).map(x => [x.name, x.value]));
  const modes = [{ id: 'off', enabled: false }, { id: 'stops', enabled: true, stops: true, lines: false },
    { id: 'lines', enabled: true, stops: false, lines: true }, { id: 'all', enabled: true, stops: true, lines: true }, { id: 'off-repeat', enabled: false }];
  for (const place of ['delemont', 'porrentruy', 'saignelegier', 'saint-ursanne']) {
    for (const mode of modes) {
      await page.evaluate(({ place, mode }) => {
        const change = (id, value) => { const e = document.getElementById(id); e.checked = value; e.dispatchEvent(new Event('change', { bubbles: true })); };
        change('heritage', false); change('shadows', false); change('buildings', true);
        change('transport', mode.enabled);
        if (mode.enabled) { change('transport-stops', mode.stops); change('transport-lines', mode.lines); change('transport-zones', false); }
        document.querySelector(`[data-place="${place}"]`).click();
      }, { place, mode });
      await ready();
      await page.waitForFunction(enabled => window.__jura3dTransport().state === (enabled ? 'ready' : 'off'), mode.enabled, { timeout: 30000 });
      await page.waitForTimeout(2200);
      assert.equal(await page.evaluate(() => window.__jura3dCamera().quality.profile), 'medium');
      // Warm the same camera motion before sampling; newly exposed terrain can
      // legitimately make the application report "loading" during a rotation.
      for (let i = 0; i < 4; i++) {
        await page.evaluate(i => document.querySelector(`[data-camera="${i % 2 ? 'left' : 'right'}"]`).click(), i);
        await page.waitForTimeout(700);
      }
      await ready(); await page.waitForTimeout(1000);
      const before = await metrics();
      await page.evaluate(() => { const t = window.__p6Timing; t.cpu.clear(); t.gpu = []; t.fps = []; t.draws = t.frames = t.disjoint = 0; t.active = true; });
      const sampleStart = Date.now();
      const sampleStates = [];
      for (let i = 0; i < 8; i++) {
        await page.evaluate(i => document.querySelector(`[data-camera="${i % 2 ? 'left' : 'right'}"]`).click(), i);
        await page.waitForTimeout(1000);
        sampleStates.push(await page.locator('#status').getAttribute('data-state'));
      }
      const samples = await page.evaluate(() => { const t = window.__p6Timing; t.active = false; return { cpu: [...t.cpu.values()], gpu: t.gpu, fps: t.fps, draws: t.draws, frames: t.frames, disjoint: t.disjoint,
        camera: window.__jura3dCamera(), transport: window.__jura3dTransport(), rendering: window.__jura3dPerformance(), state: document.querySelector('#status').dataset.state, visible: !document.hidden }; });
      const after = await metrics(); assert.ok(samples.visible); assert.ok(!sampleStates.includes('error'));
      await ready();
      report.phases.push({ place, mode: mode.id, sampleMs: Date.now() - sampleStart, cpuRafMs: quantiles(samples.cpu), gpuMs: quantiles(samples.gpu), fps: quantiles(samples.fps),
        sampleStates,
        drawCallsPerFrame: samples.frames ? samples.draws / samples.frames : null, disjoint: samples.disjoint,
        taskSeconds: after.TaskDuration - before.TaskDuration, scriptSeconds: after.ScriptDuration - before.ScriptDuration,
        heapBytes: after.JSHeapUsedSize, camera: samples.camera, rendering: samples.rendering,
        transport: { ...samples.transport, filtered: samples.transport.filtered.reduce((n, item) => { n[item.kind] = (n[item.kind] ?? 0) + 1; return n; }, {}) } });
      await save(); console.log(`${label}/${place}/${mode.id}: CPU RAF ${report.phases.at(-1).cpuRafMs.median?.toFixed(2)} ms, GPU ${report.phases.at(-1).gpuMs.median?.toFixed(2) ?? 'indisponible'} ms`);
    }
  }
  assert.deepEqual(report.issues, []); report.completed = true;
} catch (e) { report.failure = e.message; process.exitCode = 1; }
finally { if (browser) await browser.close(); report.endedAt = new Date().toISOString(); await save(); console.log(JSON.stringify({ output, completed: report.completed, phases: report.phases.length, failure: report.failure })); }
