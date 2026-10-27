import{chromium}from'playwright-core';import assert from'node:assert/strict';import{mkdir,writeFile}from'node:fs/promises';import{loadSanitary,SANITARY_INFO}from'../src/sanitary-data.js';
const output=process.env.JURA3D_PROBE_OUTPUT??'.vite/b3/probe',url=new URL(process.env.JURA3D_URL??'http://127.0.0.1:4322/jura3d/bale/');url.searchParams.set('probe','1');await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--no-sandbox',...(process.env.JURA3D_PROBE_GPU==='high'?['--force_high_performance_gpu']:[])]});
const report={startedAt:new Date().toISOString(),url:url.href,completed:false,checks:[],errors:[]},save=()=>writeFile(`${output}/probe-sanitary.json`,JSON.stringify(report,null,2));
const state=p=>p.evaluate(()=>window.__jura3dServices()),ready=p=>p.waitForFunction(()=>document.querySelector('#status').dataset.state==='ready',undefined,{timeout:90000});
const loaded=p=>p.waitForFunction(()=>window.__jura3dServices().state==='ready',undefined,{timeout:45000});
const settled=p=>p.waitForFunction(()=>!window.__jura3dServices().focusing&&!window.__jura3dServices().focusPending,undefined,{timeout:45000});
const activate=async p=>{await p.locator('#services-settings').evaluate(e=>{e.open=true;});await p.locator('#services').check();await loaded(p);};
const phase=async(name,fn)=>{await fn();report.checks.push({name,at:new Date().toISOString()});await save();console.log(name);};
const source=/data\.bs\.ch\/api\/explore\/v2\.1\/catalog\/datasets\/100031(?:\/|\?|$)/;
try{
 const data=await loadSanitary({bounds:[5.5,45.5,11,49]},undefined),byId=new Map(data.records.map(r=>[r.id,r]));
 const p=await browser.newPage({viewport:{width:1440,height:900}}),requests=[];p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(source.test(r.url()))requests.push(r.url());});
 await p.goto(url.href);await ready(p);await p.locator('#quality').selectOption('medium');
 await phase('Chargement volontaire, complétude et filtres type/Eurokey/secteur',async()=>{
  assert.equal(requests.length,0);assert.equal(await p.locator('#services').isChecked(),false);await activate(p);const s=await state(p);assert.equal(s.total,data.records.length);assert.equal(s.sourceCount,1);assert.equal(requests.length,3);assert.ok(s.entityCount>0&&s.entityCount<s.total);report.initial=s;
  await p.locator('#services-locality').selectOption('');assert.equal((await state(p)).entityCount,data.records.length);
  await p.locator('#services-category').selectOption('Toilettes partenaires');assert.equal((await state(p)).entityCount,data.records.filter(r=>r.display.category==='Toilettes partenaires').length);
  await p.locator('#services-category').selectOption('');await p.locator('#services-eurokey').selectOption('yes');assert.equal((await state(p)).entityCount,data.records.filter(r=>r.display.eurokey===true).length);
  await p.locator('#services-eurokey').selectOption('no');assert.equal((await state(p)).entityCount,data.records.filter(r=>r.display.eurokey===false).length);
  await p.locator('#services-eurokey').selectOption('unknown');assert.equal((await state(p)).entityCount,0);assert.equal(await p.locator('#services-open').isDisabled(),true);await p.locator('#services-eurokey').selectOption('');
 });
 await phase('Fiches natives : fermé, payant, partenaire, douche et champs absents',async()=>{
  const sample=[...new Set(['sanitary:4','sanitary:12','sanitary:21','sanitary:10001','sanitary:144','sanitary:156',data.records.find(r=>r.native.typ==='Dusche').id,data.records.find(r=>r.native.typ==='nur Pissoir').id])];report.sampled=[];
  for(const id of sample){const r=byId.get(id);assert.ok(r);await p.locator('#services-place').selectOption(id);await p.locator('#services-open').click();await settled(p);
   assert.equal(await p.locator('#selection-title').textContent(),r.display.name);assert.equal(await p.locator('#selection-description').textContent(),r.display.description);
   for(const[label,value]of r.display.fields){assert.ok((await p.locator('#selection-properties').textContent()).includes(label));assert.ok((await p.locator('#selection-properties').textContent()).includes(String(value)));}
   assert.equal(await p.locator('#selection-pdf').getAttribute('href'),r.display.url);assert.match(await p.locator('#selection-credit').textContent(),/Geodaten Kanton Basel-Stadt.*CC BY/);assert.match(await p.locator('#selection-heritage-source').textContent(),/sans horaire individuel/);
   report.sampled.push({id,name:r.display.name,point:r.feature.geometry.coordinates,closed:r.display.closed,eurokey:r.display.eurokey});
   if(id==='sanitary:144')await p.screenshot({path:`${output}/paid-card.png`});if(id==='sanitary:21')await p.screenshot({path:`${output}/closed-card.png`});
   await p.locator('#clear-selection').click();
  }
  await p.locator('#services-place').selectOption('sanitary:4');await p.locator('#services-open').click();await settled(p);
  const popupPromise=p.waitForEvent('popup');await p.locator('#selection-pdf').click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');assert.equal(new URL(popup.url()).hostname,'www.bs.ch');assert.equal(new URL(popup.url()).pathname,new URL(SANITARY_INFO).pathname);report.officialLink=popup.url();await popup.close();await p.locator('#clear-selection').click();
 });
 await phase('Vrai clic de repère et groupe, navigation des trois vues',async()=>{
  await p.locator('#services-place').selectOption('sanitary:4');await p.locator('#services-open').click();await settled(p);await p.locator('#clear-selection').click();await p.waitForTimeout(500);
  const target=await p.evaluate(()=>window.__jura3dServicesTarget('sanitary:4'));assert.ok(target);await p.mouse.click(target.x,target.y);assert.equal(await p.locator('#selection-title').textContent(),byId.get('sanitary:4').display.name);report.clicked=target;await p.locator('#clear-selection').click();
  await p.locator('#services-locality').selectOption('active');await p.locator('[data-place="basel-centre"]').click();await p.waitForFunction(()=>!window.__jura3dCamera().flyingTo);await ready(p);await p.waitForTimeout(1200);
  const group=await p.evaluate(()=>window.__jura3dServicesGroupTarget());assert.ok(group);await p.mouse.click(group.x,group.y);assert.equal(await p.locator('#selection-group button').count(),group.count);assert.deepEqual((await p.locator('#selection-group button').evaluateAll(nodes=>nodes.map(n=>n.dataset.servicesId))).sort(),[...group.ids].sort());
  const first=group.ids[0];await p.locator(`[data-services-id="${first}"]`).click();assert.equal(await p.locator('#selection-title').textContent(),byId.get(first).display.name);report.group=group;await p.locator('#clear-selection').click();report.views=[];
  for(const place of ['basel-centre','basel-sbb','basel-messe']){await p.locator(`[data-place="${place}"]`).click();await p.waitForFunction(()=>!window.__jura3dCamera().flyingTo);await ready(p);const s=await state(p);assert.equal(s.sourceCount,1);report.views.push({place,count:s.entityCount});await p.screenshot({path:`${output}/${place}.png`});}
 });
 await phase('Coexistence quatre couches, cache et retraits propres',async()=>{
  await p.evaluate(async()=>{for(const id of ['heritage','transport','parking'])await window.__jura3dLayers.setEnabled(id,true);});
  await p.waitForFunction(()=>window.__jura3dHeritage().state==='ready'&&window.__jura3dTransport().state==='ready'&&window.__jura3dParking().state==='ready');assert.equal((await state(p)).sourceCount,4);const count=requests.length;
  for(let i=0;i<3;i++){await p.locator('#services').uncheck();assert.equal((await state(p)).sourceCount,3);assert.equal(await p.locator('#selection').isVisible(),false);await p.locator('#services').check();await loaded(p);assert.equal((await state(p)).sourceCount,4);}assert.equal(requests.length,count);
  await p.locator('#services').uncheck();await p.evaluate(async()=>{for(const id of ['heritage','transport','parking'])await window.__jura3dLayers.setEnabled(id,false);});assert.equal((await state(p)).sourceCount,0);
 });await p.close();
 await phase('Panne, conditions modifiées, réponse partielle, réessai et destruction',async()=>{
  const q=await browser.newPage();q.on('pageerror',e=>report.errors.push(e.message));let mode='http';
  await q.route('**/catalog/datasets/100031**',async route=>{if(mode==='http')return route.fulfill({status:503,body:'unavailable'});if(mode==='license'&&!route.request().url().includes('/records?'))return route.fulfill({status:200,json:{metas:{default:{license:'restricted'}}}});if(mode==='partial'&&route.request().url().includes('/records?'))return route.fulfill({status:200,json:{total_count:10,results:[]}});return route.continue();});
  try{await q.goto(url.href);await ready(q);await q.locator('#services-settings').evaluate(e=>{e.open=true;});await q.locator('#services').check();await q.waitForFunction(()=>window.__jura3dServices().state==='error');assert.equal((await state(q)).entityCount,0);assert.equal(await q.locator('#layer-alert-retry').isVisible(),true);
   for(mode of ['license','partial']){await q.locator('#services-retry').click();await q.waitForFunction(()=>window.__jura3dServices().state==='error');assert.equal((await state(q)).total,0);}
   mode='ok';await q.locator('#services-retry').click();await loaded(q);assert.equal((await state(q)).total,data.records.length);await q.evaluate(()=>window.__jura3dLayers.destroy());assert.equal((await state(q)).sourceCount,0);assert.equal((await state(q)).total,0);
  }finally{await q.close();}
  const late=await browser.newPage();let release;late.on('pageerror',e=>report.errors.push(e.message));await late.route('**/catalog/datasets/100031',async route=>{await new Promise(r=>{release=r;});return route.abort().catch(()=>{});});
  try{await late.goto(url.href);await ready(late);await late.evaluate(()=>void window.__jura3dLayers.setEnabled('services',true));for(let i=0;i<30&&!release;i++)await late.waitForTimeout(100);assert.ok(release);await late.evaluate(()=>window.__jura3dLayers.setEnabled('services',false));assert.equal((await state(late)).state,'off');await late.evaluate(()=>window.__jura3dLayers.destroy());release();await late.waitForTimeout(700);assert.equal((await state(late)).total,0);assert.equal((await state(late)).sourceCount,0);}finally{release?.();await late.close();}
 });
 await phase('Panneau et fiche tactiles simulés portrait et paysage',async()=>{
  const q=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});q.on('pageerror',e=>report.errors.push(e.message));await q.goto(url.href);await ready(q);await q.locator('#quality').selectOption('low',{force:true});await q.locator('#toggle-controls').tap();await activate(q);
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:722,height:274}]){await q.setViewportSize(viewport);if(await q.locator('#controls-body').isHidden())await q.locator('#toggle-controls').tap();await q.locator('#services-place').selectOption('sanitary:144');await q.locator('#services-open').tap();await settled(q);
   for(const id of ['#clear-selection','#selection-credit','.credit'])assert.ok(await q.locator(id).evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),id);
   await q.locator('#selection-content').evaluate(e=>{e.scrollTop=e.scrollHeight;});await q.screenshot({path:`${output}/touch-${viewport.width}x${viewport.height}.png`});await q.locator('#clear-selection').tap();
  }await q.close();
 });
 assert.deepEqual(report.errors,[]);report.completed=true;report.endedAt=new Date().toISOString();
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{await save();console.log(JSON.stringify({completed:report.completed,checks:report.checks.length,failure:report.failure,errors:report.errors}));await browser.close();}
