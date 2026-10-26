import{chromium}from'playwright-core';import assert from'node:assert/strict';import{mkdir,writeFile}from'node:fs/promises';
const root=process.env.JURA3D_PROBE_OUTPUT??'.vite/b1';await mkdir(root,{recursive:true});
const url=new URL(process.env.JURA3D_URL??'http://127.0.0.1:4307/');url.searchParams.set('probe','1');
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--no-sandbox',...(process.env.JURA3D_PROBE_GPU==='high'?['--force_high_performance_gpu']:[])]});
const report={startedAt:new Date().toISOString(),url:url.href,completed:false,checks:[],errors:[]};
const save=()=>writeFile(`${root}/probe-transit.json`,JSON.stringify(report,null,2));
const ready=p=>p.waitForFunction(()=>document.querySelector('#status').dataset.state==='ready',undefined,{timeout:90000});
const state=p=>p.evaluate(()=>window.__jura3dTransport());
const loaded=p=>p.waitForFunction(()=>window.__jura3dTransport().state==='ready');
const source=/data\.bs\.ch\/api\/explore\/v2\.1\/catalog\/datasets\/10006[45](?:\/|\?|$)/;
const phase=async(name,fn)=>{await fn();report.checks.push({name,at:new Date().toISOString()});await save();console.log(name);};
const activate=async p=>{await p.locator('#transport-settings').evaluate(e=>{e.open=true;});await p.locator('#transport').check();await loaded(p);};
try{
 const p=await browser.newPage({viewport:{width:1440,height:900}}),requests=[];
 p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(source.test(r.url()))requests.push(r.url());});
 await p.goto(url.href);await ready(p);await p.locator('#quality').selectOption('medium');
 await phase('Chargement à la demande, pagination et périmètre',async()=>{
  assert.equal(requests.length,0);assert.equal(await p.locator('#transport-lines').isChecked(),false);await activate(p);
  const s=await state(p);assert.equal(s.total,821);assert.equal(s.sourceInfo.rawCounts.lines,187);assert.equal(s.sourceInfo.rawCounts.stops,660);
  assert.deepEqual(s.sourceInfo.excluded,{'Fähre':4,'Schiff':2,'S-Bahn':15,'Nacht-S-Bahn':5});assert.ok(s.filtered.every(r=>r.kind==='stop'));assert.ok(requests.length>=11);report.initial=s;report.requests=requests.length;
  assert.equal(await p.locator('#transport-offer').isVisible(),false);assert.equal(await p.locator('#transport-zones').isVisible(),false);
 });
 await phase('Filtres modes, secteurs et géométrie',async()=>{
  await p.locator('#transport-lines').check();await p.locator('#transport-sector').selectOption('');
  assert.equal((await state(p)).filtered.length,821);
  for(const[mode,count]of[['tram',397],['bus',443]]){await p.locator('#transport-mode').selectOption(mode);assert.equal((await state(p)).filtered.length,count);}
  await p.locator('#transport-mode').selectOption('');await p.locator('#transport-sector').selectOption('active');
  for(const id of ['basel-centre','basel-sbb','basel-messe']){await p.locator(`[data-place="${id}"]`).click();await p.waitForFunction(id=>window.__jura3dCamera().activePlace===id&&!window.__jura3dCamera().flyingTo,id);await ready(p);const s=await state(p);assert.ok(s.geometry.renderedLineVertices>0&&s.geometry.renderedLineVertices<s.geometry.sourceLineVertices);report.views??=[];report.views.push({id,geometry:s.geometry,filtered:s.filtered.length});}
 });
 await phase('Fiches sources, vrais repères, liens et crédits',async()=>{
  await p.locator('#transport-lines').uncheck();await p.locator('#transport-kind').selectOption('stop');
  const s=await state(p);const sample=s.filtered.find(r=>r.name.startsWith('Messeplatz'));assert.ok(sample);
  await p.locator('#transport-place').selectOption(sample.id);await p.locator('#transport-open').click();await p.waitForFunction(()=>!window.__jura3dTransport().focusing);await ready(p);
  assert.equal(await p.locator('#selection-title').textContent(),sample.name);assert.match(await p.locator('#transport-properties').textContent(),/Pôle d’arrêt|Accès tram/);assert.match(await p.locator('#transport-link-status').textContent(),/générales/);
  assert.match(await p.locator('#transport-properties').textContent(),/Date annoncée au catalogue/);
  assert.equal(await p.locator('#transport-links a').first().getAttribute('href'),'https://www.bvb.ch/de/fahrplan/haltestellen-fahrplan/');
  assert.equal(await p.locator('#transport-links a[href*="fahrplan-netz"]').count(),0);assert.match(await p.locator('#selection-credit').textContent(),/OpenStreetMap/);
  await p.screenshot({path:`${root}/transit-stop.png`});await p.locator('#clear-selection').click();
  const target=await p.evaluate(id=>window.__jura3dTransportTarget(id),sample.id);assert.ok(target);await p.mouse.click(target.x,target.y);assert.equal((await state(p)).selectedId,sample.id);await p.locator('#clear-selection').click();
  await p.locator('#transport-lines').check();await p.locator('#transport-kind').selectOption('line');const line=await p.locator('#transport-place option').first().getAttribute('value');await p.locator('#transport-place').selectOption(line);await p.locator('#transport-open').click();await p.waitForFunction(()=>!window.__jura3dTransport().focusing);await ready(p);
  assert.match(await p.locator('#selection-title').textContent(),/Tram|Bus/);assert.match(await p.locator('#transport-properties').textContent(),/Opérateur source|Numéro de ligne/);await p.screenshot({path:`${root}/transit-line.png`});await p.locator('#clear-selection').click();
  assert.ok(await p.locator('[data-layer-credit="transport"] a[href="https://www.openstreetmap.org/copyright"]').count());
  assert.equal(await p.locator('#basel-active-credit a').isVisible(),true);
  await p.locator('#transport-lines').uncheck();await p.locator('[data-place="basel-centre"]').click();await p.waitForFunction(()=>!window.__jura3dCamera().flyingTo);await ready(p);
  await p.waitForFunction(()=>window.__jura3dTransportGroupTarget(),undefined,{timeout:20000});
  const group=await p.evaluate(()=>window.__jura3dTransportGroupTarget());await p.mouse.click(group.x,group.y);
  assert.match(await p.locator('#selection-title').textContent(),/quais regroupés/);assert.equal(await p.locator('#selection-group button').count(),group.count);
  const choice=await p.locator('#selection-group button').first().getAttribute('data-transport-id'),expected=(await state(p)).filtered.find(r=>r.id===choice).name;
  await p.locator('#selection-group button').first().click();assert.equal(await p.locator('#selection-title').textContent(),expected);await p.locator('#clear-selection').click();report.group={count:group.count,chosenId:choice};
 });
 await phase('Cache, bascules et coexistence avec parkings',async()=>{
  const count=requests.length;await p.locator('#transport').uncheck();assert.equal((await state(p)).entityCount,0);await p.locator('#transport').check();await loaded(p);assert.equal(requests.length,count);
  await p.locator('#parking-settings').evaluate(e=>{e.open=true;});await p.locator('#parking').check();await p.waitForFunction(()=>window.__jura3dParking().state==='ready');assert.equal((await state(p)).sourceCount,2);await p.locator('#parking').uncheck();assert.equal((await state(p)).sourceCount,1);
 });await p.close();
 await phase('Erreur, réponse partielle, réessai et destruction pendant requête',async()=>{
  const q=await browser.newPage();let mode='error',held=0,release;const gate=new Promise(r=>release=r);
  await q.route(source,async route=>{const u=route.request().url();if(!u.includes('/records?'))return route.continue();
    if(mode==='held'){held++;await gate;try{await route.continue();}catch{}return;}
    return route.fulfill(mode==='error'?{status:503,body:'Panne injectée'}:{contentType:'application/json',body:JSON.stringify({total_count:2,results:[]})});});
  try{await q.goto(url.href);await ready(q);await q.locator('#transport-settings').evaluate(e=>{e.open=true;});await q.locator('#transport').check();await q.waitForFunction(()=>window.__jura3dTransport().state==='error');assert.equal((await state(q)).entityCount,0);
    await q.locator('#toggle-controls').click();assert.equal(await q.locator('#layer-alert-retry').isVisible(),true);mode='partial';await q.locator('#layer-alert-retry').click();await q.waitForFunction(()=>window.__jura3dTransport().state==='error');assert.equal((await state(q)).total,0);
    await q.unroute(source);await q.locator('#layer-alert-retry').click();await loaded(q);assert.equal((await state(q)).total,821);await q.evaluate(()=>window.__jura3dLayers.destroy());assert.equal((await state(q)).sourceCount,0);
  }finally{release();await q.close();}
  const t=await browser.newPage();let unblock,started=0;const pending=new Promise(r=>unblock=r);await t.route(source,async route=>{started++;await pending;try{await route.continue();}catch{}});
  try{await t.goto(url.href);await ready(t);await t.locator('#transport-settings').evaluate(e=>{e.open=true;});await t.locator('#transport').check();while(!started)await t.waitForTimeout(50);await t.evaluate(()=>window.__jura3dLayers.destroy());unblock();await t.waitForTimeout(800);assert.equal((await state(t)).total,0);assert.equal((await state(t)).sourceCount,0);}finally{unblock();await t.close();}
 });
 await phase('Fiches et panneau tactiles simulés portrait/paysage',async()=>{
  const q=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await q.goto(url.href);await ready(q);await q.locator('#quality').selectOption('low',{force:true});await q.locator('#toggle-controls').tap();await activate(q);
  for(const size of[{width:390,height:844},{width:722,height:274}]){await q.setViewportSize(size);if(await q.locator('#controls-body').isHidden())await q.locator('#toggle-controls').tap();await q.locator('#transport-kind').selectOption('stop');const id=await q.locator('#transport-place option').first().getAttribute('value');await q.locator('#transport-place').selectOption(id);await q.locator('#transport-open').tap();await q.waitForFunction(()=>!window.__jura3dTransport().focusing);
    await q.locator('#selection-content').evaluate(e=>e.scrollTop=e.scrollHeight);for(const sel of ['#clear-selection','#selection-credit','.credit'])assert.ok(await q.locator(sel).evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),sel);
    await q.screenshot({path:`${root}/transit-touch-${size.width}.png`});await q.locator('#clear-selection').tap();}
  if(await q.locator('#controls-body').isHidden())await q.locator('#toggle-controls').tap();
  await q.locator('#parking-settings').evaluate(e=>{e.open=true;});await q.locator('#parking').check();await q.waitForFunction(()=>window.__jura3dParking().state==='ready');await ready(q);
  const commandHeight=await q.locator('#controls-body').evaluate(e=>e.clientHeight);assert.ok(commandHeight>=100,`Commandes trop courtes avec deux couches : ${commandHeight}`);
  assert.equal(await q.locator('#basel-active-credit [data-compact-layer="transport"]').isVisible(),true);assert.equal(await q.locator('#basel-active-credit [data-compact-layer="parking"]').isVisible(),true);
  await q.locator('#basel-sources summary').tap();const license=q.locator('[data-layer-credit="transport"] a[href="https://www.openstreetmap.org/copyright"]');await license.scrollIntoViewIfNeeded();assert.ok((await license.boundingBox()).height>=44);
  await q.screenshot({path:`${root}/sources-touch-landscape.png`});report.compactCredits={commandHeight,visibleAttributions:true,conditionsTouchable:true};await q.close();
 });assert.deepEqual(report.errors,[]);report.completed=true;report.endedAt=new Date().toISOString();
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{await save();console.log(JSON.stringify({completed:report.completed,checks:report.checks.length,failure:report.failure,errors:report.errors}));await browser.close();}
