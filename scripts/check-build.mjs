import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const directory = process.argv[2] ?? 'dist';
const base = process.argv[3] ?? '/';
const territory = process.argv[4] ?? 'jura';
const read = name => readFile(path.join(directory, name));
const html = (await read('index.html')).toString();
const info = JSON.parse(await read('build-info.json'));
assert.equal(info.base, base); assert.equal(info.territory, territory);
const assets = [...html.matchAll(/(?:src|href)="([^" ]*assets\/[^" ]+)"/g)].map(m => m[1]);
assert.ok(assets.length >= 2);
for (const asset of assets) { assert.ok(asset.startsWith(`${base}assets/`), asset); await stat(path.join(directory, asset.slice(base.length))); }
assert.ok(html.includes(`${base}jura/Conditions_utilisation_geodonnees.pdf`));
if (territory === 'jura') {
for (const [name, count] of [['heritage.geojson',1159], ['bus-stops.geojson',464], ['bus-lines.geojson',140], ['noctambus-zones.geojson',2]]) {
  assert.equal(JSON.parse(await read(`jura/${name}`)).features.length, count);
}
for (const name of ['heritage-link-checks.json','transport-link-checks.json']) assert.ok(Array.isArray(JSON.parse(await read(`jura/${name}`)).checks));
assert.equal((await read('jura/Conditions_utilisation_geodonnees.pdf')).subarray(0,4).toString(), '%PDF');
} else {
  assert.equal((await readdir(directory)).includes('jura'),false,'données cantonales Jura livrées à une autre ville');
}
assert.ok((await readdir(path.join(directory,'cesiumStatic/Workers'))).some(f=>f.endsWith('.js')));
assert.match((await read('cesiumStatic/LICENSE.md')).toString(), /Apache License/);
assert.ok(Array.isArray(JSON.parse(await read('cesiumStatic/ThirdParty.json'))));
const js = assets.find(a=>a.endsWith('.js'));
assert.ok((await read(js.slice(base.length))).toString().includes(`${base}cesiumStatic`));
console.log(JSON.stringify({base,territory,revision:info.revision,assets,juraDataChecked:territory==='jura',cesiumWorkers:true,licenses:true}));
