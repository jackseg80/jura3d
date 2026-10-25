import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true,
  args: ['--no-sandbox', ...(process.env.JURA3D_PROBE_GPU === 'high' ? ['--force_high_performance_gpu'] : [])] });
const report = { checkedAt: new Date().toISOString(), completed: false, errors: [], checks: [] };
const url = new URL(process.env.JURA3D_URL ?? 'http://127.0.0.1:4300/'); url.searchParams.set('probe', '1');
const ready = p => p.waitForFunction(() => document.querySelector('#status').dataset.state === 'ready', undefined, { timeout: 90000 });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  page.on('pageerror', e => report.errors.push(e.message));
  const requests = [];
  page.on('request', r => { if (r.url().includes('/jura/')) requests.push(r.url()); });
  await page.goto(url.href); await ready(page);
  const territory = await page.evaluate(() => window.__jura3dTerritory());
  report.territory = territory;
  assert.equal(requests.length, 0, 'aucun GeoJSON avant activation');
  if (territory.id === 'navigation-control') {
    assert.deepEqual(territory.places, ['porrentruy', 'saignelegier']);
    assert.deepEqual(territory.layers, []);
    assert.match(await page.title(), /Contrôle P7/);
    assert.equal(await page.locator('[data-place]').count(), 2);
    for (const id of ['heritage', 'transport']) assert.equal(await page.locator(`#${id}-settings`).isVisible(), false);
    assert.equal(await page.locator('#heritage-credit').isVisible(), false);
    const initial = await page.evaluate(() => window.__jura3dCamera());
    assert.equal(initial.activePlace, 'porrentruy');
    await page.locator('[data-place="saignelegier"]').click();
    await page.waitForFunction(() => window.__jura3dCamera().activePlace === 'saignelegier' && !window.__jura3dCamera().flyingTo);
    await ready(page); await page.locator('#home').click();
    await page.waitForFunction(() => window.__jura3dCamera().activePlace === 'porrentruy' && !window.__jura3dCamera().flyingTo); await ready(page);
    const returned = await page.evaluate(() => window.__jura3dCamera());
    assert.ok(Math.abs(initial.longitude - returned.longitude) < 1e-7);
    assert.ok(Math.abs(initial.latitude - returned.latitude) < 1e-7);
    assert.equal(requests.length, 0);
    report.checks.push('configuration alternative : titre, destinations, départ, retour initial, absence de couches/requêtes');
  } else {
    assert.equal(territory.id, 'jura');
    for (const id of ['heritage', 'transport']) {
      await page.evaluate(id => window.__jura3dLayers.setEnabled(id, true), id);
      await page.waitForFunction(id => window.__jura3dLayers.snapshot().layers.find(l => l.id === id).state === 'ready', id);
      const count = requests.length;
      const before = await page.evaluate(id => window.__jura3dLayers.snapshot().layers.find(l => l.id === id), id);
      await page.evaluate(id => window.__jura3dLayers.refresh(id), id);
      const after = await page.evaluate(id => window.__jura3dLayers.snapshot().layers.find(l => l.id === id), id);
      assert.equal(before.entityCount, after.entityCount); assert.equal(before.total, after.total);
      assert.equal(requests.length, count, 'refresh statique utilise le cache validé');
      await page.evaluate(id => window.__jura3dLayers.setEnabled(id, false), id);
    }
    await page.evaluate(async () => { await window.__jura3dLayers.setEnabled('heritage', true); await window.__jura3dLayers.setEnabled('transport', true); });
    await page.evaluate(() => { window.__jura3dLayers.destroy(); window.__jura3dLayers.destroy(); });
    assert.deepEqual(await page.evaluate(() => window.__jura3dLayers.snapshot()), { destroyed: true, layers: [] });
    const cleared = await page.evaluate(() => ({ heritage: window.__jura3dHeritage(), transport: window.__jura3dTransport() }));
    assert.equal(cleared.heritage.sourceCount, 0); assert.equal(cleared.transport.sourceCount, 0);
    await page.locator('#heritage').evaluate(e => { e.checked = true; e.dispatchEvent(new Event('change')); });
    assert.equal((await page.evaluate(() => window.__jura3dHeritage())).state, 'off', 'écouteurs retirés');
    report.checks.push('activation, cache/refresh, désactivation, destruction idempotente, sources et écouteurs retirés');
    // Détruire pendant le réseau puis libérer les réponses : aucune résurrection.
    const pending = await browser.newPage();
    pending.on('pageerror', e => report.errors.push(e.message));
    let release; const gate = new Promise(resolve => { release = resolve; }); let intercepted = 0;
    await pending.route('**/jura/*', async route => {
      intercepted++; await gate;
      try { await route.continue(); } catch { /* Le client peut avoir annulé la requête. */ }
    });
    try {
      await pending.goto(url.href); await ready(pending);
      await pending.evaluate(() => { void window.__jura3dLayers.setEnabled('heritage', true); void window.__jura3dLayers.setEnabled('transport', true); });
      const deadline = Date.now() + 10000;
      while (intercepted < 6 && Date.now() < deadline) await pending.waitForTimeout(100);
      assert.equal(intercepted, 6);
      await pending.evaluate(() => window.__jura3dLayers.destroy()); release();
      await pending.waitForTimeout(1500);
      const state = await pending.evaluate(() => ({ h: window.__jura3dHeritage(), t: window.__jura3dTransport() }));
      for (const s of [state.h, state.t]) { assert.equal(s.sourceCount, 0); assert.equal(s.total, 0); assert.equal(s.state, 'off'); }
      report.checks.push('destruction pendant six requêtes : aucune source/réponse tardive réactivée');
    } finally { release(); await pending.close(); }
  }
  assert.equal(await page.locator('.credit').textContent(), 'Données © swisstopo');
  assert.deepEqual(report.errors, []); report.completed = true;
  await page.screenshot({ path: `.vite/p7/${territory.id}.png` });
} catch (error) { report.failure = error.stack; process.exitCode = 1; }
finally {
  await mkdir('.vite/p7', { recursive: true });
  await writeFile(`.vite/p7/probe-${report.territory?.id ?? 'failed'}.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report)); await browser.close();
}
