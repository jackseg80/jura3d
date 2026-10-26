import assert from 'node:assert/strict';
import { mercatorPoint, prepareRasterPaths, pathsForTile, nearbyRasterPaths } from '../src/transport-raster-geometry.js';
const lines = [
  { id: 'a', color: 'blue', night: false, parts: [[[-1, 0], [1, 0]], [[3, 0], [4, 0]]] },
  { id: 'b', color: 'red', night: true, parts: [[[0, -1], [0, 1]]] },
];
const original = JSON.stringify(lines), paths = prepareRasterPaths(lines);
assert.deepEqual(mercatorPoint([0, 0]), [.5, .5]);
assert.equal(paths.length, 3);
assert.equal(paths[2].night, true);
assert.equal(nearbyRasterPaths(paths, [0, 0], 10).length, 2, 'Both crossing route identities retained');
assert.deepEqual(nearbyRasterPaths(paths, [2, 0], 10), [], 'Separate parts must not create a connector');
assert.equal(nearbyRasterPaths(paths, [.5, 0], 10)[0].id, 'a');
assert.equal(nearbyRasterPaths(paths, [.5, .01], 10).length, 0, 'Do not select a distant route');
assert.equal(nearbyRasterPaths(paths, [3.5, 0], 10).length, 1);
const hit = nearbyRasterPaths(paths, [.5, .00001], 10)[0];
assert.ok(Math.abs(hit.position[0] - .5) < 1e-9 && Math.abs(hit.position[1]) < 1e-9);
// Both sides of an exact tile boundary retain the path, including its stroke padding.
for (const x of [0, 1]) for (const y of [0, 1]) assert.ok(pathsForTile(paths, x, y, 1).some(p => p.id === 'a'));
assert.equal(pathsForTile(paths, 0, 0, 10).length, 0);
assert.equal(pathsForTile(paths, 0, 0, 0).length, 3, 'Overview retains all paths');
const repeated = prepareRasterPaths([{ ...lines[0], parts: [lines[0].parts[0], lines[0].parts[0]] }]);
assert.equal(nearbyRasterPaths(repeated, [0, 0], 10).length, 1, 'One identity despite overlapping parts');
assert.equal(JSON.stringify(lines), original, 'Source geometry/style must remain immutable');
console.log('Tracés en tuiles : projection, limites, identité, proximité, parties disjointes et non-mutation vérifiées.');
