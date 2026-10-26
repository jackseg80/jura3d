import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const url=new URL(process.env.JURA3D_URL??'http://127.0.0.1:4305/');url.searchParams.set('probe','1');
const profile=process.env.JURA3D_PRESET??'medium';assert.ok(['low','medium'].includes(profile));
const output=process.env.JURA3D_MEASURE_OUTPUT??'.vite/p8';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,
  args:['--no-sandbox',...(process.env.JURA3D_PROBE_GPU==='high'?['--force_high_performance_gpu']:[])]});
const report={startedAt:new Date().toISOString(),url:url.href,profile,device:'desktop',completed:false,phases:[],errors:[]};
const filename=`${output}/${report.startedAt.replaceAll(':','-')}-territory.json`;
const save=()=>writeFile(filename,JSON.stringify(report,null,2));
const ready=p=>p.waitForFunction(()=>document.querySelector('#status').dataset.state==='ready',undefined,{timeout:90000});
try{
  const context=await browser.newContext({viewport:{width:753,height:1030},deviceScaleFactor:1,timezoneId:'Europe/Zurich'});const p=await context.newPage();
  p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await p.goto(url.href);await ready(p);await p.locator('#quality').selectOption(profile);await ready(p);
  const territory=await p.evaluate(()=>window.__jura3dTerritory());report.territory=territory;
  report.gpu=(await p.evaluate(()=>window.__jura3dCamera())).quality.gpu;
  const places=process.env.JURA3D_PLACES?.split(',')??territory.places;assert.ok(places.every(id=>territory.places.includes(id)));
  const layer=territory.layers.includes('parking')?'parking':territory.layers.includes('transport')?'transport':null;
  report.contextLayer=layer;
  for(const place of places)for(const mode of ['terrain','buildings',...(layer?['context']:[])]){
    await p.locator('#quality').selectOption(profile);
    await p.evaluate(async({layer,mode})=>{
      if(layer)await window.__jura3dLayers.setEnabled(layer,mode==='context');
      const input=document.querySelector('#buildings');input.checked=mode!=='terrain';input.dispatchEvent(new Event('change',{bubbles:true}));
    },{layer,mode});
    await p.locator(`[data-place="${place}"]`).click();await p.waitForFunction(id=>window.__jura3dCamera().activePlace===id&&!window.__jura3dCamera().flyingTo,place);await ready(p);
    await p.waitForTimeout(2000);
    const before=await p.evaluate(()=>({camera:window.__jura3dCamera(),render:window.__jura3dPerformance(),
      layers:window.__jura3dLayers.snapshot().layers.map(({id,enabled,state,entityCount})=>({id,enabled,state,entityCount}))}));
    if(mode==='context'){const state=before.layers.find(l=>l.id===layer);assert.equal(state.state,'ready');assert.ok(state.entityCount>0);}
    assert.equal(before.render.resolutionScale,profile==='low'?.6:.75);assert.equal(before.camera.time,'2026-06-21T14:00:00Z');
    await p.evaluate(()=>{
      const values=[];let last=performance.now();let stopped=false;function frame(t){values.push(t-last);last=t;if(!stopped)requestAnimationFrame(frame);}requestAnimationFrame(frame);
      const timer=setInterval(()=>document.querySelector('[data-camera="right"]').click(),250);
      window.__territoryStop=()=>{stopped=true;clearInterval(timer);return values;};
    });
    const readings=[];for(let i=0;i<8;i++){await p.waitForTimeout(1000);readings.push(await p.evaluate(()=>({fps:parseInt(document.querySelector('.cesium-performanceDisplay-fps')?.textContent,10)||null,state:document.querySelector('#status').dataset.state})));}
    const gaps=await p.evaluate(()=>window.__territoryStop());await ready(p);
    const values=readings.map(r=>r.fps).filter(Number.isFinite).sort((a,b)=>a-b);assert.equal(values.length,8);
    const phase={place,mode,before,after:await p.evaluate(()=>({camera:window.__jura3dCamera(),render:window.__jura3dPerformance()})),readings,
      fpsMedian:(values[3]+values[4])/2,fpsMinimum:values[0],rafGapsAtLeast100ms:gaps.filter(n=>n>=100).length,rafMaximumMs:Math.max(...gaps)};
    report.phases.push(phase);await save();console.log(JSON.stringify({place,mode,fpsMedian:phase.fpsMedian,fpsMinimum:phase.fpsMinimum}));
  }
  assert.deepEqual(report.errors,[]);report.completed=true;report.endedAt=new Date().toISOString();
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{await save();await browser.close();console.log(JSON.stringify({report:filename,completed:report.completed,failure:report.failure}));}
