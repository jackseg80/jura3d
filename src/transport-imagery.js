import { Credit, Event, ImageryLayer, Rectangle, WebMercatorTilingScheme } from 'cesium';
import { prepareRasterPaths, pathsForTile, nearbyRasterPaths } from './transport-raster-geometry.js';

// Tuiles transparentes calculées localement, échantillonnées par le terrain Cesium.
// Aucun serveur, image externe, copie de données ou changement de relief.
export function createTransportImagery(viewer, lines, credit, onError) {
  let paths = prepareRasterPaths(lines), destroyed = false, generated = 0;
  const cache = new Map(), size = 512;
  const rectangle = Rectangle.fromDegrees(...lines.flatMap(l => l.parts.flat()).reduce((b, [x, y]) =>
    [Math.min(b[0], x - .0001), Math.min(b[1], y - .0001), Math.max(b[2], x + .0001), Math.max(b[3], y + .0001)], [180, 90, -180, -90]));
  const blank = document.createElement('canvas'); blank.width = blank.height = size;
  const provider = {
    rectangle, tileWidth: size, tileHeight: size, minimumLevel: 0, maximumLevel: 20,
    tilingScheme: new WebMercatorTilingScheme(), errorEvent: new Event(), credit: new Credit(credit),
    hasAlphaChannel: true, tileDiscardPolicy: undefined, proxy: undefined,
    getTileCredits: () => undefined, pickFeatures: () => undefined,
    async requestImage(x, y, level) {
      if (destroyed) return Promise.resolve(blank);
      const key = `${level}/${x}/${y}`;
      if (cache.has(key)) { const image = cache.get(key); cache.delete(key); cache.set(key, image); return Promise.resolve(image); }
      const rows = pathsForTile(paths, x, y, level, size);
      if (!rows.length) return Promise.resolve(blank);
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d'), scale = 2 ** level * size;
      ctx.lineJoin = ctx.lineCap = 'round';
      for (const row of rows) {
        ctx.beginPath(); row.points.forEach(([px, py], i) => ctx[i ? 'lineTo' : 'moveTo'](px * scale - x * size, py * scale - y * size));
        ctx.setLineDash(row.night ? [7, 5] : []);
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = row.color; ctx.stroke();
      }
      generated++; cache.set(key, canvas);
      if (cache.size > 24) cache.delete(cache.keys().next().value);
      return Promise.resolve(canvas);
    },
  };
  if (onError) provider.errorEvent.addEventListener(onError);
  const layer = new ImageryLayer(provider);
  viewer.imageryLayers.add(layer);
  return {
    snapshot: () => ({ generatedTiles: generated, cachedTiles: cache.size, paths: paths.length, destroyed }),
    nearby: (position, meters) => destroyed ? [] : nearbyRasterPaths(paths, position, meters),
    destroy() { if (destroyed) return; destroyed = true; paths = []; cache.clear(); viewer.imageryLayers.remove(layer, true); },
  };
}
