import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { clipTransportLine, simplifyTransportLine, prepareTransportLines, projectTransportPoint } from '../src/transport-geometry.js';

const center = { longitude: 7.34, latitude: 47.36 };
const geographic = ([x, y]) => [center.longitude + x / (111320 * Math.cos(center.latitude * Math.PI / 180)), center.latitude + y / 111320];
const line = points => points.map(geographic);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} ≠ ${expected}`);
const crossing = clipTransportLine(line([[-20, 0], [20, 0]]), center, 10);
assert.equal(crossing.length, 1); near(projectTransportPoint(crossing[0][0], center)[0], -10); near(projectTransportPoint(crossing[0][1], center)[0], 10);
assert.equal(clipTransportLine(line([[-20, 20], [20, 20]]), center, 10).length, 0);
assert.equal(clipTransportLine(line([[-20, 10], [20, 10]]), center, 10).length, 0);
const reentry = clipTransportLine(line([[0, 0], [20, 0], [20, 20], [0, 0]]), center, 10);
assert.equal(reentry.length, 2, 'Do not invent a connector across an outside excursion');
assert.equal(clipTransportLine(line([[0, 0], [0, 0], [5, 0]]), center, 10)[0].length, 2);
assert.equal(simplifyTransportLine(line([[0, 0], [5, .5], [10, 0]]), center).length, 2);
assert.equal(simplifyTransportLine(line([[0, 0], [5, 2], [10, 0]]), center).length, 3);
assert.ok(simplifyTransportLine(line([[0, 0], [10, 0], [10, 10], [0, 0]]), center).length >= 4, 'Closed non-degenerate loops retained');

const features = JSON.parse(await readFile('data/jura/bus-lines.geojson', 'utf8')).features;
const original = JSON.stringify(features);
const distance = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
let before = 0, after = 0;
for (const feature of features) {
  const reference = { longitude: feature.geometry.coordinates[0][0][0], latitude: feature.geometry.coordinates[0][0][1] };
  const rendered = prepareTransportLines(feature);
  assert.equal(rendered.length, feature.geometry.coordinates.length);
  for (let i = 0; i < rendered.length; i++) {
    const source = feature.geometry.coordinates[i], simplified = rendered[i];
    assert.deepEqual(simplified[0], source[0]); assert.deepEqual(simplified.at(-1), source.at(-1));
    const projected = simplified.map(p => projectTransportPoint(p, reference));
    for (const point of source) { const p = projectTransportPoint(point, reference); const d = Math.min(...projected.slice(1).map((b, j) => distance(p, projected[j], b))); assert.ok(d <= 1.00001, `Deviation ${d} m for ${feature.id}`); }
    before += source.length; after += simplified.length;
  }
  for (const place of [{longitude:7.3448,latitude:47.3653},{longitude:7.0755,latitude:47.4156},{longitude:6.9977,latitude:47.2560},{longitude:7.1547,latitude:47.3652}]) {
    const clipped = feature.geometry.coordinates.flatMap(part => clipTransportLine(part, place));
    const rendered = prepareTransportLines(feature, place);
    assert.equal(rendered.length, clipped.length, 'No artificial joining of separate clipped pieces');
    for (let i = 0; i < rendered.length; i++) {
      const projected = rendered[i].map(p => projectTransportPoint(p, place));
      for (const point of clipped[i]) { const p = projectTransportPoint(point, place); assert.ok(Math.min(...projected.slice(1).map((b, j) => distance(p, projected[j], b))) <= 1.00001); }
      for (const point of rendered[i]) assert.ok(Math.hypot(...projectTransportPoint(point, place)) <= 5250.0001);
    }
  }
}
assert.equal(JSON.stringify(features), original, 'Official geometry must not be mutated');
console.log(JSON.stringify({ syntheticChecks: 8, officialFeatures: features.length, sourceVertices: before, simplifiedVertices: after, maximumProjectedDeviationMeters: 1, immutableSource: true }));
