import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const url=new URL(process.env.JURA3D_URL??'http://127.0.0.1:4306/jura3d/');
const output=process.env.JURA3D_PROBE_OUTPUT??'.vite/pub2';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,
  args:['--no-sandbox',...(process.env.JURA3D_PROBE_GPU==='high'?['--force_high_performance_gpu']:[])]});
const report={startedAt:new Date().toISOString(),url:url.href,browser:browser.version(),completed:false,checks:[],errors:[]};
const ready=p=>p.waitForFunction(()=>document.querySelector('#status')?.dataset.state==='ready',undefined,{timeout:90000});
async function openControls(p){await p.locator('#toggle-controls').evaluate(e=>{if(e.getAttribute('aria-expanded')!=='true')e.click();});}
async function returnHome(p){await openControls(p);await p.locator('#site-home').click();await p.waitForURL(url.href);assert.equal(await p.locator('[data-territory]').count(),2);}
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage(),requests=[];
  p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  p.on('request',r=>requests.push(r.url()));p.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')report.errors.push(`${r.failure()?.errorText} ${r.url()}`);});
  p.on('response',r=>{if(r.status()>=400)report.errors.push(`HTTP ${r.status()} ${r.url()}`);});
  await p.goto(url.href);const infoResponse=await p.request.get(new URL('build-info.json',url).href);assert.equal(infoResponse.status(),200);
  report.build=await infoResponse.json();assert.equal(report.build.kind,'territory-site');assert.equal(report.build.base,url.pathname);
  if(process.env.JURA3D_EXPECTED_REVISION)assert.equal(report.build.revision,process.env.JURA3D_EXPECTED_REVISION);
  assert.equal(requests.filter(r=>new URL(r).origin!==url.origin).length,0,'accueil sans service externe');
  assert.equal(await p.locator('script').count(),0,'accueil statique');assert.equal(await p.locator('[data-territory]').count(),2);
  await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.className),'skip-link');await p.keyboard.press('Enter');
  await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.dataset.territory),'jura');
  await p.screenshot({path:`${output}/home-desktop.png`,fullPage:true});report.checks.push('accueil statique, deux liens, accès clavier');
  await p.keyboard.press('Enter');await p.waitForURL(new URL('jura/',url).href);await ready(p);
  await p.locator('#settings').evaluate(e=>{e.open=true;});await p.locator('#quality').selectOption('medium');await ready(p);
  for(const place of ['delemont','porrentruy','saignelegier','saint-ursanne']){await p.locator(`[data-place="${place}"]`).click();await p.waitForFunction(id=>document.querySelector(`[data-place="${id}"]`).getAttribute('aria-pressed')==='true',place);await ready(p);}
  for(const id of ['heritage','transport']){
    await p.locator(`#${id}-settings`).evaluate(e=>{e.open=true;});await p.locator(`#${id}`).check();await p.waitForFunction(id=>document.querySelector(`#${id}-status`).dataset.state==='ready',id);
    const value=await p.locator(`#${id}-place option`).first().getAttribute('value');await p.locator(`#${id}-place`).selectOption(value);await p.locator(`#${id}-open`).click();
    await p.waitForFunction(()=>!document.querySelector('#selection').hidden);assert.match(await p.locator('#selection-credit').textContent(),/Canton du Jura/);await p.locator('#clear-selection').click();
  }
  const condition=await p.locator('#heritage-credit a').first().getAttribute('href'),pdf=await p.request.get(new URL(condition,p.url()).href);assert.equal(pdf.status(),200);assert.equal((await pdf.body()).subarray(0,4).toString(),'%PDF');
  assert.match(await p.locator('.credit').textContent(),/© swisstopo/);await returnHome(p);report.checks.push('Jura : quatre destinations, patrimoine/bus/fiches/PDF, retour accueil');
  const baselStart=requests.length;await p.locator('[data-territory="basel"]').click();await p.waitForURL(new URL('bale/',url).href);await ready(p);
  await p.locator('#settings').evaluate(e=>{e.open=true;});await p.locator('#quality').selectOption('medium');
  for(const place of ['basel-centre','basel-sbb','basel-messe']){await p.locator(`[data-place="${place}"]`).click();await p.waitForFunction(id=>document.querySelector(`[data-place="${id}"]`).getAttribute('aria-pressed')==='true',place);await ready(p);}
  await p.locator('#parking-settings').evaluate(e=>{e.open=true;});await p.locator('#parking').check();await p.waitForFunction(()=>document.querySelector('#parking-status').dataset.state==='ready');
  for(const id of ['baselparkhauscity','baselparkhauskunstmuseum','baselparkhausmesse']){
    await p.locator('#parking-place').selectOption(id);await p.locator('#parking-open').click();await p.waitForFunction(()=>!document.querySelector('#selection').hidden);
    assert.match(await p.locator('#selection-title').textContent(),/Parkhaus/);assert.match(await p.locator('#selection-credit').textContent(),/Parkhäuser/);
    assert.match(await p.locator('#parking-link').getAttribute('href'),/^https:\/\/www\.parkleitsystem-basel\.ch\/parkhaus\//);await p.locator('#clear-selection').click();
  }
  assert.equal(requests.slice(baselStart).some(r=>r.includes('swissbuildings3d')||r.includes('/jura/jura/')),false);
  await p.screenshot({path:`${output}/basel-site.png`});await returnHome(p);report.checks.push('Bâle : trois destinations/fiches/liens, seul modèle cantonal, retour accueil');
  const touch=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true}),q=await touch.newPage();
  q.on('pageerror',e=>report.errors.push(e.message));report.touch=[];
  for(const size of [{width:320,height:700},{width:390,height:844},{width:722,height:274}]){
    await q.setViewportSize(size);await q.goto(url.href);assert.ok(await q.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    for(const id of ['jura','basel']){const link=q.locator(`[data-territory="${id}"]`);await link.scrollIntoViewIfNeeded();const box=await link.boundingBox();assert.ok(box.height>=44&&box.width>=44);}
    await q.screenshot({path:`${output}/home-${size.width}x${size.height}.png`,fullPage:true});report.touch.push(size);
  }
  await q.locator('[data-territory="basel"]').tap();await ready(q);await openControls(q);await q.locator('#site-home').scrollIntoViewIfNeeded();
  const linkBox=await q.locator('#site-home').boundingBox();assert.ok(linkBox.y>=0&&linkBox.y+linkBox.height<=274);await q.locator('#site-home').tap();await q.waitForURL(url.href);
  await q.setViewportSize({width:390,height:844});await q.locator('[data-territory="jura"]').tap();await ready(q);await openControls(q);await q.locator('#site-home').tap();await q.waitForURL(url.href);
  report.checks.push('accueil 320/390/722 px, cibles tactiles, liens de retour portrait/paysage simulés');
  assert.deepEqual(report.errors,[]);report.completed=true;report.endedAt=new Date().toISOString();
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{await writeFile(`${output}/probe-site.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();}
