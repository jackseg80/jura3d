import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
const url=new URL(process.env.JURA3D_URL??'http://127.0.0.1:4305/');url.searchParams.set('probe','1');
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,
  args:['--no-sandbox',...(process.env.JURA3D_PROBE_GPU==='high'?['--force_high_performance_gpu']:[])]});
const report={startedAt:new Date().toISOString(),url:url.href,browser:browser.version(),completed:false,checks:[],errors:[]};
const output=process.env.JURA3D_PROBE_OUTPUT??'.vite/p8';
await mkdir(output,{recursive:true});
const save=()=>writeFile(`${output}/probe-basel.json`,JSON.stringify(report,null,2));
const ready=p=>p.waitForFunction(()=>document.querySelector('#status').dataset.state==='ready',undefined,{timeout:90000});
const state=p=>p.evaluate(()=>window.__jura3dParking());
const parkReady=p=>p.waitForFunction(()=>window.__jura3dParking().state==='ready'&&!window.__jura3dParking().loading);
const api='**/api/explore/v2.1/catalog/datasets/100088/records?*';
const activate=async p=>{await p.locator('#parking-settings').evaluate(e=>{e.open=true;});await p.locator('#parking').check();await parkReady(p);};
async function phase(name,fn){await fn();report.checks.push({name,at:new Date().toISOString()});await save();console.log(name);}
try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});const requests=[];
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  page.on('request',r=>requests.push(r.url()));
  await page.goto(url.href);await ready(page);await page.locator('#quality').selectOption('medium');await ready(page);
  await phase('Sources et absence de doublon',async()=>{
    assert.equal((await page.evaluate(()=>window.__jura3dTerritory())).id,'basel');
    const source=await page.evaluate(()=>window.__jura3dBuildings());assert.equal(source.keepInside,true);assert.equal(source.clippingMode,'planes');assert.deepEqual(source.clipBounds,[7.57,47.54,7.615,47.57]);
    assert.equal(requests.some(u=>u.includes('swissbuildings3d')),false);assert.equal(requests.some(u=>u.includes('/100088/records')),false);
    assert.equal(await page.locator('#heritage-settings').isVisible(),true);assert.equal(await page.locator('#heritage').isChecked(),false);assert.equal(await page.locator('#transport-settings').isVisible(),true);
    assert.equal(await page.locator('#transport').isChecked(),false);
    assert.match(await page.locator('#buildings-source').textContent(),/Basel-Stadt/);
    assert.ok((await page.evaluate(()=>window.__jura3dPerformance())).triangles>0);
    report.gpu=(await page.evaluate(()=>window.__jura3dCamera())).quality.gpu;report.buildings=source;
  });
  await phase('Trois cadrages réels et sélection bâtiment',async()=>{
    report.views=[];
    for(const id of ['basel-centre','basel-sbb','basel-messe']){
      await page.locator(`[data-place="${id}"]`).click();await page.waitForFunction(id=>window.__jura3dCamera().activePlace===id&&!window.__jura3dCamera().flyingTo,id);await ready(page);
      report.views.push({id,rendering:await page.evaluate(()=>window.__jura3dPerformance())});await page.screenshot({path:`${output}/${id}.png`});
    }
    await page.locator('[data-place="basel-centre"]').click();await page.waitForFunction(()=>window.__jura3dCamera().activePlace==='basel-centre'&&!window.__jura3dCamera().flyingTo);await ready(page);
    const target=await page.evaluate(()=>window.__jura3dBuildingTarget());assert.ok(target);await page.mouse.click(target.x,target.y);
    assert.equal(await page.evaluate(()=>window.__jura3dCamera().selectionKind),'building');assert.match(await page.locator('#selection-credit').textContent(),/Basel-Stadt/);
    const addresses=['STR_HAUSNR','ORT'].map(key=>target.properties.find(p=>p.key===key)?.value).filter(v=>typeof v==='string'&&v.trim());
    for(const value of addresses)assert.ok((await page.locator('#selection-description').textContent()).includes(value.trim().slice(0,160)));
    report.buildingAddressChecked=addresses.length>0;
    await page.locator('#clear-selection').click();report.buildingPropertyKeys=target.properties.map(p=>p.key);
  });
  await phase('Parkings officiels, trois fiches et fraîcheur',async()=>{
    await activate(page);const data=await state(page);assert.equal(data.entityCount,data.records.length);assert.ok(data.records.length>=3);
    report.parkingObservations=data.records;report.parkingFetchedAt=data.fetchedAt;
    for(const [id,lon,lat] of [['baselparkhauscity',7.5824076,47.561101],['baselparkhauskunstmuseum',7.5927014,47.5545146],['baselparkhausmesse',7.602175,47.563241]]){
      const record=data.records.find(r=>r.id===id);assert.ok(record);assert.equal(record.longitude,lon);assert.equal(record.latitude,lat);
      await page.locator('#parking-place').selectOption(id);await page.locator('#parking-open').click();await page.waitForFunction(()=>!window.__jura3dParking().focusing);await ready(page);
      assert.equal(await page.locator('#selection-title').textContent(),record.name);
      assert.ok((await page.locator('#parking-properties').textContent()).includes(String(record.free??'Non renseigné')));
      if(record.freshness==='stale')assert.match(await page.locator('#parking-freshness').textContent(),/ancienne/);
      assert.equal(await page.locator('#parking-link').getAttribute('href'),record.url);await page.screenshot({path:`${output}/${id}.png`});await page.locator('#clear-selection').click();
    }
    await page.locator('#parking-place').selectOption('baselparkhauscity');await page.locator('#parking-open').click();await page.waitForFunction(()=>!window.__jura3dParking().focusing);
    await page.evaluate(()=>window.__jura3dLayers.refresh('parking'));await parkReady(page);
    assert.equal((await state(page)).selectedId,'baselparkhauscity');assert.equal(await page.locator('#selection').isVisible(),true);
    await page.locator('#clear-selection').click();
    const marker=await page.evaluate(()=>window.__jura3dParkingTarget('baselparkhauscity'));assert.ok(marker);await page.mouse.click(marker.x,marker.y);
    assert.equal((await state(page)).selectedId,'baselparkhauscity');await page.locator('#clear-selection').click();
    await page.locator('#parking').uncheck();assert.equal((await state(page)).sourceCount,0);await page.locator('#parking').check();await parkReady(page);assert.equal((await state(page)).sourceCount,1);
    assert.equal(requests.some(u=>u.includes('swissbuildings3d')),false);
  });
  await page.close();
  // Réutiliser le relevé validé en mémoire : le probe reste reproductible sans fichier ignoré.
  const fixture={total_count:report.parkingObservations.length,results:report.parkingObservations.map(r=>({
    id:r.id,title:r.name,geo_point_2d:{lon:r.longitude,lat:r.latitude},free:r.free,total:r.total,
    published:r.observedAt===null?null:new Date(r.observedAt).toISOString(),status:r.status,address:r.address,link:r.url,
  }))};
  await phase('Récent, vieillissement, panne et réessai sans faux temps réel',async()=>{
    const p=await browser.newPage();let failed=false;const now=Date.now();const data=structuredClone(fixture);
    for(const r of data.results)r.published=new Date(now-60000).toISOString();data.results[0].free=0;data.results[0].total=null;
    await p.clock.setFixedTime(now);await p.route(api,r=>r.fulfill(failed?{status:503,body:'Panne injectée'}:{contentType:'application/json',body:JSON.stringify(data)}));
    await p.goto(url.href);await ready(p);await activate(p);await p.locator('#parking-place').selectOption(data.results[0].id);await p.locator('#parking-open').click();
    assert.match(await p.locator('#parking-freshness').textContent(),/récente/);assert.match(await p.locator('#parking-properties').textContent(),/Non renseigné/);
    failed=true;await p.evaluate(()=>window.__jura3dLayers.refresh('parking'));assert.equal((await state(p)).state,'error');assert.equal((await state(p)).records.length,data.results.length);
    assert.match(await p.locator('#parking-freshness').textContent(),/indisponible/);
    failed=false;await p.locator('#parking-retry').click();await parkReady(p);await p.clock.setFixedTime(now+360000);
    await p.waitForFunction(()=>document.querySelector('#parking-freshness').textContent.includes('ancienne'));
    report.freshness={zeroPreserved:true,unknownCapacity:true,cachedOnFailure:true,clockAgesObservation:true};await p.close();
  });
  await phase('Panne initiale, réponse partielle et annulation',async()=>{
    const p=await browser.newPage();let mode='error';let release;const gate=new Promise(r=>{release=r;});let held=0;
    await p.route(api,async r=>{if(mode==='held'){held++;await gate;try{await r.fulfill({contentType:'application/json',body:JSON.stringify(fixture)});}catch{}return;}
      await r.fulfill(mode==='error'?{status:503,body:'Panne injectée'}:{contentType:'application/json',body:JSON.stringify({total_count:16,results:[fixture.results[0]]})});});
    try{
      await p.goto(url.href);await ready(p);await p.locator('#parking-settings').evaluate(e=>{e.open=true;});await p.locator('#parking').check();
      await p.waitForFunction(()=>window.__jura3dParking().state==='error');assert.equal((await state(p)).entityCount,0);assert.equal(await p.locator('#layer-alert-retry').isVisible(),true);
      mode='partial';await p.locator('#parking-retry').click();await p.waitForFunction(()=>window.__jura3dParking().state==='error'&&!window.__jura3dParking().loading);assert.equal((await state(p)).records.length,0);
      mode='held';await p.locator('#parking-retry').click();while(!held)await p.waitForTimeout(50);
      await p.evaluate(()=>window.__jura3dLayers.destroy());release();await p.waitForTimeout(1000);
      assert.equal((await state(p)).sourceCount,0);assert.equal((await state(p)).records.length,0);assert.equal((await state(p)).enabled,false);
    }finally{release();await p.close();}
  });
  await phase('Fiche tactile simulée portrait et paysages',async()=>{
    const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    p.on('pageerror',e=>report.errors.push(e.message));await p.goto(url.href);await ready(p);await p.locator('#quality').selectOption('low',{force:true});
    await p.locator('#toggle-controls').tap();await activate(p);
    for(const viewport of [{width:390,height:844},{width:844,height:390},{width:722,height:274}]){
      await p.setViewportSize(viewport);if(await p.locator('#controls-body').isHidden())await p.locator('#toggle-controls').tap();
      await p.locator('#parking-place').selectOption('baselparkhauscity');await p.locator('#parking-open').tap();await p.waitForFunction(()=>!window.__jura3dParking().focusing);
      assert.equal(await p.locator('#selection-parking').isVisible(),true);
      for(const selector of ['#clear-selection','#selection-credit','.credit']){
        assert.ok(await p.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),selector);
      }
      await p.locator('#selection-content').evaluate(e=>{e.scrollTop=e.scrollHeight;});await p.screenshot({path:`${output}/touch-${viewport.width}x${viewport.height}.png`});await p.locator('#clear-selection').tap();
    }
    await p.close();
  });
  assert.deepEqual(report.errors,[]);report.completed=true;report.endedAt=new Date().toISOString();
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{await save();console.log(JSON.stringify({completed:report.completed,checks:report.checks.length,failure:report.failure,errors:report.errors}));await browser.close();}
