import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const heritagePath = /\/jura\/heritage\.geojson(?:\?|$)/;
const ready = (page) => page.waitForFunction(() => document.querySelector('#status').dataset.state === 'ready', undefined, { timeout: 90000 });
const layerReady = (page) => page.waitForFunction(() => window.__jura3dHeritage?.().state === 'ready');
const state = (page) => page.evaluate(() => window.__jura3dHeritage());

export async function probeHeritage(browser, url) {
  const data = JSON.parse(await readFile(new URL('../data/jura/heritage.geojson', import.meta.url), 'utf8'));
  const links = JSON.parse(await readFile(new URL('../data/jura-heritage-link-checks.json', import.meta.url), 'utf8'));
  const source = new Map(data.features.map((f) => [f.id, f]));
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  const dataPrefix = new URL('jura/', url).href;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (request.url().startsWith(dataPrefix)) requests.push(request.url()); });
  const activate = async (target, touch = false) => {
    if (!(await target.locator('#heritage-settings').getAttribute('open'))) {
      await target.locator('#heritage-settings summary')[touch ? 'tap' : 'click']();
    }
    await target.locator('#heritage').check();
    await layerReady(target);
  };
  const consult = async (target, id, touch = false) => {
    await target.locator('#heritage-place').selectOption(id);
    await target.locator('#heritage-open')[touch ? 'tap' : 'click']();
    const feature = source.get(id);
    assert.equal(await target.locator('#selection-title').textContent(), feature.properties.nom.trim());
    assert.equal(await target.evaluate(() => window.__jura3dCamera().selectionKind), 'heritage');
    assert.equal(await target.locator('#selection-description').textContent(), feature.properties.description?.trim() || 'Description non fournie dans le répertoire.');
    assert.equal(await target.locator('#selection-credit').textContent(), '© Géodonnées de la République et Canton du Jura');
    assert.equal(await target.locator('#selection-pdf').getAttribute('href'), feature.properties.url_pdf.replace('http://', 'https://'));
    return feature;
  };
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(page);
  assert.equal(requests.length, 0, 'patrimoine téléchargé avant activation');
  await activate(page);
  const initial = await state(page);
  const delemont = data.features.filter((f) => f.properties.localite === 'Delémont');
  assert.equal(initial.total, 1159);
  assert.equal(initial.filtered.length, delemont.length);
  assert.equal(initial.entityCount, delemont.filter((f) => f.geometry).length);
  assert.equal(initial.sourceCount, 1);
  await page.waitForTimeout(1800);
  const group = await page.evaluate(() => window.__jura3dHeritageGroupTarget());
  assert.ok(group, 'aucun regroupement visible dans la vue initiale');
  await page.mouse.click(group.x, group.y);
  assert.equal(await page.evaluate(() => window.__jura3dCamera().selectionKind), 'heritage-group');
  assert.equal(await page.locator('#selection-title').textContent(), `${group.count} lieux regroupés`);
  const groupButtons = page.locator('#selection-group button');
  assert.equal(await groupButtons.count(), group.count);
  assert.deepEqual((await groupButtons.evaluateAll((buttons) => buttons.map((b) => b.dataset.heritageId))).sort(), [...group.ids].sort());
  const groupRecordId = await groupButtons.first().getAttribute('data-heritage-id');
  await groupButtons.first().click();
  assert.equal(await page.locator('#selection-title').textContent(), source.get(groupRecordId).properties.nom);
  assert.equal(await page.evaluate(() => window.__jura3dCamera().selectionKind), 'heritage');
  assert.equal(await page.locator('#selection-group').isVisible(), false);
  await page.locator('#clear-selection').click();
  await page.locator('#heritage-category').selectOption(delemont.find((f) => f.properties.id === 323).properties.categorie);
  const category = await state(page);
  assert.ok(category.filtered.length > 0 && category.filtered.length < initial.filtered.length);
  await page.locator('#heritage-category').selectOption('');

  const sampled = [];
  const groundGroups = [];
  for (const [place, city] of [['delemont', 'Delémont'], ['porrentruy', 'Porrentruy'], ['saignelegier', 'Saignelégier'], ['saint-ursanne', 'Saint-Ursanne']]) {
    await page.locator(`[data-place="${place}"]`).click();
    await page.waitForFunction((id) => window.__jura3dCamera().activePlace === id && !window.__jura3dCamera().flyingTo, place);
    await ready(page);
    assert.ok((await state(page)).filtered.every((f) => source.get(f.id).properties.localite === city));
    if (place === 'saignelegier') {
      // Régression du groupe au niveau de l'ellipsoïde : examiner de vraies
      // vignettes après rotation, inclinaison et zoom, sur le relief élevé.
      for (const action of [null, 'left', 'left', 'right', 'right', 'tilt', 'zoom-in', 'zoom-in', 'zoom-out', 'zoom-out']) {
        if (action) await page.locator(`[data-camera="${action}"]`).click();
        await page.waitForTimeout(1100);
        const visible = await page.evaluate(() => window.__jura3dHeritageGroupTarget());
        if (!visible) continue; // Des groupes peuvent se séparer ou sortir du cadre.
        assert.equal(visible.heightReference, 3, 'groupe non ancré au terrain');
        assert.ok(visible.terrainHeight > 900, 'échantillon hors des hauteurs de Saignelégier');
        assert.ok(visible.groundAnchorErrorPixels !== null && visible.groundAnchorErrorPixels < 3,
          `groupe décalé du terrain après ${action}: ${visible.groundAnchorErrorPixels} px`);
        groundGroups.push({ action: action ?? 'initial', ...visible });
      }
      assert.ok(groundGroups.length >= 3, 'groupes trop peu échantillonnés');
      await page.locator('[data-place="saignelegier"]').click();
      await page.waitForFunction(() => !window.__jura3dCamera().flyingTo);
      await ready(page);
    }
    for (const check of links.checks.filter((c) => source.get(c.featureId).properties.localite === city)) {
      assert.equal(check.status, 200);
      assert.equal(check.pdf, true);
      const record = await consult(page, check.featureId);
      assert.ok((await page.locator('#selection-properties').textContent()).includes(record.properties.categorie));
      sampled.push({ id: record.id, name: record.properties.nom, locality: city, officialPdf: true });
      await page.waitForTimeout(1700);
    }
    await page.screenshot({ path: `probe-p3-${place}.png`, fullPage: true });
  }
  assert.equal(sampled.length, 12);
  await page.locator('#heritage-locality').selectOption('');
  assert.equal((await state(page)).entityCount, 1156);
  await consult(page, 'rcju_autre.occ_02_14_rbc:229');
  assert.match(await page.locator('#selection-position').textContent(), /aucun repère/);
  assert.equal((await state(page)).entityCount, 1156);
  await page.screenshot({ path: 'probe-p3-unplaced.png', fullPage: true });
  await page.locator('#heritage-category').selectOption('230 Bornes');
  assert.equal(await page.locator('#selection').isVisible(), false, 'sélection fantôme après filtre');
  await page.locator('#heritage-category').selectOption('');
  for (let n = 0; n < 4; n++) {
    await page.locator('#heritage').uncheck();
    assert.equal((await state(page)).sourceCount, 0);
    assert.equal(await page.locator('#selection').isVisible(), false);
    await page.locator('#heritage').check();
    await layerReady(page);
    assert.equal((await state(page)).sourceCount, 1);
    assert.equal((await state(page)).entityCount, 1156);
  }
  assert.equal(requests.filter((r) => heritagePath.test(r)).length, 1, 'rechargements inutiles après activation');

  // Sélection par clic réel sur un repère isolé, pas par appel de sélection interne.
  await page.locator('#heritage-locality').selectOption('Delémont');
  await page.locator('#heritage-category').selectOption(source.get('rcju_autre.occ_02_14_rbc:323').properties.categorie);
  await consult(page, 'rcju_autre.occ_02_14_rbc:323');
  await page.waitForTimeout(2200);
  await page.locator('#clear-selection').click();
  await page.waitForFunction(() => window.__jura3dHeritageTarget('rcju_autre.occ_02_14_rbc:323'), undefined, { timeout: 15000 });
  const target = await page.evaluate(() => window.__jura3dHeritageTarget('rcju_autre.occ_02_14_rbc:323'));
  await page.mouse.click(target.x, target.y);
  assert.equal(await page.locator('#selection-title').textContent(), 'Château');
  const clickedMarker = true;
  await page.screenshot({ path: 'probe-p3-marker.png', fullPage: true });
  await page.locator('#heritage').uncheck();
  assert.equal(await page.evaluate(() => window.__jura3dCamera().selectionKind), null);
  assert.equal((await state(page)).sourceCount, 0);
  await context.close();

  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const touch = await touchContext.newPage();
  touch.on('pageerror', (error) => errors.push(error.message));
  await touch.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(touch);
  await touch.locator('#toggle-controls').tap();
  await activate(touch, true);
  await touch.locator('#toggle-controls').tap();
  await touch.waitForFunction(() => window.__jura3dHeritageGroupTarget(), undefined, { timeout: 20000 });
  const touchGroup = await touch.evaluate(() => window.__jura3dHeritageGroupTarget());
  await touch.touchscreen.tap(touchGroup.x, touchGroup.y);
  assert.equal(await touch.evaluate(() => window.__jura3dCamera().selectionKind), 'heritage-group');
  assert.equal(await touch.locator('#selection-group button').count(), touchGroup.count);
  const touchChoice = touch.locator('#selection-group button').first();
  await touchChoice.scrollIntoViewIfNeeded();
  assert.ok((await touchChoice.boundingBox()).height >= 44);
  await touch.screenshot({ path: 'probe-p3-group-touch.png', fullPage: true });
  const touchChoiceId = await touchChoice.getAttribute('data-heritage-id');
  await touchChoice.tap();
  assert.equal(await touch.locator('#selection-title').textContent(), source.get(touchChoiceId).properties.nom);
  assert.equal(await touch.locator('#selection-group').isVisible(), false);
  await touch.locator('#clear-selection').tap();
  await touch.locator('#toggle-controls').tap();
  await consult(touch, 'rcju_autre.occ_02_14_rbc:323', true);
  await touch.waitForTimeout(2200);
  assert.equal(await touch.locator('#toggle-controls').getAttribute('aria-expanded'), 'false');
  assert.equal(await touch.locator('#selection').isVisible(), true);
  await touch.locator('#selection-pdf').evaluate((element) => element.scrollIntoView());
  const layout = await touch.evaluate(() => {
    const box = (id) => { const b = document.querySelector(id).getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, height: b.height }; };
    return { panel: box('#selection'), link: box('#selection-pdf'), menu: box('.controls'), scrollWidth: document.documentElement.scrollWidth, width: innerWidth };
  });
  assert.ok(layout.panel.top >= layout.menu.bottom && layout.panel.bottom < 844);
  assert.ok(layout.link.height >= 44 && layout.link.bottom <= layout.panel.bottom);
  assert.equal(layout.scrollWidth, layout.width);
  assert.ok(await touch.locator('#clear-selection').isVisible());
  assert.ok(await touch.locator('#selection-title').evaluate((e) => e.getBoundingClientRect().top >= document.querySelector('#selection').getBoundingClientRect().top));
  await touch.screenshot({ path: 'probe-p3-touch-portrait.png', fullPage: true });
  await touch.setViewportSize({ width: 844, height: 390 });
  await touch.locator('#selection-pdf').evaluate((element) => element.scrollIntoView());
  for (const id of ['#selection-title', '#clear-selection', '#selection-credit']) {
    assert.ok(await touch.locator(id).evaluate((e) => {
      const b = e.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight;
    }), `${id} masqué après défilement paysage`);
  }
  await touch.screenshot({ path: 'probe-p3-touch-landscape.png', fullPage: true });
  await touch.locator('#clear-selection').tap();
  await touch.locator('#toggle-controls').tap();
  await touch.locator('#heritage').uncheck();
  assert.equal((await state(touch)).sourceCount, 0);
  await touchContext.close();

  // Erreur HTTP, données invalides, absence de champs et indisponibilité connue.
  const recovered = [];
  for (const kind of ['http', 'invalid']) {
    const failure = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    failure.on('pageerror', (error) => errors.push(error.message));
    await failure.route(heritagePath, (route) => route.fulfill(kind === 'http'
      ? { status: 503, body: 'Patrimoine indisponible' }
      : { status: 200, contentType: 'application/json', body: JSON.stringify({ type: 'FeatureCollection', features: [] }) }));
    await failure.goto(url, { waitUntil: 'domcontentloaded' });
    await ready(failure);
    await failure.locator('#heritage-settings summary').click();
    await failure.locator('#heritage').check();
    await failure.waitForFunction(() => window.__jura3dHeritage().state === 'error');
    await failure.locator('#toggle-controls').click();
    assert.ok(await failure.locator('#layer-alert').isVisible(), 'erreur patrimoine masquée avec le panneau replié');
    assert.ok(await failure.locator('#layer-alert-retry').isVisible());
    assert.equal((await state(failure)).sourceCount, 0);
    assert.equal(await failure.locator('#status').getAttribute('data-state'), 'ready');
    if (kind === 'http') await failure.screenshot({ path: 'probe-p3-error.png', fullPage: true });
    await failure.unroute(heritagePath);
    await failure.locator('#layer-alert-retry').click();
    await layerReady(failure);
    await failure.waitForFunction(() => document.querySelector('#layer-alert').hidden);
    assert.equal((await state(failure)).sourceCount, 1);
    recovered.push(kind);
    await failure.close();
  }
  const missing = await browser.newPage();
  const altered = structuredClone(data);
  const changed = altered.features.find((f) => f.properties.id === 323);
  changed.properties.description = null;
  changed.properties.url_pdf = 'javascript:alert(1)';
  await missing.route(heritagePath, (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(altered) }));
  await missing.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(missing);
  await activate(missing);
  await missing.locator('#heritage-place').selectOption(changed.id);
  await missing.locator('#heritage-open').click();
  assert.match(await missing.locator('#selection-description').textContent(), /non fournie/);
  assert.equal(await missing.locator('#selection-pdf').getAttribute('href'), null);
  await missing.close();
  const unavailable = await browser.newPage();
  const alteredLinks = structuredClone(links);
  alteredLinks.checks.find((c) => c.featureId === changed.id).status = 404;
  await unavailable.route(/\/jura\/heritage-link-checks\.json/, (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(alteredLinks) }));
  await unavailable.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(unavailable);
  await activate(unavailable);
  await unavailable.locator('#heritage-place').selectOption(changed.id);
  await unavailable.locator('#heritage-open').click();
  assert.equal(await unavailable.locator('#selection-pdf').getAttribute('href'), null);
  assert.match(await unavailable.locator('#selection-link-status').textContent(), /indisponible/);
  await unavailable.close();

  const pending = await browser.newPage();
  pending.on('pageerror', (error) => errors.push(error.message));
  await pending.route(heritagePath, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) }).catch(() => {});
  });
  await pending.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(pending);
  await pending.locator('#heritage-settings summary').click();
  await pending.locator('#heritage').check();
  await pending.waitForFunction(() => window.__jura3dHeritage().state === 'loading');
  await pending.locator('#heritage').uncheck();
  await pending.waitForTimeout(1800);
  assert.equal((await state(pending)).sourceCount, 0);
  assert.equal((await state(pending)).state, 'off');
  await pending.locator('#heritage').check();
  await layerReady(pending);
  await pending.evaluate(() => {
    const input = document.querySelector('#heritage');
    for (const checked of [false, true, false, true, false]) {
      input.checked = checked; input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await pending.waitForTimeout(200);
  assert.equal((await state(pending)).sourceCount, 0, 'source fantôme après bascules rapides');
  await pending.close();

  const report = { checkedAt: new Date().toISOString(), initial, categoryFiltered: category.filtered.length, sampled,
    clickedMarker, clickedGroup: group.count, groupListSelection: true, groundGroups, unplacedRetained: true, repeatedToggles: 4, cancelledPendingLoad: true, rapidToggles: true, noGhostSelection: true, cachedData: true,
    touch: { simulated: true, groupListSelection: true, portraitAndLandscape: true, layout }, recovered,
    missingDescription: true, unsafeLinkRejected: true, knownUnavailableLink: true, errors };
  await writeFile('probe-p3-report.json', JSON.stringify(report, null, 2) + '\n');
  assert.deepEqual(errors, []);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox'] });
  try {
    const url = new URL(process.env.JURA3D_URL ?? 'http://127.0.0.1:4173/');
    url.searchParams.set('probe', '1');
    console.log(JSON.stringify(await probeHeritage(browser, url.href), null, 2));
  } finally { await browser.close(); }
}
