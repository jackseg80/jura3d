import { BoundingSphere, Cartesian3, Cartographic, ClassificationType, Color, CustomDataSource,
  DistanceDisplayCondition, HeadingPitchRange, HeightReference, Math as CesiumMath,
  PinBuilder, PolygonHierarchy, PolylineDashMaterialProperty, PolylineOutlineMaterialProperty,
  sampleTerrainMostDetailed, VerticalOrigin } from 'cesium';
import { prepareTransportLines, TRANSPORT_LINE_TOLERANCE_METERS, TRANSPORT_RENDER_RADIUS_METERS } from './transport-geometry.js';
import { loadBaselTransit } from './basel-transit-data.js';
import { createTransportImagery } from './transport-imagery.js';

const BLUE = Color.fromCssColorString('#086d9c');
const PURPLE = Color.fromCssColorString('#763b9c');
const GREY = Color.fromCssColorString('#51616b');
const SELECTED = Color.fromCssColorString('#efb700');

export function officialTransportUrl(value, field) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const allowed = field === 'urlcadrehoraire'
      ? url.hostname === 'widgets.oev-info.ch' && /^\/publikation\/jahresfpl\/\d+\.\d+\.pdf$/.test(url.pathname)
      : field === 'horaire'
        ? url.hostname === 'www.noctambus-jura.ch' && /^\/horaires\/lignes\/(est|ouest)\/$/.test(url.pathname)
        : field === 'urlhorairepassage'
          ? url.hostname === 'haltestelle.postauto.ch' && url.pathname === '/qr/qr.php' && /^\d+$/.test(url.searchParams.get('hid') ?? '')
          : ['urlhoraireorigine', 'urlhorairedestination'].includes(field) && url.hostname === 'www.sbb.ch'
            && url.pathname === '/fr/acheter/pages/fahrplan/fahrplan.xhtml';
    return allowed ? url.href : null;
  } catch { return null; }
}

// Approximation locale en mètres, centrée sur le cadrage, sans limite de commune.
function xy(point, center) {
  return [(point[0] - center.longitude) * 111320 * Math.cos(CesiumMath.toRadians(center.latitude)),
    (point[1] - center.latitude) * 111320];
}
function segmentNear(a, b, center) {
  const [ax, ay] = xy(a, center); const [bx, by] = xy(b, center);
  const dx = bx - ax; const dy = by - ay;
  const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(ax + t * dx, ay + t * dy) <= 5000;
}
function geometryNear(kind, feature, center) {
  if (!center || kind === 'zone') return true; // Zones séparées, indépendantes du secteur.
  if (kind === 'stop') return Math.hypot(...xy(feature.geometry.coordinates[0], center)) <= 5000;
  return feature.geometry.coordinates.some((line) => line.some((p, i) => i && segmentNear(line[i - 1], p, center)));
}
const nameOf = ({ kind, feature, display }) => (display?.name ?? feature.properties[kind === 'stop' ? 'nomarret' : kind === 'line' ? 'nomcadrehoraire' : 'nom_zone']?.trim())
  || (kind === 'stop' ? 'Arrêt sans nom fourni' : kind === 'line' ? 'Tracé sans nom fourni' : 'Zone sans nom fournie');
const dayNight = ({ kind, feature }) => {
  const p = feature.properties;
  return { day: p[kind === 'stop' ? 'arret_jour' : 'ligne_jour'] === 'Oui', night: p[kind === 'stop' ? 'arret_nocturne' : 'ligne_nocturne'] === 'Oui' };
};
function baseColor(item) { if(item.display)return Color.fromCssColorString(item.display.modes.includes('tram')?'#9a3150':'#086d9c');const flags = dayNight(item); return flags.day ? BLUE : flags.night ? PURPLE : GREY; }
const pinText=item=>item.display?(item.display.modes.length===2?'T/B':item.display.modes[0]==='tram'?'T':'B'):'B';
const nightOnly = item => item.display ? item.display.nightOnly : !dayNight(item).day && dayNight(item).night;
function lineMaterial(item, selected = false) {
  if (!selected && nightOnly(item)) return new PolylineDashMaterialProperty({ color: baseColor(item), dashLength: 14 });
  return new PolylineOutlineMaterialProperty({ color: selected ? SELECTED : baseColor(item), outlineColor: selected ? GREY : Color.WHITE, outlineWidth: 1 });
}

export function createTransportLayer(viewer, { config, getPlace, onSelect, onGroup, onClear, onState = () => {} }) {
  const basel=config.kind==='basel-transit';let sourceInfo;let imagery;
  const raster = config.lineRenderer === 'terrain-imagery';
  const base = `${import.meta.env.BASE_URL}${config.base??''}`;
  const [west, south, east, north] = config.bounds;
  const events = new AbortController();
  const listen = (target, type, callback) => target.addEventListener(type, callback, { signal: events.signal });
  let destroyed = false;
  const toggle = document.querySelector('#transport');
  const sector = document.querySelector('#transport-sector');
  const offer = document.querySelector('#transport-offer');
  const modeFilter = document.querySelector('#transport-mode');
  const stopsToggle = document.querySelector('#transport-stops');
  const linesToggle = document.querySelector('#transport-lines');
  const zonesToggle = document.querySelector('#transport-zones');
  const kindSelect = document.querySelector('#transport-kind');
  const choices = document.querySelector('#transport-place');
  const open = document.querySelector('#transport-open');
  const status = document.querySelector('#transport-status');
  const retry = document.querySelector('#transport-retry');
  const pin = new PinBuilder();
  const pins = new Map();
  const byId = new Map();
  const byEntity = new Map();
  const lineGeometryCache = new WeakMap();
  let geometryStats = { sourceLineVertices: 0, renderedLineVertices: 0, renderedLineParts: 0 };
  let records; let checks = new Map(); let source; let filtered = [];
  let generation = 0; let request; let selectedId; let focusGeneration = 0; let focusFlight = false; let focusPending = false; let removeCluster;
  function lineGeometry(item) {
    const place = sector.value === 'active' ? getPlace() : null;
    const key = place ? `${place.longitude}:${place.latitude}` : 'all';
    let cache = lineGeometryCache.get(item.feature);
    if (!cache) { cache = new Map(); lineGeometryCache.set(item.feature, cache); }
    if (!cache.has(key)) cache.set(key, prepareTransportLines(item.feature, place));
    return cache.get(key);
  }
  function pinImage(text, color) {
    const key = `${text}:${color.toCssColorString()}`;
    if (!pins.has(key)) pins.set(key, pin.fromText(text, color, 44).toDataURL());
    return pins.get(key);
  }
  function setState(state, message) {
    status.dataset.state = state; status.textContent = message; retry.hidden = state !== 'error';
    const ready = state === 'ready' && toggle.checked;
    for (const control of [sector, offer, modeFilter, stopsToggle, linesToggle, zonesToggle, kindSelect]) control.disabled = !ready;
    choices.disabled = open.disabled = !ready || !choices.options.length;
    onState();
  }
  function styleSelection(id, selected) {
    const selectedItem = byId.get(id);
    if (imagery && selected && selectedItem?.kind === 'line') {
      lineGeometry(selectedItem).forEach((line, i) => {
        const overlayId = `${id}#${i}#highlight`;
        source.entities.add({ id: overlayId, name: nameOf(selectedItem), polyline: {
          positions: line.map(p => Cartesian3.fromDegrees(p[0], p[1])), width: 7,
          material: lineMaterial(selectedItem, true), clampToGround: true,
          classificationType: ClassificationType.TERRAIN, zIndex: 4 } });
        byEntity.set(overlayId, selectedItem);
      });
      return;
    }
    for (const [entityId, item] of [...byEntity]) {
      if (item.feature.id !== id) continue;
      const entity = source?.entities.getById(entityId); if (!entity) continue;
      if (entity.billboard) entity.billboard.image = pinImage(pinText(item), selected ? SELECTED : baseColor(item));
      if (entity.polyline) {
        if (entityId.endsWith('#highlight')) {
          if (!selected) { source.entities.remove(entity); byEntity.delete(entityId); }
        } else if (selected) {
          // Keep the base ground-polyline batch stable. Replacing its material
          // or width rebuilds it asynchronously and can leave stale pick IDs.
          const overlayId = `${entityId}#highlight`;
          source.entities.add({ id: overlayId, name: entity.name, polyline: {
            positions: entity.polyline.positions, width: 7, material: lineMaterial(item, true),
            clampToGround: true, classificationType: ClassificationType.TERRAIN, zIndex: 4 } });
          byEntity.set(overlayId, item);
        }
      }
      if (entity.polygon) entity.polygon.material = selected ? SELECTED.withAlpha(.28) : PURPLE.withAlpha(.14);
    }
  }
  function clearSelection() {
    focusGeneration++;
    focusPending = false;
    if (focusFlight) viewer.camera.cancelFlight(); focusFlight = false;
    if (selectedId) styleSelection(selectedId, false);
    selectedId = undefined;
  }
  function removeSource() {
    clearSelection(); removeCluster?.(); removeCluster = undefined;
    imagery?.destroy(); imagery = undefined;
    if (source) viewer.dataSources.remove(source, true); source = undefined; byEntity.clear();
    geometryStats = { sourceLineVertices: 0, renderedLineVertices: 0, renderedLineParts: 0 };
  }
  function select(id) {
    const item = byId.get(id);
    if (!source || !toggle.checked || !filtered.includes(item)) return;
    onSelect(item, checks); selectedId = id;
    kindSelect.value = item.kind; updateChoices(); choices.value = id;
    styleSelection(id, true); viewer.scene.requestRender();
  }
  async function focus(item) {
    const ticket = ++focusGeneration;
    focusPending = true;
    const coords = item.kind === 'stop' ? item.feature.geometry.coordinates
      : item.kind === 'line' ? lineGeometry(item).flat() : item.feature.geometry.coordinates.flat(2);
    const sphere = BoundingSphere.fromPoints(coords.map((p) => Cartesian3.fromDegrees(p[0], p[1])));
    let position = Cartographic.fromCartesian(sphere.center);
    let height = viewer.scene.globe.getHeight(position) ?? 0;
    try { [position] = await sampleTerrainMostDetailed(viewer.terrainProvider, [position]); if (Number.isFinite(position.height)) height = position.height; }
    catch { /* La fiche reste accessible si le relief n'est pas disponible. */ }
    if (ticket !== focusGeneration || !toggle.checked || selectedId !== item.feature.id) return;
    focusPending = false;
    sphere.center = Cartesian3.fromRadians(position.longitude, position.latitude, height);
    focusFlight = true;
    viewer.camera.flyToBoundingSphere(sphere, { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.2,
      offset: new HeadingPitchRange(CesiumMath.toRadians(10), CesiumMath.toRadians(-40), Math.max(900, sphere.radius * 3)),
      complete: () => { focusFlight = false; }, cancel: () => { focusFlight = false; } });
  }
  function updateChoices() {
    const kinds = { stop: stopsToggle.checked, line: linesToggle.checked, zone: zonesToggle.checked };
    for (const option of kindSelect.options) option.disabled = !kinds[option.value];
    if (!kinds[kindSelect.value]) kindSelect.value = Object.keys(kinds).find((key) => kinds[key]) ?? 'stop';
    choices.replaceChildren();
    const items = filtered.filter((item) => item.kind === kindSelect.value).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'fr') || a.feature.properties.id - b.feature.properties.id || a.feature.id.localeCompare(b.feature.id));
    for (const item of items) choices.add(new Option(`${item.kind === 'line' && !basel ? `Tracé ${item.feature.properties.id} · ` : ''}${nameOf(item)}`, item.feature.id));
    choices.disabled = open.disabled = status.dataset.state !== 'ready' || !items.length;
  }
  function rebuild() {
    if (destroyed || !records || !toggle.checked) return;
    onClear();
    imagery?.destroy(); imagery = undefined;
    const place = sector.value === 'active' ? getPlace() : null;
    const visible = { stop: stopsToggle.checked, line: linesToggle.checked, zone: zonesToggle.checked };
    filtered = records.filter((item) => visible[item.kind] && geometryNear(item.kind, item.feature, place)
      && (basel ? !modeFilter.value||item.display.modes.includes(modeFilter.value) : item.kind === 'zone' || !offer.value || dayNight(item)[offer.value]));
    if (!source) {
      source = new CustomDataSource(config.sourceName);
      source.clustering.enabled = true; source.clustering.pixelRange = 22; source.clustering.minimumClusterSize = 3;
      removeCluster = source.clustering.clusterEvent.addEventListener((entities, cluster) => {
        cluster.label.show = cluster.point.show = false; cluster.billboard.show = true;
        const items = entities.map((entity) => byEntity.get(entity.id));
        const color = basel?baseColor(items[0]):items.some((item) => dayNight(item).day) ? BLUE : items.some((item) => dayNight(item).night) ? PURPLE : GREY;
        cluster.billboard.image = pinImage(`${basel?'R':'B'}${entities.length}`, color); cluster.billboard.id = entities;
        cluster.billboard.heightReference = HeightReference.CLAMP_TO_TERRAIN;
        cluster.billboard.verticalOrigin = VerticalOrigin.BOTTOM; cluster.billboard.disableDepthTestDistance = 5000;
        cluster.billboard.distanceDisplayCondition = new DistanceDisplayCondition(0, 80000);
      });
      const attached = source;
      void viewer.dataSources.add(attached).then(() => { if (source !== attached || !toggle.checked) viewer.dataSources.remove(attached, true); });
    }
    source.entities.removeAll(); byEntity.clear();
    geometryStats = { sourceLineVertices: 0, renderedLineVertices: 0, renderedLineParts: 0 };
    const rasterLines = [];
    for (const item of filtered) {
      const feature = item.feature;
      const add = (id, options) => { source.entities.add({ id, name: nameOf(item), ...options }); byEntity.set(id, item); };
      if (item.kind === 'stop') {
        const [lon, lat] = feature.geometry.coordinates[0];
        add(feature.id, { position: Cartesian3.fromDegrees(lon, lat), billboard: { image: pinImage(pinText(item), baseColor(item)),
          heightReference: HeightReference.CLAMP_TO_TERRAIN, verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: 5000, distanceDisplayCondition: new DistanceDisplayCondition(0, 80000) } });
      } else if (item.kind === 'line') {
        const lines = lineGeometry(item);
        geometryStats.sourceLineVertices += feature.geometry.coordinates.reduce((count, line) => count + line.length, 0);
        geometryStats.renderedLineVertices += lines.reduce((count, line) => count + line.length, 0);
        geometryStats.renderedLineParts += lines.length;
        if (raster) rasterLines.push({ id: feature.id, parts: lines, color: baseColor(item).toCssColorString(), night: nightOnly(item) });
        else lines.forEach((line, i) => add(`${feature.id}#${i}`, { polyline: {
          positions: line.map((p) => Cartesian3.fromDegrees(p[0], p[1])), width: 5, material: lineMaterial(item),
          clampToGround: true, classificationType: ClassificationType.TERRAIN, zIndex: 3 } }));
      } else {
        feature.geometry.coordinates.forEach((polygon, i) => add(`${feature.id}#${i}`, { polygon: {
          hierarchy: new PolygonHierarchy(polygon[0].map((p) => Cartesian3.fromDegrees(p[0], p[1])),
            polygon.slice(1).map((ring) => new PolygonHierarchy(ring.map((p) => Cartesian3.fromDegrees(p[0], p[1]))))),
          material: PURPLE.withAlpha(.14), heightReference: HeightReference.CLAMP_TO_TERRAIN,
          classificationType: ClassificationType.TERRAIN, zIndex: 0 } }));
      }
    }
    if (rasterLines.length) {
      const owner = createTransportImagery(viewer, rasterLines, config.credit, () => queueMicrotask(() => {
        if (destroyed || imagery !== owner) return;
        removeSource(); setState('error', 'Tracés indisponibles. Réessayez le chargement.');
      }));
      imagery = owner;
    }
    updateChoices();
    const count = (kind) => filtered.filter((i) => i.kind === kind).length;
    setState('ready', basel?`${count('stop')} quais · ${count('line')} tracés tram/bus. Réseau statique ; dates source dans les fiches.`:`${count('stop')} arrêts · ${count('line')} tracés · ${count('zone')} zones. Réseau statique du ${config.date}.`);
    viewer.scene.requestRender();
  }
  async function load() {
    const ticket = ++generation; request?.abort(); if (destroyed || !toggle.checked) return;
    if (records) { rebuild(); return; }
    const controller = new AbortController(); request = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setState('loading', basel?'Chargement des trams, bus et quais…':'Chargement du réseau de bus…');
    try {
      if(basel){
        const loaded=await loadBaselTransit(config,controller.signal);
        if(destroyed||ticket!==generation||!toggle.checked)return;
        records=loaded.records;sourceInfo={...loaded,records:undefined};records.forEach(item=>byId.set(item.feature.id,item));rebuild();return;
      }
      const names = config.files;
      const values = await Promise.all(names.map(async (name) => {
        const response = await fetch(`${base}${name}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Transports : HTTP ${response.status}`); return response.json();
      }));
      if (destroyed || ticket !== generation || !toggle.checked) return;
      const specs = config.specs;
      const validCoordinates = (coords) => Array.isArray(coords) && (typeof coords[0] === 'number'
        ? coords.length === 2 && coords.every(Number.isFinite) && coords[0] >= west && coords[0] <= east && coords[1] >= south && coords[1] <= north
        : coords.length > 0 && coords.every(validCoordinates));
      for (let i = 0; i < specs.length; i++) {
        const [kind, type, count] = specs[i]; const data = values[i];
        if (data.type !== 'FeatureCollection' || !Array.isArray(data.features) || data.features.length !== count
          || new Set(data.features.map((f) => f.id)).size !== count || data.features.some((f) => !f.id || !f.properties
            || f.geometry?.type !== type || !validCoordinates(f.geometry.coordinates)
            || (kind === 'stop' && f.geometry.coordinates.length !== 1))) throw new Error('Données transports invalides');
      }
      if (!Array.isArray(values[3].checks)) throw new Error('Contrôles de liens invalides');
      records = specs.flatMap(([kind], i) => values[i].features.map((feature) => ({ kind, feature })));
      records.forEach((item) => byId.set(item.feature.id, item));
      checks = new Map(values[3].checks.map((check) => [`${check.featureId}:${check.field}`, check]));
      rebuild();
    } catch (error) {
      if (destroyed || ticket !== generation || !toggle.checked) return;
      removeSource(); setState('error', 'Transports indisponibles. Vérifiez la connexion puis réessayez.'); console.warn('Transports', error);
    } finally { clearTimeout(timeout); }
  }
  function setEnabled(enabled) {
    if (destroyed) return;
    toggle.checked = enabled;
    generation++; request?.abort(); onClear();
    if (toggle.checked) return load();
    else { removeSource(); filtered = []; choices.replaceChildren(); setState('off', 'Transports masqués.'); }
  }
  listen(toggle, 'change', () => setEnabled(toggle.checked));
  listen(retry, 'click', () => void load());
  for (const control of [sector, offer, modeFilter, stopsToggle, linesToggle, zonesToggle]) listen(control, 'change', rebuild);
  listen(kindSelect, 'change', () => { onClear(); updateChoices(); });
  listen(open, 'click', () => { const item = byId.get(choices.value); if (item && filtered.includes(item)) { select(item.feature.id); void focus(item); } });
  setState('off', 'Transports masqués.');
  function pickedItem(picked) {
    const entity = picked?.id;
    // Cluster picks contain an array, while buildings may use another ID type.
    // EntityCollection.contains requires an entity with a string/number ID.
    return source && toggle.checked && entity && ['string','number'].includes(typeof entity.id)
      && source.entities.contains(entity) ? byEntity.get(entity.id) : null;
  }
  function linesAt(position) {
    if (imagery) {
      const scene = viewer.scene, world = scene.globe.pick(viewer.camera.getPickRay(position), scene);
      if (!world) return [];
      const c = Cartographic.fromCartesian(world), point = [CesiumMath.toDegrees(c.longitude), CesiumMath.toDegrees(c.latitude)];
      const offsets = [{ x: position.x + 8, y: position.y }, { x: position.x, y: position.y + 8 }];
      const radius = Math.max(1, ...offsets.map(p => {
        const neighbor = scene.globe.pick(viewer.camera.getPickRay(p), scene);
        return neighbor ? Cartesian3.distance(world, neighbor) : 0;
      }));
      return imagery.nearby(point, radius).filter(match => {
        const cartographic = Cartographic.fromDegrees(...match.position);
        const height = scene.globe.getHeight(cartographic);
        if (!Number.isFinite(height)) return false;
        const screen = scene.cartesianToCanvasCoordinates(Cartesian3.fromDegrees(...match.position, height));
        return screen && Math.hypot(screen.x - position.x, screen.y - position.y) <= 8;
      }).map(match => byId.get(match.id));
    }
    const items = new Map();
    for (const picked of viewer.scene.drillPick(position, 64)) {
      const item = pickedItem(picked);
      if (item?.kind === 'line') items.set(item.feature.id, item);
    }
    return [...items.values()];
  }
  return {
    setEnabled,
    refresh: () => { if (!destroyed && toggle.checked) return load(); },
    destroy() {
      if (destroyed) return;
      onClear();
      destroyed = true;
      generation++;
      request?.abort();
      events.abort();
      toggle.checked = false;
      removeSource();
      records = undefined; sourceInfo=undefined; filtered = []; checks.clear(); byId.clear();
      choices.replaceChildren(); byEntity.clear(); pins.clear();
      setState('off', 'Transports masqués.');
    },
    clearSelection, select,
    navigate: () => { clearSelection(); if (sector.value === 'active') rebuild(); },
    pick(picked, position) {
      if (!source || !toggle.checked) return false;
      if (Array.isArray(picked?.id) && picked.id.length > 1 && picked.id.every((entity) => source.entities.contains(entity) && byEntity.get(entity.id)?.kind === 'stop')) {
        onGroup(picked.id.map((entity) => byEntity.get(entity.id)), 'stop'); return true;
      }
      const item = pickedItem(picked);
      // Zones are background terrain overlays; stops, buildings and other layers keep priority.
      if (imagery && (!picked || item?.kind === 'line' || item?.kind === 'zone')) {
        const lines = linesAt(position);
        if (lines.length > 1) { onGroup(lines, 'line'); return true; }
        if (lines.length === 1) { select(lines[0].feature.id); return true; }
      }
      if (!item) return false;
      if (item.kind === 'line') {
        const lines = linesAt(position);
        if (lines.length > 1) { onGroup(lines, 'line'); return true; }
      }
      select(item.feature.id); return true;
    },
    snapshot: () => ({ enabled: toggle.checked, state: status.dataset.state, total: records?.length ?? 0,
      filtered: filtered.map((item) => ({ id: item.feature.id, kind: item.kind, name: nameOf(item) })), entityCount: source?.entities.values.length ?? 0,
      sourceCount: viewer.dataSources.length, selectedId, sector: sector.value, offer: offer.value,
      ...(basel?{mode:modeFilter.value,sourceInfo}:{}),
      renderer:raster?'terrain-imagery':'ground-polyline',imagery:imagery?.snapshot()??null,
      imageryLayerCount:viewer.imageryLayers.length,highlightCount:[...byEntity.keys()].filter(id=>id.endsWith('#highlight')).length,
      geometry: { ...geometryStats, toleranceMeters: TRANSPORT_LINE_TOLERANCE_METERS,
        clipRadiusMeters: sector.value === 'active' ? TRANSPORT_RENDER_RADIUS_METERS : null } }),
    focusing: () => focusPending || focusFlight,
    target(id) {
      const item = byId.get(id); if (!item || !filtered.includes(item)) return null;
      const coords = item.kind === 'stop' ? item.feature.geometry.coordinates : item.kind === 'line'
        ? lineGeometry(item).flat() : item.feature.geometry.coordinates.flat(2);
      const step = Math.max(1, Math.floor(coords.length / 100));
      for (let i = 0; i < coords.length; i += step) {
        const [lon, lat] = coords[i]; const height = viewer.scene.globe.getHeight(Cartographic.fromDegrees(lon, lat)); if (!Number.isFinite(height)) continue;
        const point = viewer.scene.cartesianToCanvasCoordinates(Cartesian3.fromDegrees(lon, lat, height)); if (!point) continue;
        const offsets = item.kind === 'stop' ? [[0,-20],[-8,-20],[8,-20],[0,-34]] : [[0,0],[0,2],[2,0],[0,-2]];
        for (const [dx,dy] of offsets) {
          const x=Math.round(point.x+dx);const y=Math.round(point.y+dy);
          if (document.elementFromPoint(x,y)!==viewer.scene.canvas) continue;
          if (imagery && item.kind === 'line') {
            const picked = viewer.scene.pick({ x, y });
            if (picked && !['line','zone'].includes(pickedItem(picked)?.kind)) continue;
            const hits = linesAt({ x, y });
            if (hits.some(line => line.feature.id === id)) return { x, y, id, kind: 'line', ids:hits.map(line=>line.feature.id) };
            continue;
          }
          const visible = pickedItem(viewer.scene.pick({x,y},1,1));
          const hit = pickedItem(viewer.scene.pick({x,y}));
          // A probe target must be the topmost object for both the exact pixel
          // and the normal click tolerance, rather than a nearby buried trace.
          if (visible?.feature.id===id && hit?.feature.id===id) return {x,y,id,kind:item.kind};
        }
      }
      return null;
    },
    groupTarget() {
      if (!source || !toggle.checked) return null;
      const canvas=viewer.scene.canvas;
      for (let y=60;y<canvas.clientHeight-60;y+=18) for (let x=30;x<canvas.clientWidth-30;x+=18) {
        if (document.elementFromPoint(x,y)!==canvas) continue;
        const picked=viewer.scene.pick({x,y});
        if (Array.isArray(picked?.id) && picked.id.length>1 && picked.id.every((e)=>source.entities.contains(e)&&byEntity.get(e.id)?.kind==='stop')) return {x,y,count:picked.id.length,ids:picked.id.map(e=>e.id),heightReference:picked.primitive.heightReference};
      }
      return null;
    },
  };
}
