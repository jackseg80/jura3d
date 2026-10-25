import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
const ready = p => p.waitForFunction(() => document.querySelector('#status').dataset.state === 'ready', undefined, {timeout:90000});
const layerReady = p => p.waitForFunction(() => window.__jura3dTransport?.().state === 'ready');
const state = p => p.evaluate(() => window.__jura3dTransport());
const filePattern = /\/jura\/(bus-stops|bus-lines|noctambus-zones)\.geojson(?:\?|$)/;
const stopsPath = /\/jura\/bus-stops\.geojson(?:\?|$)/;
const linesPath = /\/jura\/bus-lines\.geojson(?:\?|$)/;
const id = (kind, value) => `sdt.sdt_09_07_${kind === 'stop' ? 'arrets_de_bus' : kind === 'line' ? 'lignes_de_bus' : 'noctambus'}:${value}`;
export async function probeTransport(browser, url) {
  const datasets = await Promise.all(['bus-stops','bus-lines','noctambus-zones'].map(async name => JSON.parse(await readFile(new URL(`../data/jura/${name}.geojson`, import.meta.url),'utf8'))));
  const records = new Map(datasets.flatMap((data,i) => data.features.map(feature => [feature.id,{kind:['stop','line','zone'][i],feature}])));
  const context = await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();
  const errors=[];const requests=[];const sampled=[];const visibleTraces=[];const overlaps=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(filePattern.test(r.url())) requests.push(r.url());});
  const activate = async p => { if(!(await p.locator('#transport-settings').getAttribute('open'))) await p.locator('#transport-settings summary').click();await p.locator('#transport').check();await layerReady(p); };
  const consult = async (p,kind,number,touch=false) => {
    await p.locator('#transport-kind').selectOption(kind);await p.locator('#transport-place').selectOption(id(kind,number));await p.locator('#transport-open')[touch?'tap':'click']();
    const record=records.get(id(kind,number));const props=record.feature.properties;
    const title=props[kind==='stop'?'nomarret':kind==='line'?'nomcadrehoraire':'nom_zone'];
    assert.equal(await p.locator('#selection-title').textContent(),title.trim());
    assert.equal(await p.evaluate(()=>window.__jura3dCamera().selectionKind),`transport-${kind}`);
    assert.equal(await p.locator('#selection-credit').textContent(),'© Géodonnées de la République et Canton du Jura');
    assert.match(await p.locator('#transport-properties').textContent(),/13\.09\.2026/);
    const link=p.locator(`#transport-links [data-field="${kind==='stop'?'urlhorairepassage':kind==='line'?'urlcadrehoraire':'horaire'}"]`);
    assert.equal(await link.getAttribute('href'),new URL(props[kind==='stop'?'urlhorairepassage':kind==='line'?'urlcadrehoraire':'horaire']).href);
    if(kind==='stop') assert.match(await p.locator('#transport-link-status').textContent(),/préremplissage non confirmé/);
    await p.waitForFunction(() => !window.__jura3dTransport().focusing, undefined, { timeout: 30000 });
    await ready(p);
    return record;
  };
  await page.goto(url,{waitUntil:'domcontentloaded'});await ready(page);assert.equal(requests.length,0,'transports téléchargés avant activation');
  await activate(page);const initial=await state(page);assert.equal(initial.total,606);assert.equal(initial.sourceCount,1);
  assert.equal(initial.geometry.toleranceMeters,1);
  assert.equal(initial.geometry.clipRadiusMeters,5250);
  assert.equal(initial.geometry.sourceLineVertices,9503);
  assert.ok(initial.geometry.renderedLineVertices>0&&initial.geometry.renderedLineVertices<initial.geometry.sourceLineVertices*.5,'géométrie locale non réduite');
  assert.equal(initial.filtered.filter(f=>f.kind==='stop').length,81);assert.equal(initial.filtered.filter(f=>f.kind==='line').length,30);assert.equal(initial.filtered.filter(f=>f.kind==='zone').length,0);
  await page.waitForTimeout(2000);const group=await page.evaluate(()=>window.__jura3dTransportGroupTarget());assert.ok(group,'aucun groupe bus visible');assert.equal(group.heightReference,3);
  await page.mouse.click(group.x,group.y);assert.equal(await page.locator('#selection-group button').count(),group.count);
  assert.deepEqual((await page.locator('#selection-group button').evaluateAll(es=>es.map(e=>e.dataset.transportId))).sort(),[...group.ids].sort());
  const chosen=await page.locator('#selection-group button').first().getAttribute('data-transport-id');await page.locator('#selection-group button').first().click();
  assert.equal(await page.locator('#selection-title').textContent(),records.get(chosen).feature.properties.nomarret.trim());await page.locator('#clear-selection').click();
  await page.screenshot({path:'probe-p4-delemont-network.png',fullPage:true});
  for(const [city,stopIds,lineId] of [['delemont',[25,65],6],['porrentruy',[77,287],16],['saignelegier',[117,380],13],['saint-ursanne',[124,140],19]]) {
    await page.locator(`[data-place="${city}"]`).click();await page.waitForFunction(c=>window.__jura3dCamera().activePlace===c&&!window.__jura3dCamera().flyingTo,city);await ready(page);
    const sector=await state(page);assert.ok(sector.filtered.some(f=>f.id===id('line',lineId)));
    for(const number of stopIds) {const r=await consult(page,'stop',number);sampled.push({city,kind:'stop',id:r.feature.id,name:r.feature.properties.nomarret});await page.waitForTimeout(2200);}
    await page.screenshot({path:`probe-p4-${city}-stop.png`,fullPage:true});
    const r=await consult(page,'line',lineId);sampled.push({city,kind:'line',id:r.feature.id,name:r.feature.properties.nomcadrehoraire});await page.waitForTimeout(2200);
    await page.locator('#clear-selection').click();
    const targetHandle=await page.waitForFunction(featureId=>window.__jura3dTransportTarget(featureId),id('line',lineId),{timeout:30000,polling:500});
    const target=await targetHandle.jsonValue();await targetHandle.dispose();await page.mouse.click(target.x,target.y);
    const selectionAfterClick=await page.evaluate(()=>({kind:window.__jura3dCamera().selectionKind,selectedId:window.__jura3dTransport().selectedId,title:document.querySelector('#selection-title').textContent}));
    if (await page.evaluate(()=>window.__jura3dCamera().selectionKind)==='transport-group') {
      const ids=await page.locator('#selection-group button').evaluateAll(es=>es.map(e=>e.dataset.transportId));
      assert.ok(ids.includes(target.id));assert.equal(new Set(ids).size,ids.length);
      assert.ok(ids.every(featureId=>records.get(featureId)?.kind==='line'));
      overlaps.push({city,ids});await page.screenshot({path:'probe-p4-overlapping-traces.png',fullPage:true});
      await page.locator(`#selection-group button[data-transport-id="${target.id}"]`).click();
    }
    if(await page.locator('#selection-title').textContent()!==r.feature.properties.nomcadrehoraire.trim()) {
      console.log(JSON.stringify({city,target,selectionAfterClick,final:await page.evaluate(()=>({kind:window.__jura3dCamera().selectionKind,selectedId:window.__jura3dTransport().selectedId,title:document.querySelector('#selection-title').textContent}))}));
      await page.screenshot({path:'probe-p4-pick-debug.png',fullPage:true});
    }
    assert.equal(await page.evaluate(()=>window.__jura3dCamera().selectionKind),'transport-line');assert.equal(await page.locator('#selection-title').textContent(),r.feature.properties.nomcadrehoraire.trim());
    visibleTraces.push({city,...target});await page.waitForTimeout(700);await page.screenshot({path:`probe-p4-${city}-line.png`,fullPage:true});await page.locator('#clear-selection').click();
  }
  await page.locator('#transport-sector').selectOption('');let all=await state(page);
  assert.equal(all.filtered.filter(f=>f.kind==='stop').length,464);assert.equal(all.filtered.filter(f=>f.kind==='line').length,140);
  assert.equal(all.geometry.clipRadiusMeters,null,'réseau entier découpé à tort');
  assert.equal(all.geometry.sourceLineVertices,47625);
  assert.equal(all.geometry.renderedLineVertices,12269);
  for(const offer of ['day','night']) {
    await page.locator('#transport-offer').selectOption(offer);const filtered=await state(page);
    assert.ok(filtered.filtered.length>0&&filtered.filtered.length<all.filtered.length);
    for(const item of filtered.filtered) {const p=records.get(item.id).feature.properties;assert.equal(p[`${item.kind==='stop'?'arret':'ligne'}_${offer==='day'?'jour':'nocturne'}`],'Oui');}
  }
  await page.locator('#transport-offer').selectOption('');await page.locator('#transport-zones').check();assert.equal((await state(page)).filtered.filter(f=>f.kind==='zone').length,2);
  await consult(page,'zone',1);await page.waitForTimeout(2200);await page.screenshot({path:'probe-p4-noctambus-zone.png',fullPage:true});
  await page.locator('#transport-zones').uncheck();assert.ok(!(await page.locator('#selection').isVisible()),'fiche fantôme après retrait des zones');await page.locator('#transport-stops').uncheck();await page.locator('#transport-lines').uncheck();assert.equal((await state(page)).entityCount,0);assert.ok(await page.locator('#transport-open').isDisabled());
  await page.locator('#transport-stops').check();await page.locator('#transport-lines').check();
  // Coexistence et crédit cantonal commun, sans masquer la source restante.
  await page.locator('#heritage-settings summary').click();await page.locator('#heritage').check();await page.waitForFunction(()=>window.__jura3dHeritage().state==='ready');assert.equal((await state(page)).sourceCount,2);
  for(let n=0;n<3;n++){await page.locator('#transport').uncheck();assert.equal((await state(page)).sourceCount,1);assert.ok(await page.locator('#heritage-credit').isVisible());await page.locator('#transport').check();await layerReady(page);assert.equal((await state(page)).sourceCount,2);}
  await page.locator('#heritage').uncheck();assert.equal((await state(page)).sourceCount,1);assert.ok(await page.locator('#heritage-credit').isVisible());
  assert.equal(requests.length,3,'GeoJSON transports rechargés après bascules');
  await page.locator('#transport-sector').selectOption('active');await page.locator('[data-place="delemont"]').click();await page.waitForFunction(()=>window.__jura3dCamera().activePlace==='delemont'&&!window.__jura3dCamera().flyingTo);await ready(page);
  // Clic réel sur un arrêt isolé au sol.
  await page.locator('#transport-lines').uncheck();await consult(page,'stop',65);await page.waitForTimeout(2200);await page.locator('#clear-selection').click();
  await page.waitForFunction(featureId=>window.__jura3dTransportTarget(featureId),id('stop',65),{timeout:20000,polling:500});
  const marker=await page.evaluate(featureId=>window.__jura3dTransportTarget(featureId),id('stop',65));await page.mouse.click(marker.x,marker.y);assert.equal(await page.evaluate(()=>window.__jura3dCamera().selectionKind),'transport-stop');
  await page.locator('#transport').uncheck();assert.equal((await state(page)).sourceCount,0);assert.ok(!(await page.locator('#selection').isVisible()));await context.close();
  // Interface tactile simulée, fiche et crédit accessibles après défilement.
  const tc=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const touch=await tc.newPage();touch.on('pageerror',e=>errors.push(e.message));
  await touch.goto(url);await ready(touch);await touch.locator('#toggle-controls').tap();await activate(touch);await consult(touch,'stop',25,true);await touch.waitForTimeout(2200);
  assert.equal(await touch.locator('#toggle-controls').getAttribute('aria-expanded'),'false');
  const link=touch.locator('#transport-links a[data-field="urlhorairepassage"]');await link.scrollIntoViewIfNeeded();assert.ok((await link.boundingBox()).height>=44);
  await touch.screenshot({path:'probe-p4-touch-portrait.png',fullPage:true});await touch.setViewportSize({width:844,height:390});await link.scrollIntoViewIfNeeded();
  for(const selector of ['#selection-title','#clear-selection','#selection-credit']) assert.ok(await touch.locator(selector).evaluate(e=>{const b=e.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight;}),`${selector} hors écran`);
  assert.equal(await touch.evaluate(()=>document.documentElement.scrollWidth),844);await touch.screenshot({path:'probe-p4-touch-landscape.png',fullPage:true});await touch.locator('#clear-selection').tap();
  await touch.locator('#toggle-controls').tap();await touch.locator('#home').tap();await touch.waitForFunction(()=>!window.__jura3dCamera().flyingTo);await ready(touch);await touch.locator('#toggle-controls').tap();
  const tgHandle=await touch.waitForFunction(()=>window.__jura3dTransportGroupTarget(),undefined,{timeout:20000,polling:500});const tg=await tgHandle.jsonValue();await tgHandle.dispose();await touch.touchscreen.tap(tg.x,tg.y);const first=touch.locator('#selection-group button').first();await first.scrollIntoViewIfNeeded();assert.ok((await first.boundingBox()).height>=44);await first.tap();assert.equal(await touch.evaluate(()=>window.__jura3dCamera().selectionKind),'transport-stop');await tc.close();
  const recovered=[];
  for(const type of ['http','invalid']) {
    const fail=await browser.newPage({viewport:{width:1000,height:800}});fail.on('pageerror',e=>errors.push(e.message));
    await fail.route(linesPath,r=>r.fulfill(type==='http'?{status:503,body:'indisponible'}:{status:200,contentType:'application/json',body:JSON.stringify({type:'FeatureCollection',features:[]})}));
    await fail.goto(url);await ready(fail);await fail.locator('#heritage-settings summary').click();await fail.locator('#heritage').check();await fail.waitForFunction(()=>window.__jura3dHeritage().state==='ready');
    await fail.locator('#transport-settings summary').click();await fail.locator('#transport').check();await fail.waitForFunction(()=>window.__jura3dTransport().state==='error');assert.equal((await state(fail)).sourceCount,1);assert.equal(await fail.locator('#status').getAttribute('data-state'),'ready');
    if(type==='http')await fail.screenshot({path:'probe-p4-error.png',fullPage:true});await fail.unroute(linesPath);await fail.locator('#transport-retry').click();await layerReady(fail);assert.equal((await state(fail)).sourceCount,2);recovered.push(type);await fail.close();
  }
  const pending=await browser.newPage();await pending.route(stopsPath,async route=>{await new Promise(r=>setTimeout(r,1500));await route.continue();});await pending.goto(url);await ready(pending);await pending.locator('#transport-settings summary').click();await pending.locator('#transport').check();await pending.locator('#transport').uncheck();await pending.waitForTimeout(1800);assert.equal((await state(pending)).sourceCount,0);
  await pending.unroute(stopsPath);await pending.locator('#transport').check();await layerReady(pending);await pending.evaluate(()=>{const input=document.querySelector('#transport');for(const checked of [false,true,false,true,false]){input.checked=checked;input.dispatchEvent(new Event('change',{bubbles:true}));}});await pending.waitForTimeout(200);assert.equal((await state(pending)).sourceCount,0);await pending.close();
  const unsafe=await browser.newPage();const altered=structuredClone(datasets[0]);const changed=altered.features.find(f=>f.properties.id===25);changed.properties.urlhorairepassage='javascript:alert(1)';changed.properties.refetatexploitation=null;changed.properties.nomarret=null;
  await unsafe.route(stopsPath,r=>r.fulfill({contentType:'application/json',body:JSON.stringify(altered)}));await unsafe.goto(url);await ready(unsafe);await activate(unsafe);await consultUnsafe(unsafe);
  assert.equal(await unsafe.locator('#transport-links [data-field="urlhorairepassage"]').getAttribute('href'),null);assert.match(await unsafe.locator('#transport-link-status').textContent(),/inutilisable/);assert.match(await unsafe.locator('#transport-properties').textContent(),/Non renseigné/);await unsafe.close();
  async function consultUnsafe(p){await p.locator('#transport-place').selectOption(id('stop',25));await p.locator('#transport-open').click();}
  const unavailable=await browser.newPage();const checks=JSON.parse(await readFile(new URL('../data/jura-transport-link-checks.json',import.meta.url),'utf8'));checks.checks.find(c=>c.featureId===id('line',6)&&c.field==='urlcadrehoraire').status=404;
  await unavailable.route(/\/jura\/transport-link-checks\.json/,r=>r.fulfill({contentType:'application/json',body:JSON.stringify(checks)}));await unavailable.goto(url);await ready(unavailable);await activate(unavailable);await unavailable.locator('#transport-kind').selectOption('line');await unavailable.locator('#transport-place').selectOption(id('line',6));await unavailable.locator('#transport-open').click();
  assert.equal(await unavailable.locator('#transport-links [data-field="urlcadrehoraire"]').getAttribute('href'),null);assert.match(await unavailable.locator('#transport-link-status').textContent(),/indisponible lors du contrôle/);await unavailable.close();
  const report={checkedAt:new Date().toISOString(),initial:{stops:81,lines:30,zones:0},sampled,visibleTraces,overlaps,clickedStop:marker,clickedGroup:group.count,allNetwork:{stops:464,lines:140,zones:2},dayNightFilter:true,independentVisibility:true,coexistence:true,cachedGeojson:true,toggles:3,cancelledLoad:true,rapidToggles:true,unsafeLinkRejected:true,missingFieldHandled:true,knownUnavailableLink:true,recovered,touch:{simulated:true,portraitAndLandscape:true,groupListSelection:true},errors};
  assert.deepEqual(errors,[]);await writeFile('probe-p4-report.json',JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--no-sandbox']});try{const url=new URL(process.env.JURA3D_URL??'http://127.0.0.1:4173/');url.searchParams.set('probe','1');console.log(JSON.stringify(await probeTransport(browser,url.href),null,2));}finally{await browser.close();}}
