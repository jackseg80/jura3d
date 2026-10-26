import { BoundingSphere, Cartesian3, Cartographic, Color, CustomDataSource, DistanceDisplayCondition,
  HeadingPitchRange, HeightReference, Math as CesiumMath, PinBuilder, sampleTerrainMostDetailed, VerticalOrigin } from 'cesium';
import { parseParkingResponse, parkingFreshness, parkingDate } from './parking-data.js';

export function createParkingLayer(viewer, {config,onSelect,onClear,onState=()=>{}}) {
  const toggle=document.querySelector('#parking'); const status=document.querySelector('#parking-status');
  const retry=document.querySelector('#parking-retry'); const refresh=document.querySelector('#parking-refresh');
  const choices=document.querySelector('#parking-place'); const open=document.querySelector('#parking-open');
  const events=new AbortController();const listen=(target,type,callback)=>target.addEventListener(type,callback,{signal:events.signal});
  const pin=new PinBuilder();const images=new Map();
  let records=[];let source;let request;let generation=0;let destroyed=false;let selectedId;
  let focusGeneration=0;let focusing=false;let focusPending=false;let loading=false;let failed=false;let fetchedAt=null;let lastAttemptAt=null;let lastSelectionKey;
  const image=(color)=>{if(!images.has(color))images.set(color,pin.fromText('P',Color.fromCssColorString(color),44).toDataURL());return images.get(color);};
  const color=record=>record.id===selectedId?'#215776':!failed&&parkingFreshness(record,Date.now(),config.staleMs)==='recent'?'#155e75':'#92400e';
  function setState() {
    const stale=records.filter(r=>parkingFreshness(r,Date.now(),config.staleMs)!=='recent').length;
    status.dataset.state=!toggle.checked?'off':loading?'loading':failed?'error':'ready';
    status.dataset.freshness=!records.length?'unknown':stale?'stale':'recent';
    const text=!toggle.checked?'Parkings masqués.':loading?'Chargement des parkings…':failed
      ? `Parkings indisponibles. ${records.length?'Derniers relevés conservés, non actualisés.':''}`
      : `${records.length} parkings · ${stale?`${stale} observations anciennes ou non datées`:'observations récentes'}.`;
    const check=fetchedAt?` Dernière lecture du service : ${parkingDate(fetchedAt)}.`:'';
    const message=text+(toggle.checked?check:'');if(status.textContent!==message)status.textContent=message;
    retry.hidden=!toggle.checked||!failed;refresh.disabled=!toggle.checked||loading;
    choices.disabled=open.disabled=!toggle.checked||!records.length;
    onState();
    if(toggle.checked&&source) for(const record of records){const entity=source.entities.getById(record.id);if(entity)entity.billboard.image=image(color(record));}
    if(selectedId){const record=records.find(r=>r.id===selectedId);if(record){const key=JSON.stringify([record,failed,fetchedAt,parkingFreshness(record,Date.now(),config.staleMs)]);
      if(key!==lastSelectionKey){onSelect(record,{failed,fetchedAt},true);lastSelectionKey=key;}}}
  }
  function clearSelection(){focusGeneration++;focusPending=false;if(focusing)viewer.camera.cancelFlight();focusing=false;const old=selectedId;selectedId=undefined;lastSelectionKey=undefined;
    if(source&&old){const record=records.find(r=>r.id===old);if(record)source.entities.getById(old)?.billboard && (source.entities.getById(old).billboard.image=image(color(record)));}}
  function removeSource(){clearSelection();if(source)viewer.dataSources.remove(source,true);source=undefined;}
  function rebuild(){
    if(destroyed||!toggle.checked)return;
    onClear();removeSource();source=new CustomDataSource('Parkings Basel-Stadt');const attached=source;
    void viewer.dataSources.add(attached).then(()=>{if(destroyed||source!==attached||!toggle.checked)viewer.dataSources.remove(attached,true);});
    choices.replaceChildren();
    for(const r of [...records].sort((a,b)=>a.name.localeCompare(b.name,'fr'))){choices.add(new Option(r.name,r.id));source.entities.add({id:r.id,name:r.name,
      position:Cartesian3.fromDegrees(r.longitude,r.latitude),billboard:{image:image(color(r)),heightReference:HeightReference.CLAMP_TO_TERRAIN,
        verticalOrigin:VerticalOrigin.BOTTOM,disableDepthTestDistance:5000,distanceDisplayCondition:new DistanceDisplayCondition(0,30000)}});}
    viewer.scene.requestRender();
  }
  async function load(){
    if(destroyed||!toggle.checked||loading)return;
    const ticket=++generation;const controller=new AbortController();request=controller;loading=true;lastAttemptAt=Date.now();setState();
    const timeout=setTimeout(()=>controller.abort(),20000);
    try{
      const response=await fetch(config.url,{signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const values=parseParkingResponse(await response.json(),config.bounds);
      if(destroyed||ticket!==generation||!toggle.checked)return;
      const sameEntities=source&&records.length===values.length&&values.every(r=>source.entities.getById(r.id));
      records=values;fetchedAt=Date.now();failed=false;
      if(sameEntities){
        for(const r of records){const entity=source.entities.getById(r.id);const position=entity.position.getValue(viewer.clock.currentTime);
          const next=Cartesian3.fromDegrees(r.longitude,r.latitude);if(!Cartesian3.equals(position,next))entity.position=next;
          const option=[...choices.options].find(o=>o.value===r.id);if(option&&option.textContent!==r.name)option.textContent=r.name;}
        viewer.scene.requestRender();
      }else rebuild();
    }catch(error){if(destroyed||ticket!==generation||!toggle.checked)return;failed=true;console.warn('Parkings',error);}
    finally{clearTimeout(timeout);if(ticket===generation){loading=false;request=undefined;setState();}}
  }
  function setEnabled(enabled){
    if(destroyed)return;generation++;request?.abort();request=undefined;loading=false;toggle.checked=enabled;onClear();
    if(enabled){if(records.length)rebuild();return load();}removeSource();choices.replaceChildren();setState();
  }
  function select(id){const r=records.find(r=>r.id===id);if(!r||!source||!toggle.checked||!source.entities.getById(id))return;
    onSelect(r,{failed,fetchedAt});selectedId=id;lastSelectionKey=JSON.stringify([r,failed,fetchedAt,parkingFreshness(r,Date.now(),config.staleMs)]);
    choices.value=id;source.entities.getById(id).billboard.image=image(color(r));viewer.scene.requestRender();}
  async function focus(r){const ticket=++focusGeneration;focusPending=true;let p=Cartographic.fromDegrees(r.longitude,r.latitude);let height=viewer.scene.globe.getHeight(p)??0;
    try{[p]=await sampleTerrainMostDetailed(viewer.terrainProvider,[p]);if(Number.isFinite(p.height))height=p.height;}catch{/* La fiche reste accessible. */}
    if(destroyed||ticket!==focusGeneration||!toggle.checked||selectedId!==r.id){if(ticket===focusGeneration)focusPending=false;return;}focusPending=false;focusing=true;
    viewer.camera.flyToBoundingSphere(new BoundingSphere(Cartesian3.fromDegrees(r.longitude,r.latitude,height),60),{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1.2,
      offset:new HeadingPitchRange(CesiumMath.toRadians(10),CesiumMath.toRadians(-40),900),complete:()=>{focusing=false;},cancel:()=>{focusing=false;}});
  }
  listen(toggle,'change',()=>setEnabled(toggle.checked));listen(retry,'click',()=>void load());listen(refresh,'click',()=>void load());
  listen(open,'click',()=>{const r=records.find(r=>r.id===choices.value);if(r){select(r.id);void focus(r);}});
  listen(document,'visibilitychange',()=>{if(!document.hidden&&toggle.checked&&Date.now()-(lastAttemptAt??0)>=config.refreshMs)void load();});
  const interval=setInterval(()=>{if(destroyed||!toggle.checked)return;setState();if(!document.hidden&&Date.now()-(lastAttemptAt??0)>=config.refreshMs)void load();},1000);
  setState();
  return {setEnabled,refresh:load,clearSelection,navigate:clearSelection,select,
    pick(picked){if(source&&toggle.checked&&picked?.id&&source.entities.contains(picked.id)){select(picked.id.id);return true;}return false;},
    destroy(){if(destroyed)return;onClear();destroyed=true;generation++;request?.abort();events.abort();clearInterval(interval);toggle.checked=false;removeSource();records=[];images.clear();choices.replaceChildren();loading=false;failed=false;setState();},
    snapshot:()=>({enabled:toggle.checked,state:status.dataset.state,loading,failed,fetchedAt,lastAttemptAt,selectedId,focusing:focusing||focusPending,sourceCount:viewer.dataSources.length,
      entityCount:source?.entities.values.length??0,records:records.map(r=>({...r,freshness:parkingFreshness(r,Date.now(),config.staleMs)}))}),
    target(id){const r=records.find(r=>r.id===id);if(!r||!source)return null;const height=viewer.scene.globe.getHeight(Cartographic.fromDegrees(r.longitude,r.latitude))??0;
      const p=viewer.scene.cartesianToCanvasCoordinates(Cartesian3.fromDegrees(r.longitude,r.latitude,height));if(!p)return null;
      for(const dy of [-20,-30,-10])for(const dx of [0,-8,8]){const position={x:p.x+dx,y:p.y+dy};if(document.elementFromPoint(position.x,position.y)===viewer.scene.canvas&&viewer.scene.pick(position)?.id?.id===id)return position;}return null;},
  };
}
