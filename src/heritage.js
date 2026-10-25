import {
  BoundingSphere, Cartesian3, Cartographic, Color, CustomDataSource,
  DistanceDisplayCondition, HeadingPitchRange, HeightReference,
  Math as CesiumMath, PinBuilder, sampleTerrainMostDetailed, VerticalOrigin,
} from 'cesium';


export function officialPdfUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.hostname !== 'geo.jura.ch'
      || url.port || url.username || url.password || !/^\/doc\/OCC\/RBC\/\d+\.pdf$/.test(url.pathname)) return null;
    url.protocol = 'https:';
    return url.href;
  } catch { return null; }
}

export function createHeritageLayer(viewer, { config, getPlace, onSelect, onGroup, onClear, onState = () => {} }) {
  const base = `${import.meta.env.BASE_URL}${config.base}`;
  const [west, south, east, north] = config.bounds;
  const events = new AbortController();
  const listen = (target, type, callback) => target.addEventListener(type, callback, { signal: events.signal });
  let destroyed = false;
  const toggle = document.querySelector('#heritage');
  const locality = document.querySelector('#heritage-locality');
  const category = document.querySelector('#heritage-category');
  const places = document.querySelector('#heritage-place');
  const open = document.querySelector('#heritage-open');
  const status = document.querySelector('#heritage-status');
  const retry = document.querySelector('#heritage-retry');
  const credit = document.querySelector('#heritage-credit');
  const pin = new PinBuilder();
  const normal = pin.fromText('P', Color.fromCssColorString('#9a3412'), 44).toDataURL();
  const selected = pin.fromText('P', Color.fromCssColorString('#215776'), 44).toDataURL();
  let records;
  let checks = new Map();
  let filtered = [];
  let source;
  let request;
  let generation = 0;
  let focusGeneration = 0;
  let selectedId;
  let focusFlight = false;
  let removeCluster;
  const byId = new Map();

  function setState(state, message) {
    status.dataset.state = state;
    status.textContent = message;
    retry.hidden = state !== 'error';
    const ready = toggle.checked && state === 'ready';
    locality.disabled = category.disabled = !ready;
    places.disabled = !ready || !filtered.length;
    open.disabled = !ready || !filtered.length;
    credit.hidden = !toggle.checked;
    onState();
  }

  function clearSelection() {
    focusGeneration++;
    if (focusFlight) viewer.camera.cancelFlight();
    focusFlight = false;
    if (selectedId) {
      const entity = source?.entities.getById(selectedId);
      if (entity?.billboard) entity.billboard.image = normal;
    }
    selectedId = undefined;
  }

  function removeSource() {
    clearSelection();
    removeCluster?.();
    removeCluster = undefined;
    if (source) viewer.dataSources.remove(source, true);
    source = undefined;
  }

  function selectedFeature(record) {
    onSelect(record, checks.get(record.id));
    selectedId = record.id;
    places.value = record.id;
    const entity = source?.entities.getById(record.id);
    if (entity?.billboard) entity.billboard.image = selected;
    viewer.scene.requestRender();
  }

  async function focus(record) {
    if (!record.geometry) return;
    const ticket = ++focusGeneration;
    const [lon, lat] = record.geometry.coordinates[0];
    let position = Cartographic.fromDegrees(lon, lat);
    let height = viewer.scene.globe.getHeight(position) ?? 0;
    try {
      [position] = await sampleTerrainMostDetailed(viewer.terrainProvider, [position]);
      if (Number.isFinite(position.height)) height = position.height;
    } catch { /* La fiche reste consultable si le relief est indisponible. */ }
    if (ticket !== focusGeneration || !toggle.checked || selectedId !== record.id) return;
    focusFlight = true;
    viewer.camera.flyToBoundingSphere(new BoundingSphere(Cartesian3.fromDegrees(lon, lat, height), 60), {
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.2,
      offset: new HeadingPitchRange(CesiumMath.toRadians(10), CesiumMath.toRadians(-40), 900),
      complete: () => { focusFlight = false; }, cancel: () => { focusFlight = false; },
    });
  }

  function rebuild() {
    if (destroyed || !records || !toggle.checked) return;
    onClear();
    const city = locality.value === 'active' ? getPlace() : locality.value;
    filtered = records.filter((record) => (!city || record.properties.localite === city)
      && (!category.value || record.properties.categorie === category.value));
    places.replaceChildren();
    for (const record of [...filtered].sort((a, b) => a.properties.nom.localeCompare(b.properties.nom, 'fr'))) {
      const option = new Option(`${record.properties.nom}${record.geometry ? '' : ' · sans position'}`, record.id);
      places.add(option);
    }
    if (!source) {
      source = new CustomDataSource(config.sourceName);
      source.clustering.enabled = true;
      source.clustering.pixelRange = 28;
      source.clustering.minimumClusterSize = 4;
      removeCluster = source.clustering.clusterEvent.addEventListener((entities, cluster) => {
        cluster.label.show = cluster.point.show = false;
        cluster.billboard.show = true;
        cluster.billboard.image = pin.fromText(String(entities.length), Color.fromCssColorString('#9a3412'), 44).toDataURL();
        cluster.billboard.id = entities;
        cluster.billboard.verticalOrigin = VerticalOrigin.BOTTOM;
        // Les positions des entités sont sans Z. Le centroïde Cesium reste
        // près de l'ellipsoïde tant que le groupe n'est pas ancré au relief.
        cluster.billboard.heightReference = HeightReference.CLAMP_TO_TERRAIN;
        cluster.billboard.disableDepthTestDistance = 5000;
        cluster.billboard.distanceDisplayCondition = new DistanceDisplayCondition(0, 80000);
      });
      const attached = source;
      void viewer.dataSources.add(attached).then(() => {
        if (source !== attached || !toggle.checked) viewer.dataSources.remove(attached, true);
      });
    }
    source.entities.removeAll();
    for (const record of filtered) {
      if (!record.geometry) continue;
      const [lon, lat] = record.geometry.coordinates[0];
      source.entities.add({
        id: record.id, name: record.properties.nom,
        position: Cartesian3.fromDegrees(lon, lat),
        billboard: { image: normal, heightReference: HeightReference.CLAMP_TO_TERRAIN,
          verticalOrigin: VerticalOrigin.BOTTOM, disableDepthTestDistance: 5000,
          distanceDisplayCondition: new DistanceDisplayCondition(0, 80000) },
      });
    }
    const unplaced = filtered.filter((record) => !record.geometry).length;
    setState('ready', `${filtered.length} lieux · ${filtered.length - unplaced} repères${unplaced ? ` · ${unplaced} sans position` : ''}.`);
    viewer.scene.requestRender();
  }

  async function load() {
    const ticket = ++generation;
    request?.abort();
    if (destroyed || !toggle.checked) return;
    if (records) { rebuild(); return; }
    const controller = new AbortController();
    request = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setState('loading', 'Chargement du patrimoine…');
    try {
      const read = async (name) => {
        const response = await fetch(`${base}${name}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Patrimoine : HTTP ${response.status}`);
        return response.json();
      };
      const [data, links] = await Promise.all([...config.files.map(read)]);
      if (destroyed || ticket !== generation || !toggle.checked) return;
      if (data.type !== 'FeatureCollection' || !Array.isArray(data.features) || data.features.length !== config.count
        || data.features.some((f) => !f.id || !f.properties || typeof f.properties.nom !== 'string'
          || (f.geometry && (f.geometry.type !== 'MultiPoint' || f.geometry.coordinates.length !== 1
            || f.geometry.coordinates[0].length !== 2 || !f.geometry.coordinates[0].every(Number.isFinite)
            || f.geometry.coordinates[0][0] < west || f.geometry.coordinates[0][0] > east
            || f.geometry.coordinates[0][1] < south || f.geometry.coordinates[0][1] > north)))) throw new Error('Données patrimoine invalides');
      if (!Array.isArray(links.checks) || new Set(data.features.map((f) => f.id)).size !== config.count) throw new Error('Index patrimoine invalide');
      records = data.features;
      records.forEach((record) => byId.set(record.id, record));
      checks = new Map(links.checks.map((check) => [check.featureId, check]));
      for (const value of [...new Set(records.map((record) => record.properties.categorie).filter(Boolean))].sort()) {
        category.add(new Option(value, value));
      }
      rebuild();
    } catch (error) {
      if (destroyed || ticket !== generation || !toggle.checked) return;
      removeSource();
      setState('error', 'Patrimoine indisponible. Vérifiez la connexion puis réessayez.');
      console.warn('Patrimoine', error);
    } finally { clearTimeout(timeout); }
  }

  function setEnabled(enabled) {
    if (destroyed) return;
    toggle.checked = enabled;
    generation++;
    request?.abort();
    onClear();
    if (toggle.checked) return load();
    else {
      removeSource();
      filtered = [];
      places.replaceChildren();
      setState('off', 'Patrimoine masqué.');
    }
  }
  listen(toggle, 'change', () => setEnabled(toggle.checked));
  listen(retry, 'click', () => void load());
  listen(locality, 'change', rebuild);
  listen(category, 'change', rebuild);
  listen(open, 'click', () => {
    const record = byId.get(places.value);
    if (!record || !toggle.checked || !filtered.includes(record)) return;
    selectedFeature(record);
    void focus(record);
  });
  setState('off', 'Patrimoine masqué.');

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
      records = undefined; filtered = []; checks.clear(); byId.clear();
      places.replaceChildren();
      while (category.options.length > 1) category.remove(1);
      setState('off', 'Patrimoine masqué.');
    },
    clearSelection,
    navigate: () => { clearSelection(); if (locality.value === 'active') rebuild(); },
    select(id) {
      const record = byId.get(id);
      if (!source || !toggle.checked || !filtered.includes(record)) return;
      selectedFeature(record);
    },
    pick(picked) {
      if (!source || !toggle.checked) return false;
      if (Array.isArray(picked?.id) && picked.id.length > 1 && picked.id.every((entity) => source.entities.contains(entity))) {
        onGroup(picked.id.map((entity) => byId.get(entity.id)));
        return true;
      }
      const entity = picked?.id;
      if (!entity || !source.entities.contains(entity)) return false;
      selectedFeature(byId.get(entity.id));
      return true;
    },
    snapshot: () => ({ enabled: toggle.checked, state: status.dataset.state, total: records?.length ?? 0,
      filtered: filtered.map((r) => ({ id: r.id, name: r.properties.nom, located: !!r.geometry })),
      entityCount: source?.entities.values.length ?? 0, sourceCount: viewer.dataSources.length, selectedId,
      locality: locality.value, category: category.value }),
    target(id) {
      const entity = source?.entities.getById(id);
      if (!entity) return null;
      const record = byId.get(id);
      const [lon, lat] = record.geometry.coordinates[0];
      const height = viewer.scene.globe.getHeight(Cartographic.fromDegrees(lon, lat)) ?? 0;
      const point = viewer.scene.cartesianToCanvasCoordinates(Cartesian3.fromDegrees(lon, lat, height));
      if (!point) return null;
      for (let dy = -42; dy <= 0; dy += 6) {
        for (let dx = -18; dx <= 18; dx += 6) {
          const position = { x: point.x + dx, y: point.y + dy };
          if (document.elementFromPoint(position.x, position.y) !== viewer.scene.canvas) continue;
          const picked = viewer.scene.pick(position);
          if (picked?.id?.id === id) return { ...position, picked: true, name: record.properties.nom };
        }
      }
      return null;
    },
    groupTarget() {
      if (!source || !toggle.checked) return null;
      const canvas = viewer.scene.canvas;
      for (let y = 60; y < canvas.clientHeight - 60; y += 18) {
        for (let x = 30; x < canvas.clientWidth - 30; x += 18) {
          if (document.elementFromPoint(x, y) !== canvas) continue;
          const picked = viewer.scene.pick({ x, y });
          if (Array.isArray(picked?.id) && picked.id.length > 1 && picked.id.every((e) => source.entities.contains(e))) {
            // API publiques : comparer l'ancre rendue au même point sur le
            // relief, sans utiliser les positions privées de Cesium.
            const position = Cartographic.fromCartesian(picked.primitive.position);
            const height = viewer.scene.globe.getHeight(position);
            const anchor = picked.primitive.computeScreenSpacePosition(viewer.scene);
            const ground = Number.isFinite(height) && viewer.scene.cartesianToCanvasCoordinates(
              Cartesian3.fromRadians(position.longitude, position.latitude, height));
            return { x, y, count: picked.id.length, ids: picked.id.map((entity) => entity.id),
              longitude: CesiumMath.toDegrees(position.longitude), latitude: CesiumMath.toDegrees(position.latitude),
              heightReference: picked.primitive.heightReference, terrainHeight: height,
              groundAnchorErrorPixels: anchor && ground ? Math.hypot(anchor.x - ground.x, anchor.y - ground.y) : null };
          }
        }
      }
      return null;
    },
  };
}
