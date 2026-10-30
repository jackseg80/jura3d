import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.JURA3D_PROBE_OUTPUT ?? '.vite/c1/probe';
await mkdir(output, { recursive: true });
const url = new URL(process.env.JURA3D_URL ?? 'http://127.0.0.1:4333/'); url.searchParams.set('probe', '1');
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true,
  args: ['--no-sandbox', ...(process.env.JURA3D_PROBE_GPU === 'high' ? ['--force_high_performance_gpu'] : [])] });
const report = { startedAt: new Date().toISOString(), browser: browser.version(), url: url.href, completed: false, checks: [], errors: [] };
const save = () => writeFile(`${output}/probe-visual.json`, JSON.stringify(report, null, 2));
const ready = p => p.waitForFunction(() => document.querySelector('#status')?.dataset.state === 'ready', undefined, { timeout: 90000 });
const state = p => p.evaluate(() => ({ visual: window.__jura3dVisual(), camera: window.__jura3dCamera(), render: window.__jura3dPerformance() }));
const watch = p => { p.on('pageerror', e => report.errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); }); };
const open = async p => {
  await p.locator('#toggle-controls').evaluate(e => { if (e.getAttribute('aria-expanded') !== 'true') e.click(); });
  await p.locator('#visual-settings').evaluate(e => e.open = true);
};
const mode = async (p, value) => { await p.locator(`[data-visual-mode="${value}"]`).evaluate(e => e.click()); await p.waitForTimeout(500); };
const focus = async (p, view) => {
  await p.locator(`[data-visual-view="${view}"]`).evaluate(e => e.click());
  await p.waitForFunction(() => !window.__jura3dVisual().flying); await ready(p); await p.waitForTimeout(1200);
};
async function phase(name, fn) { await fn(); report.checks.push({ name, at: new Date().toISOString() }); await save(); console.log(name); }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Europe/Zurich' });
  const p = await context.newPage(); watch(p); await p.goto(url.href); await ready(p);
  report.gpu = (await state(p)).camera.quality.gpu;
  await phase('Original au démarrage et trois cadrages', async () => {
    assert.equal((await state(p)).visual.enabled, false); assert.equal((await state(p)).visual.attached, false);
    assert.equal(await p.locator('#visual-atmosphere').count(), 0);
    await open(p);
    for (const view of ['overview', 'close', 'reverse']) {
      await focus(p, view); const before = await state(p);
      await mode(p, 'trial'); const after = await state(p);
      assert.equal(after.visual.attached, true); assert.equal(after.visual.localView, true);
      for (const key of ['heading', 'pitch', 'height', 'longitude', 'latitude', 'time']) assert.equal(after.camera[key], before.camera[key], key);
      for (const key of ['screenSpaceError', 'msaaSamples', 'resolutionScale', 'triangles', 'features']) assert.equal(after.render[key], before.render[key], key);
      await p.locator('#toggle-controls').evaluate(e => { if (e.getAttribute('aria-expanded') === 'true') e.click(); });
      await p.screenshot({ path: `${output}/${view}-trial.png` });
      await mode(p, 'original'); assert.equal((await state(p)).visual.fog, before.visual.fog);
      assert.equal((await state(p)).visual.shadowMode, before.visual.shadowMode);
      await p.screenshot({ path: `${output}/${view}-original.png` });
    }
  });
  await phase('Effets indépendants, profils et sélection réelle', async () => {
    await focus(p, 'close'); await mode(p, 'trial');
    for (const profile of ['low', 'medium', 'high', 'ultra']) {
      await p.locator('#quality').evaluate((e, v) => { e.value = v; e.dispatchEvent(new Event('change')); }, profile); await ready(p);
      const s = await state(p); assert.equal(s.visual.quality, profile);
      assert.equal(s.visual.matter, profile !== 'low'); assert.equal(s.visual.castOnly, ['high', 'ultra'].includes(profile));
      assert.equal(s.visual.atmosphere, false); assert.equal(s.visual.fog, s.visual.originalFog);
    }
    await p.locator('#quality').evaluate(e => { e.value = 'high'; e.dispatchEvent(new Event('change')); });
    for (const id of ['visual-matter', 'visual-cast']) {
      await p.locator(`#${id}`).evaluate(e => { e.checked = false; e.dispatchEvent(new Event('change')); });
    }
    const s = (await state(p)).visual; assert.equal(s.matter, false); assert.equal(s.atmosphere, false); assert.equal(s.castOnly, false);
    await p.locator('#visual-cast').evaluate(e => { e.checked = true; e.dispatchEvent(new Event('change')); });
    const target = await p.evaluate(() => window.__jura3dBuildingTarget()); assert.ok(target);
    await p.mouse.click(target.x, target.y); assert.equal((await state(p)).camera.selectionKind, 'building');
    const title = await p.locator('#selection-title').textContent();
    await mode(p, 'original'); assert.equal(await p.locator('#selection-title').textContent(), title);
    await mode(p, 'trial'); assert.equal((await state(p)).camera.selectionKind, 'building');
    await p.screenshot({ path: `${output}/selection-trial.png` }); await p.locator('#clear-selection').click();
    await p.locator('#retry').evaluate(e => e.click()); await ready(p); assert.equal((await state(p)).visual.attached, true);
    await mode(p, 'original'); assert.equal((await state(p)).visual.fog, 0.15); assert.equal((await state(p)).visual.shadowMode, 1);
  });
  await phase('Parcours patrimonial et retour au centre', async () => {
    await open(p); await mode(p, 'trial');
    for (const [id, name] of [['321', 'Eglise Saint-Marcel'], ['322', 'Hôtel de ville'], ['323', 'Château']]) {
      await p.locator(`[data-visual-visit="${id}"]`).click();
      await p.waitForFunction(expected => document.querySelector('#selection-title').textContent === expected, name);
      assert.equal((await state(p)).camera.selectionKind, 'heritage');
      assert.equal(await p.locator('#selection-credit').textContent(), '© Géodonnées de la République et Canton du Jura');
      await p.locator('#clear-selection').click();
    }
    await p.locator('#visual-center').click(); await p.waitForFunction(() => !window.__jura3dVisual().flying); await ready(p);
    await p.evaluate(() => window.__jura3dLayers.setEnabled('heritage', false));
  });
  await phase('Annulation et restauration hors Delémont', async () => {
    await focus(p, 'close'); await mode(p, 'trial');
    await p.evaluate(() => { document.querySelector('[data-visual-view="reverse"]').click(); document.querySelector('[data-camera="right"]').click(); });
    assert.equal((await state(p)).visual.flying, false);
    for (const place of ['porrentruy', 'saignelegier', 'saint-ursanne', 'delemont']) {
      await open(p); await p.locator(`[data-place="${place}"]`).click();
      await p.waitForFunction(id => window.__jura3dCamera().activePlace === id && !window.__jura3dCamera().flyingTo, place); await ready(p);
      const s = (await state(p)).visual; assert.equal(s.enabled, false); assert.equal(s.attached, false);
      assert.equal(s.fog, 0.15); assert.equal(s.shadowMode, 1);
      assert.equal(await p.locator('#visual-settings').isVisible(), place === 'delemont');
    }
  });
  await context.close();
  await phase('Toucher simulé portrait et paysage, fiches et crédits', async () => {
    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, timezoneId: 'Europe/Zurich' });
    const t = await touch.newPage(); watch(t); await t.goto(url.href); await ready(t);
    for (const viewport of [{width:390,height:844},{width:722,height:320},{width:320,height:690}]) {
      await t.setViewportSize(viewport); await open(t);
      await t.locator('[data-visual-view="close"]').tap(); await t.waitForFunction(() => !window.__jura3dVisual().flying); await ready(t);
      await t.locator('[data-visual-mode="trial"]').tap();
      await t.locator('[data-visual-visit="321"]').tap(); await t.waitForFunction(() => document.querySelector('#selection-title').textContent === 'Eglise Saint-Marcel');
      await t.locator('#clear-selection').tap(); await open(t);
      assert.ok(await t.locator('.cesium-widget-credits').isVisible());
      const layout = await t.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth,
        buttons: [...document.querySelectorAll('#visual-settings button')].every(e => e.getBoundingClientRect().height >= 44),
        badgeClear: document.querySelector('.visual-badge').getBoundingClientRect().bottom < document.querySelector('.data-credits').getBoundingClientRect().top }));
      assert.equal(layout.overflow, false); assert.equal(layout.buttons, true); assert.equal(layout.badgeClear, true);
      await t.screenshot({ path: `${output}/touch-${viewport.width}x${viewport.height}.png` });
    }
    await touch.close();
  });
  assert.deepEqual(report.errors, []); report.completed = true;
} catch (error) { report.failure = error.stack; process.exitCode = 1; }
finally { report.endedAt = new Date().toISOString(); await save(); await browser.close(); console.log(JSON.stringify({ completed: report.completed, failure: report.failure, errors: report.errors })); }
