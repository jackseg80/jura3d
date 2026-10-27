import assert from 'node:assert/strict';
import { BASEL_PLACE_DATASETS, baselPlaceUrl, loadBaselPlaces, parseBaselPlaces, placeDistanceMeters } from '../src/basel-places-data.js';
const bounds = [5.5,45.5,11,49], dataset = BASEL_PLACE_DATASETS[0];
const feature = (id = '0') => ({type:'Feature',id,geometry:{type:'Point',coordinates:[7.59,47.55]},properties:{Name:' Musée source ',Beschreibung:null,Link:'https://museum.example/path',Subkategorie:'Museen, Ausstellungen, Sammlungen',Ort:'4051 Basel',Wortmarke:0}});
const native = [feature()], original = structuredClone(native), records = parseBaselPlaces(native,dataset,bounds);
assert.deepEqual(native,original);assert.equal(records[0].feature,native[0]);assert.equal(records[0].display.name,'Musée source');
assert.equal(records[0].display.category,'Musées, expositions et collections');assert.equal(records[0].display.description,'');assert.equal(records[0].feature.properties.Wortmarke,0);
assert.notEqual(records[0].id,parseBaselPlaces([feature()],BASEL_PLACE_DATASETS[1],bounds)[0].id);
for (const mutate of [f=>{f.geometry.coordinates=[47.55,7.59];},f=>{f.geometry.coordinates=[7.59,47.55,0];},f=>{f.geometry=null;},f=>{f.properties.Name=' ';},f=>{delete f.id;}]) {
 const f=feature();mutate(f);assert.throws(()=>parseBaselPlaces([f],dataset,bounds),/Lieu GeoBS/);
}
assert.throws(()=>parseBaselPlaces([feature(),feature()],dataset,bounds),/dupliqué/);
for(const url of ['javascript:alert(1)','data:text/html,x','https://user:secret@example.org/','https://example.org:8443/','/relative',null])assert.equal(baselPlaceUrl(url),null);
assert.equal(baselPlaceUrl('http://museum.example/'),'http://museum.example/');
const unknown=feature();unknown.properties.Subkategorie='constructor';assert.equal(parseBaselPlaces([unknown],dataset,bounds)[0].display.category,'constructor');
assert.equal(placeDistanceMeters([7.59,47.55],{longitude:7.59,latitude:47.55}),0);
assert.ok(placeDistanceMeters([7.66,47.55],{longitude:7.59,latitude:47.55})>5000);
let mode='normal', calls=[];
const controller=new AbortController();
const fetcher=async(url,options)=>{
 assert.equal(options.signal,controller.signal);calls.push(url);
 if(url.includes('/stac/'))return {ok:true,json:async()=>({id:url.split('/').at(-1),license:mode==='license'?'restricted':'CC-BY-4.0'})};
 const u=new URL(url),offset=Number(u.searchParams.get('offset')),culture=url.includes(dataset.collection);
 const count=culture&&['paged','duplicate','drift'].includes(mode)?1001:1;
 let features=Array.from({length:Math.min(1000,count-offset)},(_,i)=>feature(String(i+offset)));
 if(mode==='duplicate'&&offset)features=[feature('0')];if(mode==='partial')features=[];
 return {ok:mode!=='http',status:503,json:async()=>({type:'FeatureCollection',features,numberMatched:mode==='drift'&&offset?1002:count,numberReturned:features.length})};
};
let r=await loadBaselPlaces({bounds},controller.signal,fetcher);assert.equal(r.records.length,3);assert.equal(calls.length,5);assert.deepEqual(r.counts,{culture:1,sights:1,landmarks:1});
mode='paged';calls=[];r=await loadBaselPlaces({bounds},controller.signal,fetcher);assert.equal(r.records.length,1003);assert.ok(calls.some(u=>u.includes('offset=1000')));
for(mode of ['duplicate','drift','partial','license','http'])await assert.rejects(()=>loadBaselPlaces({bounds},controller.signal,fetcher));
console.log('B2 : propriétés natives, identités séparées, coordonnées, liens, distance, licences et pagination complète/rejets vérifiés.');
