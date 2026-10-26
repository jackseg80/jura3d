// Adaptation du schéma Basel-Stadt, sans modifier les propriétés source.
export const BASEL_TIMETABLE = 'https://www.bvb.ch/de/fahrplan/haltestellen-fahrplan/';
export const BASEL_NETWORK = 'https://www.bvb.ch/de/fahrplan/liniennetz/';
export const BASEL_OLD_LINKS = [
  'https://www.bvb.ch/fahrplan-netz/haltestellenfahrplan',
  'https://www.tnw.ch/assets/files/haltestellenfahrplaene/Bahnhof_StJohann_64_B.pdf',
];
export function officialBaselTransitUrl(value) {
  try {
    const u=new URL(value);
    if(u.protocol==='http:'&&u.hostname==='www.bvb.ch'&&u.pathname==='/fahrplan-netz/haltestellenfahrplan')u.protocol='https:';
    if(u.protocol!=='https:'||u.port||u.username||u.password||u.search||u.hash)return null;
    return (u.hostname==='www.bvb.ch'&&['/de/fahrplan/haltestellen-fahrplan/','/de/fahrplan/liniennetz/','/fahrplan-netz/haltestellenfahrplan'].includes(u.pathname))
      ||(u.hostname==='www.tnw.ch'&&/^\/assets\/files\/haltestellenfahrplaene\/[A-Za-z0-9_-]+\.pdf$/.test(u.pathname))?u.href:null;
  }catch{return null;}
}
const text=(v)=>typeof v==='string'?v.trim():'';
const list=(v)=>v===null||v===undefined?[]:Array.isArray(v)&&v.every(s=>typeof s==='string')?v.map(s=>s.trim()).filter(Boolean):(()=>{throw new Error('Liste transports invalide');})();
export function parseBaselTransit(lines,stops,{bounds,dates={}}) {
  const [w,s,e,n]=bounds;
  const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=w&&p[0]<=e&&p[1]>=s&&p[1]<=n;
  const id=(value)=>{if(!text(value)||!/^\d+$/.test(value))throw new Error('Identifiant transports invalide');return value;};
  const records=[],ids=new Set(),excluded={};
  for(const r of lines){
    const key=`bs-line:${id(r.l_nr)}`;if(ids.has(key))throw new Error('Identifiant dupliqué');ids.add(key);
    const modes={'Tram':'tram','Nacht-Tram':'tram','Bus':'bus','Nacht-Bus':'bus'};
    if(!modes[r.fahrzeug]){if(!['Fähre','Schiff','S-Bahn','Nacht-S-Bahn'].includes(r.fahrzeug))throw new Error('Mode transports inconnu');excluded[r.fahrzeug]=(excluded[r.fahrzeug]??0)+1;continue;}
    const g=r.geo_shape?.geometry,parts=g?.type==='LineString'?[g.coordinates]:g?.type==='MultiLineString'?g.coordinates:null;
    if(!parts?.length||parts.some(l=>!Array.isArray(l)||l.length<2||!l.every(point))||!text(r.liniennmr)||!text(r.strecke))throw new Error('Tracé transports invalide');
    const mode=modes[r.fahrzeug];const nightOnly=r.fahrzeug.startsWith('Nacht-');
    records.push({kind:'line',feature:{id:key,properties:r,geometry:{type:'MultiLineString',coordinates:parts}},display:{
      name:`${mode==='tram'?'Tram':'Bus'} ${r.liniennmr} · ${r.strecke}${text(r.hinrueck)?` · ${r.hinrueck}`:''}`,
      modes:[mode],nightOnly,sourceDate:dates.lines??null,offer:list(r.angebot),
    }});
  }
  for(const r of stops){
    const key=`bs-stop:${id(r.thst_nr)}`;if(ids.has(key))throw new Error('Identifiant dupliqué');ids.add(key);
    const modes={'Tramhaltestelle':['tram'],'Bushaltestelle':['bus'],'Tram- und Bushaltestelle':['tram','bus']}[r.typ];
    const g=r.geo_shape?.geometry;
    if(!modes||g?.type!=='Point'||!point(g.coordinates)||!text(r.haltestl)||!text(r.hst_nr))throw new Error('Quai transports invalide');
    records.push({kind:'stop',feature:{id:key,properties:r,geometry:{type:'MultiPoint',coordinates:[g.coordinates]}},display:{
      name:`${r.haltestl}${text(r.richtung)?` · ${r.richtung}`:''} · réf. source ${r.thst_nr}`,modes,nightOnly:false,
      tramLines:list(r.tramlinien),busLines:list(r.buslinien),nightLines:list(r.nachtlin),sourceDate:dates.stops??null,
      sourceUrl:officialBaselTransitUrl(r.fahrplan),
    }});
  }
  return {records,excluded,rawCounts:{lines:lines.length,stops:stops.length}};
}

export async function fetchBaselDataset(dataset,signal,fetcher=fetch) {
  const prefix=`https://data.bs.ch/api/explore/v2.1/catalog/datasets/${dataset.id}`;
  const json=async url=>{const r=await fetcher(url,{signal});if(!r.ok)throw new Error(`Transports : HTTP ${r.status}`);return r.json();};
  const [meta,first]=await Promise.all([json(prefix),json(`${prefix}/records?limit=100&offset=0&order_by=${dataset.order}`)]);
  if(meta.metas?.default?.license!=='CC BY 4.0 + OpenStreetMap')throw new Error('Conditions transports modifiées : contrôle requis');
  const count=first.total_count;
  if(!Number.isInteger(count)||count<1||count>2500)throw new Error('Effectif transports invalide');
  const pages=[first,...await Promise.all(Array.from({length:Math.ceil(count/100)-1},(_,i)=>json(`${prefix}/records?limit=100&offset=${(i+1)*100}&order_by=${dataset.order}`)))];
  if(pages.some((p,i)=>p.total_count!==count||!Array.isArray(p.results)||p.results.length!==Math.min(100,count-i*100)))throw new Error('Réponse transports incomplète');
  return {records:pages.flatMap(p=>p.results),date:meta.metas.default.modified??null};
}
export async function loadBaselTransit(config,signal,fetcher=fetch) {
  const [lines,stops]=await Promise.all(config.datasets.map(d=>fetchBaselDataset(d,signal,fetcher)));
  return {...parseBaselTransit(lines.records,stops.records,{bounds:config.bounds,dates:{lines:lines.date,stops:stops.date}}),fetchedAt:Date.now()};
}
