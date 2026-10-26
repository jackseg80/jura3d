import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const root = process.env.JURA3D_PROBE_OUTPUT ?? '.vite/b1-opt/tiles'; await mkdir(root, { recursive: true });
const url = new URL(process.env.JURA3D_URL ?? 'http://127.0.0.1:4312/jura3d/');
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
try {
  const page = await browser.newPage();
  await page.route(new URL('tile-test', url).href, r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Contrôle des tuiles</title>' }));
  await page.goto(new URL('tile-test', url).href);
  const result = await page.evaluate(async base => {
    const { createTransportImagery } = await import(`${base}src/transport-imagery.js`);
    const layers = [], viewer = { imageryLayers: { add(l) { layers.push(l); }, remove(l, destroy) { const i = layers.indexOf(l); if (i < 0) return false; layers.splice(i, 1); if (destroy) l.destroy(); return true; } } };
    const n = 2 ** 14, x = Math.floor((7.59 + 180) / 360 * n), y = Math.floor((1 - Math.log(Math.tan(Math.PI / 4 + 47.55 * Math.PI / 360)) / Math.PI) / 2 * n);
    const point = (tx, ty) => [tx / n * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * ty / n))) * 180 / Math.PI];
    const lines = [{ id: 'day', color: '#086d9c', night: false, parts: [[point(x + .3, y + .5), point(x + 1.7, y + .5)]] },
      { id: 'night', color: '#9a3150', night: true, parts: [[point(x + .3, y + .65), point(x + 1.7, y + .65)]] }];
    const original = JSON.stringify(lines), imagery = createTransportImagery(viewer, lines, 'Source de test'), provider = layers[0].imageryProvider;
    const left = await provider.requestImage(x, y, 14), right = await provider.requestImage(x + 1, y, 14);
    const alpha = (canvas, px, py) => canvas.getContext('2d').getImageData(px, py, 1, 1).data[3];
    const continuousBoundary = alpha(left, 511, 255) > 0 && alpha(right, 0, 255) > 0;
    const pixels = Array.from({ length: 100 }, (_, i) => alpha(left, 200 + i, 332));
    const nightHasDashes = pixels.some(a => a === 0) && pixels.some(a => a > 0);
    const cachedSameCanvas = await provider.requestImage(x, y, 14) === left;
    const scale = 2 ** 20, center = point(x + .5, y + .5), tx = Math.floor((center[0] + 180) / 360 * scale), ty = Math.floor((1 - Math.log(Math.tan(Math.PI / 4 + center[1] * Math.PI / 360)) / Math.PI) / 2 * scale);
    for (let i = 0; i < 30; i++) await provider.requestImage(tx + i, ty, 20);
    const beforeDestroy = imagery.snapshot(); imagery.destroy(); imagery.destroy();
    const after = await provider.requestImage(x, y, 14);
    return { continuousBoundary, nightHasDashes, cachedSameCanvas, sourceUnchanged: JSON.stringify(lines) === original, beforeDestroy,
      afterDestroy: imagery.snapshot(), layerCount: layers.length, lateTileEmpty: !alpha(after, 256, 255), lateHitEmpty: imagery.nearby(center, 100).length === 0 };
  }, url.pathname);
  for (const key of ['continuousBoundary', 'nightHasDashes', 'cachedSameCanvas', 'sourceUnchanged', 'lateTileEmpty', 'lateHitEmpty']) assert.equal(result[key], true, key);
  assert.equal(result.layerCount, 0); assert.ok(result.beforeDestroy.generatedTiles > 24); assert.equal(result.beforeDestroy.cachedTiles, 24); assert.equal(result.afterDestroy.cachedTiles, 0);
  await writeFile(`${root}/probe-tiles.json`, JSON.stringify({ checkedAt: new Date().toISOString(), completed: true, ...result }, null, 2)); console.log(JSON.stringify(result));
} finally { await browser.close(); }
