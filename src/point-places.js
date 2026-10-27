import { BoundingSphere, Cartesian3, Cartographic, Color, CustomDataSource, DistanceDisplayCondition,
  HeadingPitchRange, HeightReference, Math as CesiumMath, PinBuilder, sampleTerrainMostDetailed, VerticalOrigin } from 'cesium';
import { placeDistanceMeters } from './point-geometry.js';

export function createPointPlacesLayer(viewer, { config, getPlace, onSelect, onGroup, onClear, onState = () => {},
  prefix = 'heritage', symbol = 'L', label = 'Lieux', loadRecords, extraControls = [], filterRecord = () => true }) {
  const toggle = document.querySelector(`#${prefix}`), sector = document.querySelector(`#${prefix}-locality`);
  const category = document.querySelector(`#${prefix}-category`), choices = document.querySelector(`#${prefix}-place`);
  const open = document.querySelector(`#${prefix}-open`), retry = document.querySelector(`#${prefix}-retry`);
  const status = document.querySelector(`#${prefix}-status`), events = new AbortController();
  const listen = (node, type, fn) => node.addEventListener(type, fn, { signal: events.signal });
  const pin = new PinBuilder(), images = new Map(), color = config.color ?? '#9a3412';
  const image = color => {if(!images.has(color))images.set(color,pin.fromText(symbol,Color.fromCssColorString(color),44).toDataURL());return images.get(color);};
  const normal = record => image(record.display.closed ? '#64748b' : color);
  const selected = image('#215776'), groups = new Map();
  let data, filtered = [], source, request, generation = 0, focusGeneration = 0, destroyed = false;
  let selectedId, focusing = false, focusPending = false, removeCluster;
  const byId = new Map();
  function state(value, message) {
    status.dataset.state = value; status.textContent = message; retry.hidden = value !== 'error';
    const ready = toggle.checked && value === 'ready';
    sector.disabled = category.disabled = !ready; choices.disabled = open.disabled = !ready || !filtered.length;
    for(const id of extraControls)document.querySelector(id).disabled=!ready;
    onState();
  }
  function clearSelection() {
    focusGeneration++; focusPending = false; if (focusing) viewer.camera.cancelFlight(); focusing = false;
    const entity = selectedId === undefined ? null : source?.entities.getById(selectedId); if (entity?.billboard) entity.billboard.image = normal(byId.get(selectedId));
    selectedId = undefined;
  }
  function remove() {
    clearSelection(); removeCluster?.(); removeCluster = undefined;
    if (source) viewer.dataSources.remove(source, true); source = undefined;
  }
  function select(record) {
    onSelect(record, { fetchedAt: data.fetchedAt }); selectedId = record.id; choices.value = record.id;
    const entity = source?.entities.getById(record.id); if (entity) entity.billboard.image = selected;
    viewer.scene.requestRender();
  }
  async function focus(record) {
    const ticket = ++focusGeneration, [lon, lat] = record.feature.geometry.coordinates; focusPending = true;
    let position = Cartographic.fromDegrees(lon, lat), height = viewer.scene.globe.getHeight(position) ?? 0;
    try { [position] = await sampleTerrainMostDetailed(viewer.terrainProvider, [position]); if (Number.isFinite(position.height)) height = position.height; } catch { /* Keep the card available offline. */ }
    if (destroyed || ticket !== focusGeneration || !toggle.checked || selectedId !== record.id) return;
    focusPending = false; focusing = true; viewer.camera.flyToBoundingSphere(new BoundingSphere(Cartesian3.fromDegrees(lon, lat, height), 60), {
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.2,
      offset: new HeadingPitchRange(CesiumMath.toRadians(10), CesiumMath.toRadians(-40), 900),
      complete: () => { focusing = false; }, cancel: () => { focusing = false; },
    });
  }
  function rebuild() {
    if (destroyed || !toggle.checked || !data) return;
    onClear(); remove();
    filtered = data.records.filter(r => (!category.value || r.display.category === category.value)
      && (!sector.value || placeDistanceMeters(r.feature.geometry.coordinates, getPlace()) <= config.radiusMeters) && filterRecord(r));
    choices.replaceChildren();
    for (const r of [...filtered].sort((a, b) => a.display.name.localeCompare(b.display.name, 'fr'))) choices.add(new Option(`${r.display.name} · ${r.display.category}${r.display.closed ? ' · fermeture signalée' : ''}`, r.id));
    source = new CustomDataSource(config.sourceName); const attached = source;
    // Close pairs also include separate source records for one physical place.
    // Keep every identity in the group while reducing overlapping symbols.
    source.clustering.enabled = true; source.clustering.pixelRange = 44; source.clustering.minimumClusterSize = 2;
    removeCluster = source.clustering.clusterEvent.addEventListener((entities, cluster) => {
      cluster.label.show = cluster.point.show = false; cluster.billboard.show = true;
      if (!groups.has(entities.length)) groups.set(entities.length, pin.fromText(`${symbol === 'WC' ? 'W' : symbol}${entities.length}`, Color.fromCssColorString(color), 44).toDataURL());
      cluster.billboard.image = groups.get(entities.length); cluster.billboard.id = entities;
      cluster.billboard.heightReference = HeightReference.CLAMP_TO_TERRAIN; cluster.billboard.verticalOrigin = VerticalOrigin.BOTTOM;
      cluster.billboard.disableDepthTestDistance = 5000; cluster.billboard.distanceDisplayCondition = new DistanceDisplayCondition(0, 80000);
    });
    void viewer.dataSources.add(attached).then(() => { if (destroyed || source !== attached || !toggle.checked) viewer.dataSources.remove(attached, true); });
    for (const r of filtered) source.entities.add({ id: r.id, name: r.display.name,
      position: Cartesian3.fromDegrees(...r.feature.geometry.coordinates), billboard: { image: normal(r),
        heightReference: HeightReference.CLAMP_TO_TERRAIN, verticalOrigin: VerticalOrigin.BOTTOM,
        disableDepthTestDistance: 5000, distanceDisplayCondition: new DistanceDisplayCondition(0, 80000) } });
    state('ready', `${filtered.length} repères sur ${data.records.length} fournis. Données statiques ; lecture du ${new Date(data.fetchedAt).toLocaleString('fr-CH')}.`);
    viewer.scene.requestRender();
  }
  async function load() {
    const ticket = ++generation; request?.abort();
    if (destroyed || !toggle.checked) return;
    if (data) { rebuild(); return; }
    const controller = new AbortController(); request = controller;
    const timeout = setTimeout(() => controller.abort(), 30000); state('loading', `Chargement : ${label.toLowerCase()}…`);
    try {
      const next = await loadRecords(config, controller.signal);
      if (destroyed || ticket !== generation || !toggle.checked) return;
      data = next; for (const r of data.records) byId.set(r.id, r);
      while (category.options.length > 1) category.remove(1);
      for (const value of [...new Set(data.records.map(r => r.display.category))].sort()) category.add(new Option(value, value));
      rebuild();
    } catch (e) {
      if (destroyed || ticket !== generation || !toggle.checked) return;
      filtered = []; choices.replaceChildren(); remove();
      state('error', `${label} indisponibles. Vérifiez la connexion puis réessayez.`); console.warn(label, e);
    } finally { clearTimeout(timeout); }
  }
  function setEnabled(value) {
    if (destroyed) return; toggle.checked = value; generation++; request?.abort(); onClear();
    if (value) return load();
    remove(); filtered = []; choices.replaceChildren(); state('off', `${label} masqués.`);
  }
  listen(toggle, 'change', () => void setEnabled(toggle.checked)); listen(retry, 'click', () => void load());
  listen(sector, 'change', rebuild); listen(category, 'change', rebuild);
  for(const id of extraControls)listen(document.querySelector(id),'change',rebuild);
  listen(open, 'click', () => { const record = byId.get(choices.value); if (toggle.checked && filtered.includes(record)) { select(record); void focus(record); } });
  state('off', `${label} masqués.`);
  const own = entity => entity && ['string', 'number'].includes(typeof entity.id) && source?.entities.contains(entity);
  const members = picked => Array.isArray(picked?.id) && picked.id.length > 1 && picked.id.every(own) ? picked.id : null;
  return {
    setEnabled, refresh: () => { if (!destroyed && toggle.checked) return load(); }, clearSelection,
    navigate: () => { clearSelection(); if (sector.value === 'active') rebuild(); },
    select(id) { const r = byId.get(id); if (toggle.checked && filtered.includes(r)) select(r); },
    pick(picked) {
      if (!source || !toggle.checked) return false;
      const group = members(picked); if (group) { onGroup(group.map(e => byId.get(e.id))); return true; }
      if (!own(picked?.id)) return false; select(byId.get(picked.id.id)); return true;
    },
    snapshot: () => ({ enabled: toggle.checked, state: status.dataset.state, total: data?.records.length ?? 0,
      counts: data?.counts, fetchedAt: data?.fetchedAt, filtered: filtered.map(r => ({ id: r.id, name: r.display.name, category: r.display.category })),
      entityCount: source?.entities.values.length ?? 0, sourceCount: viewer.dataSources.length, selectedId, locality: sector.value, category: category.value, focusing, focusPending }),
    target(id) {
      const r = byId.get(id); if (!source?.entities.getById(id) || !r) return null;
      const [lon, lat] = r.feature.geometry.coordinates, h = viewer.scene.globe.getHeight(Cartographic.fromDegrees(lon, lat)) ?? 0;
      const p = viewer.scene.cartesianToCanvasCoordinates(Cartesian3.fromDegrees(lon, lat, h)); if (!p) return null;
      for (let dy = -42; dy <= 0; dy += 6) for (let dx = -18; dx <= 18; dx += 6) {
        const at = { x: p.x + dx, y: p.y + dy }; if (document.elementFromPoint(at.x, at.y) !== viewer.scene.canvas) continue;
        if (viewer.scene.pick(at)?.id?.id === id) return { ...at, picked: true, name: r.display.name };
      } return null;
    },
    groupTarget() {
      if (!source || !toggle.checked) return null;
      const canvas = viewer.scene.canvas;
      for (let y = 60; y < canvas.clientHeight - 60; y += 20) for (let x = 30; x < canvas.clientWidth - 30; x += 20) {
        if (document.elementFromPoint(x, y) !== canvas) continue;
        const group = members(viewer.scene.pick({ x, y }));
        if (group) return { x, y, count: group.length, ids: group.map(e => e.id) };
      } return null;
    },
    destroy() {
      if (destroyed) return; onClear(); destroyed = true; generation++; request?.abort(); events.abort(); toggle.checked = false;
      remove(); data = undefined; filtered = []; byId.clear(); groups.clear(); images.clear(); choices.replaceChildren();
      while (category.options.length > 1) category.remove(1); state('off', `${label} masqués.`);
    },
  };
}
