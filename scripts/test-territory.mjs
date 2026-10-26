import assert from 'node:assert/strict';
import jura from '../src/territories/jura.js';
import control from '../src/territories/navigation-control.js';
import basel from '../src/territories/basel.js';
import { validateTerritory } from '../src/territory.js';
import { createLayerCollection } from '../src/layers.js';

assert.equal(validateTerritory(jura), jura);
assert.equal(validateTerritory(control), control);
assert.equal(validateTerritory(basel), basel);
for(const mutate of [t=>{t.layers.find(l=>l.kind==='basel-transit').datasets[0].id='other';},t=>{t.layers.find(l=>l.kind==='basel-transit').licenses[0].url='http://example.org/';}]){
  const t=structuredClone(basel);mutate(t);assert.throws(()=>validateTerritory(t),/transports Bâle/);
}
const invalid = (mutate) => { const value = structuredClone(jura); mutate(value); assert.throws(() => validateTerritory(value), /Configuration territoriale/); };
invalid(t => { t.initialPlace = 'absent'; });
invalid(t => { t.places.delemont.latitude = NaN; });
invalid(t => { t.layers.push(t.layers[0]); });
invalid(t => { t.layers[0].base = '../private/'; });
invalid(t => { t.layers[1].checksSource = 'https://example.org/checks'; });
invalid(t => { t.layers[1].specs[0][2] = -1; });
invalid(t => { t.layers[0].kind = 'unknown'; });
invalid(t => { t.sources.terrain.url = 'http://example.org/'; });

// Le registre conserve la priorité de sélection et détruit aussi les couches inactives.
const calls = [];
const registry = createLayerCollection();
const layer = (id, hit) => Object.fromEntries(['setEnabled', 'refresh', 'navigate', 'pick', 'clearSelection', 'destroy', 'snapshot'].map(method => [method,
  (...args) => { calls.push([id, method, ...args]); return method === 'pick' ? hit : method === 'snapshot' ? { enabled: false } : undefined; }]));
registry.register('first', layer('first', true)); registry.register('second', layer('second', true));
assert.throws(() => registry.register('first', layer('duplicate', false)));
assert.throws(() => registry.register('invalid', {}), /incomplet/);
registry.setEnabled('second', true); registry.refresh('second'); registry.navigate();
const before = calls.length; assert.equal(registry.pick('picked', 'position'), true);
assert.deepEqual(calls.slice(before), [['first', 'pick', 'picked', 'position']]);
registry.clearSelection(); registry.destroy(); registry.destroy();
assert.equal(calls.filter(c => c[1] === 'destroy').length, 2);
assert.deepEqual(registry.snapshot(), { destroyed: true, layers: [] });
assert.equal(registry.pick(null), false);
assert.throws(() => registry.register('third', layer('third', true)));
console.log('P7 : configurations, rejets et contrat du registre vérifiés.');
