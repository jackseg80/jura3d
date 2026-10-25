import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.env.JURA3D_URL ?? 'https://jackseg80.github.io/jura3d/';
const expected = process.env.JURA3D_EXPECTED_REVISION;
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true,
  args: ['--no-sandbox', ...(process.env.JURA3D_PROBE_GPU === 'high' ? ['--force_high_performance_gpu'] : [])] });
const report = { startedAt: new Date().toISOString(), url, completed: false, errors: [], destinations: [] };
const ready = page => page.waitForFunction(() => document.querySelector('#status')?.dataset.state === 'ready', undefined, { timeout: 90000 });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const localFailures = [];
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('response', r => { if (r.status() >= 400) localFailures.push({ url: r.url(), status: r.status() }); });
  page.on('requestfailed', r => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') report.errors.push(`${r.failure()?.errorText} ${r.url()}`); });
  // Parcours ordinaire sans paramètre diagnostic ni modification du navigateur utilisateur.
  await page.goto(url, { waitUntil: 'domcontentloaded' }); await ready(page);
  const infoResponse = await page.request.get(new URL('build-info.json', url).href);
  assert.equal(infoResponse.status(), 200); report.build = await infoResponse.json();
  if (expected) assert.equal(report.build.revision, expected);
  assert.equal(report.build.base, '/jura3d/'); assert.equal(report.build.territory, 'jura');
  assert.match(await page.title(), /Jura 3D/);
  await page.locator('#settings').evaluate(e => { e.open = true; });
  await page.locator('#quality').selectOption('medium'); await ready(page);
  for (const [id, name] of [['delemont','Delémont'],['porrentruy','Porrentruy'],['saignelegier','Saignelégier'],['saint-ursanne','Saint-Ursanne']]) {
    await page.locator(`[data-place="${id}"]`).click();
    await page.waitForFunction(name => document.querySelector('#active-place').textContent === `Destination : ${name}`, name);
    await ready(page); report.destinations.push({ id, ready: true });
  }
  await page.locator('#home').click();
  await page.waitForFunction(() => document.querySelector('#active-place').textContent === 'Destination : Delémont'); await ready(page);
  for (const id of ['heritage','transport']) {
    await page.locator(`#${id}-settings`).evaluate(e => { e.open = true; });
    await page.locator(`#${id}`).check();
    await page.waitForFunction(id => document.querySelector(`#${id}-status`).dataset.state === 'ready', id);
    const choices = page.locator(`#${id}-place`);
    const option = await choices.locator('option').first().getAttribute('value'); assert.ok(option);
    await choices.selectOption(option); await page.locator(`#${id}-open`).click();
    await page.waitForFunction(() => !document.querySelector('#selection').hidden);
    assert.ok((await page.locator('#selection-title').textContent()).trim());
    assert.match(await page.locator('#selection-credit').textContent(), /Canton du Jura/);
    await page.locator('#clear-selection').click();
  }
  assert.ok(await page.locator('.credit').isVisible());
  assert.match(await page.locator('.credit').textContent(), /© swisstopo/);
  const conditions = await page.locator('#heritage-credit a').getAttribute('href');
  const pdf = await page.request.get(new URL(conditions, url).href);
  assert.equal(pdf.status(), 200); assert.equal((await pdf.body()).subarray(0,4).toString(), '%PDF');
  await page.locator('#transport-kind').selectOption('line');
  const line = await page.locator('#transport-place option').first().getAttribute('value');assert.ok(line);
  await page.locator('#transport-place').selectOption(line); await page.locator('#transport-open').click();
  assert.ok(await page.locator('#transport-links a').count());
  await page.locator('#clear-selection').click();
  await ready(page);
  await mkdir('.vite/publication', { recursive: true });
  await page.screenshot({ path: '.vite/publication/published.png', fullPage: true });
  assert.deepEqual(localFailures, []); assert.deepEqual(report.errors, []);
  report.conditionsAvailable = true; report.heritageAndTransport = true; report.lineSheet = true;
  report.completed = true; report.endedAt = new Date().toISOString();
} catch (error) { report.failure = error.stack; process.exitCode = 1; }
finally {
  await mkdir('.vite/publication', { recursive: true });
  await writeFile('.vite/publication/published-probe.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report)); await browser.close();
}
