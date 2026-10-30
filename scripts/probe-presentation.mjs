import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const site = new URL(process.env.JURA3D_URL ?? 'http://127.0.0.1:4337/jura3d/');
const output = process.env.JURA3D_PROBE_OUTPUT ?? '.vite/presentation/probe';
const scope = process.env.JURA3D_PROBE_SCOPE ?? 'all';
assert.ok(['all', 'jura'].includes(scope), 'JURA3D_PROBE_SCOPE doit être all ou jura');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox'] });
const report = { startedAt: new Date().toISOString(), url: site.href, scope, excludedTerritories: scope === 'jura' ? ['basel'] : [], browser: browser.version(), completed: false, checks: [], errors: [], networkFailures: [] };
const ready = p => p.waitForFunction(() => document.querySelector('#status')?.dataset.state === 'ready', undefined, { timeout: 90000 });
const watch = p => {
  p.on('pageerror', e => report.errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  p.on('requestfailed', r => {
    const error = r.failure()?.errorText;
    if (error === 'net::ERR_ABORTED') return;
    const url = new URL(r.url());
    report.networkFailures.push({ origin: url.origin, path: url.pathname, error });
  });
};
const controls = async p => {
  if (await p.locator('#toggle-controls').getAttribute('aria-expanded') !== 'true') await p.locator('#toggle-controls').click();
};
async function step(p, id) {
  await controls(p);
  await p.locator(`[data-presentation="${id}"]`).click();
  if (id !== 'territory') await p.waitForFunction(id => document.querySelector(`#${id}-status`).dataset.state === 'ready', id, { timeout: 45000 });
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Europe/Zurich' });
  const p = await context.newPage(); watch(p);
  const requests = []; p.on('request', r => requests.push(r.url()));
  await p.goto(new URL('presentation/', site).href);
  assert.equal(await p.locator('script').count(), 0);
  assert.equal(requests.filter(u => new URL(u).origin !== site.origin).length, 0);
  assert.ok(await p.locator('.hero-view img').evaluate(e => e.complete && e.naturalWidth > 0));
  const pdf = await p.request.get(new URL(await p.locator('footer a').first().getAttribute('href'), p.url()).href);
  assert.equal(pdf.status(), 200); assert.equal((await pdf.body()).subarray(0, 4).toString(), '%PDF');
  await p.keyboard.press('Tab'); assert.equal(await p.locator('.skip').evaluate(e => e === document.activeElement), true);
  await p.locator('.skip').evaluate(e => e.blur());
  await p.screenshot({ path: `${output}/presentation-desktop.png`, fullPage: true });
  report.checks.push('page statique, capture réelle, liens et conditions, accès clavier, aucune requête externe');

  await p.locator('[data-demo]').click(); await ready(p);
  assert.equal(await p.locator('#fps').isChecked(), false);
  assert.equal(await p.locator('#settings').evaluate(e => e.open), false);
  assert.equal(await p.locator('[data-visual-mode="original"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await p.locator('#site-home').getAttribute('href'), new URL('presentation/', site).href);
  assert.match(await p.locator('.presentation-badge').textContent(), /Prototype indépendant/);
  const quality = await p.locator('#quality').inputValue();
  await step(p, 'heritage');
  await p.locator('#heritage-place').selectOption({ label: 'Eglise Saint-Marcel' }); await p.locator('#heritage-open').click();
  await p.waitForFunction(() => !document.querySelector('#selection').hidden);
  assert.match(await p.locator('#selection-title').textContent(), /Marcel/);
  assert.match(await p.locator('#selection-pdf').getAttribute('href'), /^https:\/\//);
  await p.screenshot({ path: `${output}/heritage-desktop.png` });
  await step(p, 'transport'); assert.equal(await p.locator('#selection').isVisible(), false);
  const firstStop = await p.locator('#transport-place option').first().getAttribute('value');
  await p.locator('#transport-place').selectOption(firstStop); await p.locator('#transport-open').click();
  await p.waitForFunction(() => !document.querySelector('#selection').hidden);
  assert.ok(await p.locator('#transport-links a').count());
  await p.locator('#clear-selection').click();
  await step(p, 'territory');
  await p.locator('[data-place="porrentruy"]').click(); await ready(p);
  await p.waitForFunction(() => document.querySelector('[data-place="porrentruy"]').getAttribute('aria-pressed') === 'true');
  await step(p, 'heritage');
  assert.ok(await p.locator('#heritage-place option').count());
  assert.equal(await p.locator('#quality').inputValue(), quality);
  assert.match(await p.locator('.credit').textContent(), /© swisstopo/);
  await p.locator('#site-home').click(); await p.waitForURL(new URL('presentation/', site).href);
  report.checks.push('trois étapes, fiche Saint-Marcel/PDF, bus/liens, autre destination, crédits, qualité conservée et retour présentation');

  const touch = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 }, timezoneId: 'Europe/Zurich' });
  const t = await touch.newPage(); watch(t);
  for (const size of [{ width: 320, height: 700 }, { width: 390, height: 844 }, { width: 722, height: 320 }]) {
    await t.setViewportSize(size); await t.goto(new URL('presentation/', site).href);
    assert.ok(await t.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const button = await t.locator('[data-demo]').boundingBox(); assert.ok(button.height >= 44);
    await t.screenshot({ path: `${output}/presentation-${size.width}.png`, fullPage: true });
    await t.locator('[data-demo]').tap(); await ready(t); await controls(t);
    for (const id of ['heritage', 'transport', 'territory']) await step(t, id);
    for (const button of await t.locator('[data-presentation]').all()) {
      await button.scrollIntoViewIfNeeded(); const box = await button.boundingBox(); assert.ok(box.height >= 44);
      assert.ok(box.x >= 0 && box.x + box.width <= size.width);
    }
    assert.match(await t.locator('.credit').textContent(), /© swisstopo/);
    await t.screenshot({ path: `${output}/map-${size.width}.png` });
    await t.locator('#site-home').click(); await t.waitForURL(new URL('presentation/', site).href);
  }
  report.checks.push('320/390/722 px, portrait/paysage simulés, trois accès et retours, cibles tactiles et crédits');

  await p.goto(new URL('jura/', site).href); await ready(p);
  assert.equal(await p.locator('.presentation-guide').count(), 0);
  assert.equal(await p.locator('#fps').isChecked(), true);
  assert.equal(await p.locator('#settings').evaluate(e => e.open), true);
  assert.equal(await p.locator('#site-home').getAttribute('href'), site.pathname);
  report.checks.push('Jura normal conserve son entrée et ses réglages habituels');
  if (scope === 'all') {
    await p.goto(new URL('bale/?presentation=1', site).href); await ready(p);
    assert.equal(await p.locator('.presentation-guide').count(), 0);
    assert.equal(await p.locator('#fps').isChecked(), true);
    report.checks.push('Bâle conserve son entrée et ses réglages habituels');
  }
  assert.deepEqual(report.errors, []); report.completed = true;
} catch (e) { report.failure = e.stack; process.exitCode = 1; }
finally {
  report.endedAt = new Date().toISOString();
  await writeFile(`${output}/probe-presentation.json`, JSON.stringify(report, null, 2));
  await browser.close(); console.log(JSON.stringify(report));
}
