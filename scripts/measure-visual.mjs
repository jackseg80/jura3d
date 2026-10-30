import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.JURA3D_MEASURE_OUTPUT ?? '.vite/c1/measure';
await mkdir(output, { recursive: true });
const seconds = Number(process.env.JURA3D_MEASURE_SECONDS ?? 10);
assert.ok(seconds >= 6 && seconds <= 30);
const settleMs = Number(process.env.JURA3D_SETTLE_MS ?? 1800);
assert.ok(settleMs >= 1800 && settleMs <= 15000);
const requestedVariants = process.env.JURA3D_VARIANTS?.split(',');
if (requestedVariants) {
  assert.equal(requestedVariants[0], 'original-before'); assert.equal(requestedVariants.at(-1), 'original-after');
  assert.ok(requestedVariants.every(v => ['original-before','palette','matter','cast','full','original-after'].includes(v)));
}
const url = new URL(process.env.JURA3D_URL ?? 'http://127.0.0.1:4333/jura3d/jura/'); url.searchParams.set('probe', '1');
const profiles = (process.env.JURA3D_PROFILES ?? 'low,high').split(',');
const views = (process.env.JURA3D_VIEWS ?? 'overview,close,reverse').split(',');
assert.ok(profiles.every(p => ['low', 'high'].includes(p)));
assert.ok(views.every(v => ['overview', 'close', 'reverse'].includes(v)));
const args = ['--no-sandbox', ...(process.env.JURA3D_PROBE_GPU === 'high' ? ['--force_high_performance_gpu']
  : process.env.JURA3D_PROBE_GPU === 'low' ? ['--force_low_power_gpu'] : [])];
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args });
const report = { startedAt: new Date().toISOString(), processId: process.pid, browser: browser.version(), url: url.href,
  timezone: 'Europe/Zurich', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  seconds, settleMs, requestedVariants, profiles, views, effects: 'palette, matter, cast-only; no atmosphere override', gpuPreference: process.env.JURA3D_PROBE_GPU ?? 'default',
  cachePolicy: 'New browser context; network/cache not purged; repeated views warmed. Not a cold-network benchmark.',
  completed: false, phases: [], errors: [] };
const save = () => writeFile(`${output}/measure-visual.json`, JSON.stringify(report, null, 2));
process.once('SIGINT', async () => { report.interrupted = true; report.endedAt = new Date().toISOString(); await save(); await browser.close(); process.exit(130); });
const ready = p => p.waitForFunction(() => document.querySelector('#status')?.dataset.state === 'ready'
  && !window.__jura3dVisual().flying && window.__jura3dCamera().buildingsLoaded && window.__jura3dCamera().globeLoaded,
  undefined, { timeout: 90000 });
const state = p => p.evaluate(() => ({ visual: window.__jura3dVisual(), camera: window.__jura3dCamera(),
  render: window.__jura3dPerformance(), layers: window.__jura3dLayers.snapshot(), visibility: document.visibilityState }));
const median = a => { const s = [...a].sort((x,y) => x-y); return s.length % 2 ? s[(s.length-1)/2] : (s[s.length/2-1] + s[s.length/2])/2; };
const percentile = (a, p) => [...a].sort((x,y) => x-y)[Math.min(a.length-1, Math.floor(a.length*p))];
try {
  const context = await browser.newContext({ viewport: report.viewport, deviceScaleFactor: 1, timezoneId: report.timezone });
  const p = await context.newPage();
  p.on('pageerror', e => report.errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  const started = Date.now(); await p.goto(url.href); await ready(p); report.initialReadyMs = Date.now() - started;
  report.gpu = (await state(p)).camera.quality.gpu; report.userAgent = await p.evaluate(() => navigator.userAgent);
  await p.locator('#visual-settings').evaluate(e => e.open = true);
  await p.locator('#toggle-controls').evaluate(e => { if (e.getAttribute('aria-expanded') === 'true') e.click(); });
  for (const profile of profiles) for (const view of views) {
    await p.locator('#quality').evaluate((e, value) => { e.value = value; e.dispatchEvent(new Event('change')); }, profile);
    await p.locator(`[data-visual-view="${view}"]`).evaluate(e => e.click()); await ready(p);
    const warmStarted = Date.now();
    for (const angle of [0.24, 0.48, seconds * 0.08, 0]) {
      await p.evaluate(a => window.__jura3dVisualOrbit(a), angle); await ready(p);
    }
    const warmMs = Date.now() - warmStarted;
    const variants = requestedVariants ?? (profile === 'low' ? ['original-before', 'palette', 'original-after']
      : ['original-before', 'palette', 'matter', 'full', 'original-after']);
    for (const variant of variants) for (const movement of ['fixed', 'orbit']) {
      await p.evaluate(({variant}) => {
        const original = variant.startsWith('original');
        for (const [id, checked] of [
          ['visual-matter', ['matter','cast','full'].includes(variant)],
          ['visual-cast', ['cast','full'].includes(variant)],
        ]) { const e = document.getElementById(id); e.checked = checked; e.dispatchEvent(new Event('change')); }
        document.querySelector(`[data-visual-mode="${original ? 'original' : 'trial'}"]`).click();
        window.__jura3dVisualOrbit(0);
      }, {variant});
      const settleStarted = Date.now(); await ready(p); await p.waitForTimeout(settleMs);
      const before = await state(p);
      assert.equal(before.visibility, 'visible'); assert.equal(before.camera.time, '2026-06-21T14:00:00Z');
      assert.equal(before.camera.quality.profile, profile); assert.equal(before.render.resolutionScale, profile === 'low' ? .6 : 1);
      assert.ok(before.layers.layers.every(layer => !layer.enabled));
      await p.evaluate(({movement}) => {
        const gaps = [], readings = []; let stopped = false, last = performance.now(); const start = last;
        function frame(t) {
          gaps.push(t-last); last=t;
          if (movement === 'orbit') window.__jura3dVisualOrbit((t-start)/1000 * .08);
          if (!stopped) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        const timer = setInterval(() => readings.push({ at: performance.now()-start,
          fps: parseInt(document.querySelector('.cesium-performanceDisplay-fps')?.textContent,10) || null,
          state: document.querySelector('#status').dataset.state,
          buildingsLoaded: window.__jura3dCamera().buildingsLoaded, globeLoaded: window.__jura3dCamera().globeLoaded }), 1000);
        window.__stopVisualMeasure = () => { stopped=true; clearInterval(timer); return {gaps,readings}; };
      }, {movement});
      await p.waitForTimeout(seconds * 1000 + 80);
      const raw = await p.evaluate(() => window.__stopVisualMeasure()); const after = await state(p);
      const fps = raw.readings.map(r=>r.fps).filter(Number.isFinite); assert.ok(fps.length >= seconds-1);
      const phase = { profile, view, variant, movement, warmMs, settleMs: Date.now()-settleStarted-seconds*1000-80,
        before, after, readings: raw.readings, fpsMedian: median(fps), fpsMin: Math.min(...fps),
        frameP95Ms: percentile(raw.gaps,.95), maxGapMs: Math.max(...raw.gaps),
        gapsAtLeast100ms: raw.gaps.filter(n=>n>=100).length, frameCount: raw.gaps.length,
        loadingReadings: raw.readings.filter(r=>!r.buildingsLoaded || !r.globeLoaded).length };
      if (movement === 'fixed' && ['original-before','full'].includes(variant) || movement === 'fixed' && profile === 'low' && variant === 'palette') {
        phase.screenshot = `${profile}-${view}-${variant}.png`; await p.screenshot({path:`${output}/${phase.screenshot}`});
      }
      report.phases.push(phase); await save();
      console.log(JSON.stringify({profile,view,variant,movement,fps:phase.fpsMedian,p95:phase.frameP95Ms,pauses:phase.gapsAtLeast100ms,loading:phase.loadingReadings}));
    }
  }
  report.comparisons = [];
  for (const profile of profiles) for (const view of views) for (const movement of ['fixed','orbit']) {
    const phases = report.phases.filter(p=>p.profile===profile&&p.view===view&&p.movement===movement);
    const originals = phases.filter(p=>p.variant.startsWith('original'));
    const referenceFps = median(originals.map(p=>p.fpsMedian));
    for (const phase of phases.filter(p=>!p.variant.startsWith('original'))) report.comparisons.push({profile,view,movement,variant:phase.variant,
      originalBefore:originals[0].fpsMedian, originalAfter:originals[1].fpsMedian, referenceFps,
      fps:phase.fpsMedian, changePercent:(phase.fpsMedian/referenceFps-1)*100,
      pauseDelta:phase.gapsAtLeast100ms-Math.max(...originals.map(p=>p.gapsAtLeast100ms)),
      referenceDriftPercent:(originals[1].fpsMedian/originals[0].fpsMedian-1)*100,
      loaded:phase.loadingReadings===0&&originals.every(p=>p.loadingReadings===0)});
  }
  assert.deepEqual(report.errors, []); report.completed = true;
} catch(error) {report.failure=error.stack; process.exitCode=1;}
finally {report.endedAt=new Date().toISOString(); await save(); await browser.close(); console.log(JSON.stringify({completed:report.completed,phases:report.phases.length,failure:report.failure}));}
