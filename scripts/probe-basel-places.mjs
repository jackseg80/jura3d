import {chromium} from 'playwright-core';import assert from 'node:assert/strict';import{mkdir,writeFile}from'node:fs/promises';
import {loadBaselPlaces} from '../src/basel-places-data.js';
const output=process.env.JURA3D_PROBE_OUTPUT??'.vite/b2/probe',url=new URL(process.env.JURA3D_URL??'http://127.0.0.1:4320/jura3d/bale/');url.searchParams.set('probe','1');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--no-sandbox',...(process.env.JURA3D_PROBE_GPU==='high'?['--force_high_performance_gpu']:[])]});
const report={startedAt:new Date().toISOString(),url:url.href,completed:false,checks:[],errors:[]};
const save=()=>writeFile(`${output}/probe-places.json`,JSON.stringify(report,null,2));
const state=p=>p.evaluate(()=>window.__jura3dHeritage());
const ready=p=>p.waitForFunction(()=>document.querySelector('#status').dataset.state==='ready',undefined,{timeout:90000});
const loaded=p=>p.waitForFunction(()=>window.__jura3dHeritage().state==='ready',undefined,{timeout:45000});
const settled=p=>p.waitForFunction(()=>!window.__jura3dHeritage().focusing&&!window.__jura3dHeritage().focusPending,undefined,{timeout:45000});
const activate=async p=>{await p.locator('#heritage-settings').evaluate(e=>{e.open=true;});await p.locator('#heritage').check();await loaded(p);};
const source=/api\.geo\.bs\.ch\/(stac\/v1\/collections\/BI(?:PO|FO)|ogc\/v1\/wfs3\/collections\/ch\.bs\.basel_info_)/;
const phase=async(name,fn)=>{await fn();report.checks.push({name,at:new Date().toISOString()});await save();console.log(name);};
try {
 const data=await loadBaselPlaces({bounds:[5.5,45.5,11,49]},undefined),byId=new Map(data.records.map(r=>[r.id,r]));
 const p=await browser.newPage({viewport:{width:1440,height:900}}),requests=[];
 p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(source.test(r.url()))requests.push(r.url());});
 await p.goto(url.href);await ready(p);await p.locator('#quality').selectOption('medium');
 await phase('Chargement volontaire, licences, sources et secteurs',async()=>{
  assert.equal(requests.length,0);assert.equal(await p.locator('#heritage').isChecked(),false);await activate(p);
  const s=await state(p);assert.deepEqual(s.counts,data.counts);assert.equal(s.total,data.records.length);assert.equal(requests.length,5);
  assert.ok(s.entityCount>0&&s.entityCount<s.total);assert.equal(s.sourceCount,1);report.initial=s;
  await p.locator('#heritage-locality').selectOption('');assert.equal((await state(p)).entityCount,data.records.length);
  await p.locator('#heritage-category').selectOption('Musées, expositions et collections');
  assert.ok((await state(p)).filtered.every(r=>r.category==='Musées, expositions et collections'));
  await p.locator('#heritage-category').selectOption('');await p.locator('#heritage-locality').selectOption('active');
 });
 await phase('Fiches natives et absences explicites, neuf lieux comparés',async()=>{
  report.sampled=[];
  for(const name of ['Kunstmuseum Basel | Hauptbau','Museum Tinguely','Basler Papiermühle','Antikenmuseum Basel und Sammlung Ludwig','Krypta unter der Vierung des Basler Münsters','Fasnachts-Brunnen ("Tinguely-Brunnen")','Münster','Rathaus','Spalentor']){
   const row=data.records.find(r=>r.display.name===name);assert.ok(row);await p.locator('#heritage-place').selectOption(row.id);await p.locator('#heritage-open').click();await settled(p);
   assert.equal(await p.locator('#selection-title').textContent(),name);
   assert.equal(await p.locator('#selection-description').textContent(),row.display.description||'Description non fournie par la source.');
   assert.equal(await p.locator('#selection-pdf').getAttribute('href'),row.display.url);assert.equal(await p.locator('#selection-pdf').getAttribute('aria-disabled'),String(!row.display.url));
   assert.match(await p.locator('#selection-position').textContent(),/sans liaison au bâtiment/);
   assert.equal(await p.locator('#selection-heritage-source a').getAttribute('href'),row.display.source);
   assert.match(await p.locator('#selection-credit').textContent(),/Geodaten Kanton Basel-Stadt.*CC BY/);
   for(const[key,value]of Object.entries(row.feature.properties).filter(([key,value])=>!['Name','Beschreibung','Link'].includes(key)&&value!==null&&value!==undefined&&String(value).trim()))assert.ok((await p.locator('#selection-properties').textContent()).includes(String(value)),key);
   report.sampled.push({id:row.id,name,point:row.feature.geometry.coordinates,url:row.display.url});
   if(name==='Kunstmuseum Basel | Hauptbau')await p.screenshot({path:`${output}/museum-card.png`});
   await p.locator('#clear-selection').click();
  }
 });
 await phase('Vrais clics de groupe et lieu, trois destinations',async()=>{
  await p.locator('[data-place="basel-centre"]').click();await ready(p);await p.waitForFunction(()=>!window.__jura3dCamera().flyingTo);await p.waitForTimeout(1600);
  const group=await p.evaluate(()=>window.__jura3dHeritageGroupTarget());assert.ok(group);await p.mouse.click(group.x,group.y);
  assert.equal(await p.locator('#selection-group button').count(),group.count);assert.deepEqual((await p.locator('#selection-group button').evaluateAll(nodes=>nodes.map(n=>n.dataset.heritageId))).sort(),[...group.ids].sort());
  const first=group.ids[0];await p.locator(`[data-heritage-id="${first}"]`).click();assert.equal(await p.locator('#selection-title').textContent(),byId.get(first).display.name);await p.locator('#clear-selection').click();report.group=group;
  await p.locator('#heritage-category').selectOption('Repères remarquables');await p.locator('#heritage-place').selectOption('landmarks:28');await p.locator('#heritage-open').click();await settled(p);await p.locator('#clear-selection').click();await p.waitForTimeout(500);
  const target=await p.evaluate(()=>window.__jura3dHeritageTarget('landmarks:28'));assert.ok(target);await p.mouse.click(target.x,target.y);assert.equal(await p.locator('#selection-title').textContent(),'Münster');await p.locator('#clear-selection').click();report.clicked=target;
  await p.locator('#heritage-category').selectOption('');report.views=[];
  for(const place of ['basel-centre','basel-sbb','basel-messe']){await p.locator(`[data-place="${place}"]`).click();await p.waitForFunction(()=>!window.__jura3dCamera().flyingTo);await ready(p);const s=await state(p);assert.equal(s.sourceCount,1);report.views.push({place,count:s.entityCount});await p.screenshot({path:`${output}/${place}.png`});}
 });
 await phase('Coexistence transports/parkings, cache et retrait propre',async()=>{
  await p.evaluate(async()=>{await window.__jura3dLayers.setEnabled('transport',true);await window.__jura3dLayers.setEnabled('parking',true);});
  await p.waitForFunction(()=>window.__jura3dTransport().state==='ready'&&window.__jura3dParking().state==='ready');assert.equal((await state(p)).sourceCount,3);
  const count=requests.length;
  for(let i=0;i<3;i++){await p.locator('#heritage').uncheck();assert.equal((await state(p)).sourceCount,2);assert.equal(await p.locator('#selection').isVisible(),false);await p.locator('#heritage').check();await loaded(p);assert.equal((await state(p)).sourceCount,3);}
  assert.equal(requests.length,count);await p.locator('#heritage').uncheck();await p.evaluate(async()=>{await window.__jura3dLayers.setEnabled('transport',false);await window.__jura3dLayers.setEnabled('parking',false);});assert.equal((await state(p)).sourceCount,0);
 });
 await p.close();
 await phase('Panne, licence changée, réponse partielle, annulation et destruction',async()=>{
  const q=await browser.newPage();q.on('pageerror',e=>report.errors.push(e.message));let mode='http',release=()=>{},held=false;
  await q.route('**/api.geo.bs.ch/**',async route=>{
   if(!source.test(route.request().url()))return route.continue();
   if(mode==='http')return route.fulfill({status:503,body:'unavailable'});
   if(mode==='license'&&route.request().url().includes('/stac/'))return route.fulfill({status:200,json:{id:route.request().url().split('/').at(-1),license:'restricted'}});
   if(mode==='partial'&&route.request().url().includes('/items.json'))return route.fulfill({status:200,json:{type:'FeatureCollection',features:[],numberMatched:10,numberReturned:0}});
   if(mode==='held'){held=true;await new Promise(r=>{release=r;});return route.abort().catch(()=>{});}
   return route.continue();
  });
  try{await q.goto(url.href);await ready(q);await q.locator('#heritage-settings').evaluate(e=>{e.open=true;});await q.locator('#heritage').check();await q.waitForFunction(()=>window.__jura3dHeritage().state==='error');assert.equal((await state(q)).entityCount,0);assert.equal(await q.locator('#layer-alert-retry').isVisible(),true);
   for(mode of ['license','partial']){await q.locator('#heritage-retry').click();await q.waitForFunction(()=>window.__jura3dHeritage().state==='error');assert.equal((await state(q)).total,0);}
   mode='ok';await q.locator('#heritage-retry').click();await loaded(q);assert.equal((await state(q)).total,data.records.length);
   await q.evaluate(()=>window.__jura3dLayers.destroy());assert.equal((await state(q)).sourceCount,0);assert.equal((await state(q)).total,0);
  }finally{release();await q.close();}
  const late=await browser.newPage();let releases=[];late.on('pageerror',e=>report.errors.push(e.message));
  await late.route('**/api.geo.bs.ch/stac/**',async route=>{await new Promise(r=>releases.push(r));return route.fulfill({status:200,json:{id:route.request().url().split('/').at(-1),license:'CC-BY-4.0'}}).catch(()=>{});});
  try{await late.goto(url.href);await ready(late);await late.evaluate(()=>void window.__jura3dLayers.setEnabled('heritage',true));await late.waitForTimeout(300);await late.evaluate(()=>window.__jura3dLayers.destroy());for(const r of releases)r();await late.waitForTimeout(700);assert.equal((await state(late)).sourceCount,0);assert.equal((await state(late)).total,0);assert.equal((await state(late)).enabled,false);}finally{for(const r of releases)r();await late.close();}
 });
 await phase('Fiches et panneau tactiles simulés portrait et paysage',async()=>{
  const q=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});q.on('pageerror',e=>report.errors.push(e.message));
  await q.goto(url.href);await ready(q);await q.locator('#quality').selectOption('low',{force:true});await q.locator('#toggle-controls').tap();await activate(q);
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:722,height:274}]){
   await q.setViewportSize(viewport);if(await q.locator('#controls-body').isHidden())await q.locator('#toggle-controls').tap();
   await q.locator('#heritage-place').selectOption('culture:30');await q.locator('#heritage-open').tap();await settled(q);
   assert.equal(await q.locator('#selection-title').textContent(),'Kunstmuseum Basel | Hauptbau');
   for(const id of ['#clear-selection','#selection-credit','.credit'])assert.ok(await q.locator(id).evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),id);
   await q.locator('#selection-content').evaluate(e=>{e.scrollTop=e.scrollHeight;});assert.equal(await q.locator('#selection-heritage-source a').getAttribute('target'),'_blank');
   await q.screenshot({path:`${output}/touch-${viewport.width}x${viewport.height}.png`});await q.locator('#clear-selection').tap();
   if(await q.locator('#controls-body').isHidden())await q.locator('#toggle-controls').tap();await q.locator('#heritage-settings').evaluate(e=>e.scrollIntoView({block:'start'}));
  }await q.close();
 });
 assert.deepEqual(report.errors,[]);report.completed=true;report.endedAt=new Date().toISOString();
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{await save();console.log(JSON.stringify({completed:report.completed,checks:report.checks.length,failure:report.failure,errors:report.errors}));await browser.close();}
