import {
  BoundingSphere, Cartesian2, Cartesian3, Cartographic, CameraEventType,
  Cesium3DTileFeature, Cesium3DTileset, CesiumTerrainProvider, Color, ClippingPolygon, ClippingPolygonCollection,
  HeadingPitchRange, ImageryLayer, JulianDate, Math as CesiumMath, Matrix4,
  MouseButton, Rectangle, ShadowMode, ScreenSpaceEventType,
  ScreenSpaceTiltOrbitCameraController, UrlTemplateImageryProvider, Viewer,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './style.css';
import { createParkingLayer } from './parking.js';
import { parkingFreshness, parkingDate } from './parking-data.js';
import { createTransportLayer, officialTransportUrl } from './transport.js';
import { BASEL_TIMETABLE, BASEL_NETWORK, BASEL_OLD_LINKS } from './basel-transit-data.js';
import { createHeritageLayer, officialPdfUrl } from './heritage.js';

import territoryConfig from '#territory';
import { validateTerritory, configureTerritoryUi } from './territory.js';
import { createLayerCollection } from './layers.js';

const territory = validateTerritory(territoryConfig);
configureTerritoryUi(territory, document, import.meta.env.BASE_URL);
const PLACES = territory.places;
const layerConfig = Object.fromEntries(territory.layers.map(layer => [layer.id, layer]));
const INITIAL_VIEW = {
  destination: Cartesian3.fromDegrees(territory.initialView.longitude, territory.initialView.latitude, territory.initialView.height),
  orientation: { heading: CesiumMath.toRadians(territory.initialView.heading), pitch: CesiumMath.toRadians(territory.initialView.pitch) },
};
const probeParameters = new URLSearchParams(location.search);
const status = document.querySelector('#status');
const retry = document.querySelector('#retry');
const datetime = document.querySelector('#datetime');
const timeSlider = document.querySelector('#time-slider');
const timeValue = document.querySelector('#time-value');
const buildingsToggle = document.querySelector('#buildings');
const shadowsToggle = document.querySelector('#shadows');
const fpsToggle = document.querySelector('#fps');
const qualitySelect = document.querySelector('#quality');
const qualityStatus = document.querySelector('#quality-status');
const qualityRecheck = document.querySelector('#quality-recheck');
const QUALITY_PRESETS = {
  low: { label: 'Faible', scale: .6, msaa: 1, shadows: false, description: 'Rendu réduit à 60 %, sans ombres simulées.' },
  medium: { label: 'Moyen', scale: .75, msaa: 1, shadows: false, description: 'Rendu réduit à 75 %, sans ombres simulées.' },
  high: { label: 'Élevé', scale: 1, msaa: 4, shadows: true, description: 'Résolution normale, ombres simulées complètes.' },
  ultra: { label: 'Ultra', scale: 1.5, msaa: 4, shadows: true, description: 'Rendu à 150 %, plus exigeant ; ombres simulées complètes.' },
};
const QUALITY_STORAGE_KEY = 'jura3d.quality.v1';
function saveQualityPreference(value) {
  try { localStorage.setItem(QUALITY_STORAGE_KEY, value); } catch { /* Stockage facultatif. */ }
}
function savedQualityPreference() {
  try {
    const value = localStorage.getItem(QUALITY_STORAGE_KEY);
    return value === 'auto' || Object.hasOwn(QUALITY_PRESETS, value) ? value : 'auto';
  } catch { return 'auto'; }
}
const basemap = document.querySelector('#basemap');
const selectionPanel = document.querySelector('#selection');
const settings = document.querySelector('#settings');
const controls = document.querySelector('.controls');
const controlsBody = document.querySelector('#controls-body');
const controlsToggle = document.querySelector('#toggle-controls');
const phoneLayout = matchMedia('(max-width: 600px)');
let controlsUsed = false;
function setControlsExpanded(expanded) {
  controlsBody.hidden = !expanded;
  controls.classList.toggle('is-collapsed', !expanded);
  controlsToggle.setAttribute('aria-expanded', String(expanded));
  controlsToggle.textContent = expanded ? 'Replier' : 'Explorer';
}
setControlsExpanded(!phoneLayout.matches);
controlsToggle.addEventListener('click', () => {
  controlsUsed = true;
  setControlsExpanded(controlsToggle.getAttribute('aria-expanded') !== 'true');
});
// Layer summaries scroll with their settings; pending loads and errors remain
// accessible even when that section or the whole panel is folded.
const layerStatuses = territory.layers.map(({ id: name }) => ({
  status: document.querySelector(`#${name}-status`), retry: document.querySelector(`#${name}-retry`),
}));
const layerAlert = document.querySelector('#layer-alert');
const layerAlertRetry = document.querySelector('#layer-alert-retry');
function syncLayerAlert() {
  const pending = layerStatuses.filter(({ status }) => ['loading', 'error'].includes(status.dataset.state));
  layerAlert.hidden = pending.length === 0;
  layerAlert.textContent = pending.map(({ status }) => status.textContent).join(' ');
  layerAlert.dataset.state = pending.some(({ status }) => status.dataset.state === 'error') ? 'error' : 'loading';
  layerAlertRetry.hidden = !pending.some(({ status }) => status.dataset.state === 'error');
}
const layerStatusObserver = new MutationObserver(syncLayerAlert);
for (const { status } of layerStatuses) layerStatusObserver.observe(status, {
  attributes: true, attributeFilter: ['data-state'], childList: true,
});
layerAlertRetry.addEventListener('click', () => {
  for (const { status, retry } of layerStatuses) if (status.dataset.state === 'error') retry.click();
});
syncLayerAlert();
phoneLayout.addEventListener('change', (event) => {
  if (!controlsUsed) setControlsExpanded(!event.matches);
});
const compactLayout = matchMedia('(max-width: 600px), (max-height: 650px)');
settings.open = !compactLayout.matches;
compactLayout.addEventListener('change', (event) => { settings.open = !event.matches; });

let viewer;
try {
  viewer = new Viewer('cesiumContainer', {
    baseLayer: false, baseLayerPicker: false, geocoder: false, homeButton: false,
    sceneModePicker: false, animation: false, timeline: false, infoBox: false,
    selectionIndicator: false, navigationHelpButton: false, fullscreenButton: false,
    shadows: true, terrainShadows: ShadowMode.ENABLED,
  });
} catch (error) {
  status.textContent = 'Impossible de démarrer la scène 3D. Vérifiez WebGL et réessayez.';
  status.dataset.state = 'error';
  retry.hidden = false;
  retry.addEventListener('click', () => location.reload());
  document.querySelectorAll('nav button, #home, [data-camera], #settings input, #settings select, #quality-recheck, #heritage-settings input, #heritage-settings select, #heritage-open, #transport-settings input, #transport-settings select, #transport-open')
    .forEach((element) => { element.disabled = true; });
  console.error('Initialisation 3D', error);
}

if (viewer) startScene();

function startScene() {
  let imageryLayer;
  let buildings;
  let terrainReady = false;
  let buildingRequest = false;
  let terrainGeneration = 0;
  let buildingGeneration = 0;
  let removeTerrainError;
  let activePlace = territory.initialPlace;
  const layers = createLayerCollection();
  let flyingTo = null;
  let navigationGeneration = 0;
  let loadingSince = performance.now();
  let selectedFeature;
  let originalColor;
  let selectionKind = null;
  let heritage;
  let transport;
  let parking;
  let qualityProfile = 'high';
  let screenSpaceError = 16;
  let autoReadings = [];
  let autoWarmUntil = 0;
  let autoTick = 0;
  let autoFrames = 0;
  let autoMeasuring = false;
  let autoMeasuredFps = null;
  let autoVotes = [];
  let autoHistory = [];
  let autoProfilesTried = new Set();
  const canvas = viewer.scene.canvas;
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  const rendererExtension = gl?.getExtension('WEBGL_debug_renderer_info');
  const gpuRenderer = rendererExtension ? gl.getParameter(rendererExtension.UNMASKED_RENDERER_WEBGL) : 'Non exposé par le navigateur';
  const dedicatedGpuHint = !/SwiftShader|llvmpipe|software/i.test(gpuRenderer)
    && /NVIDIA|GeForce|Radeon\s*(RX|Pro)|Intel.*Arc/i.test(gpuRenderer);
  document.querySelector('#quality-gpu').textContent = `GPU WebGL utilisé : ${gpuRenderer}`;
  const errors = new Map();
  const resourceNames = { terrain: 'Relief', imagery: 'Fond de carte', buildings: 'Bâtiments' };

  function reportError(kind, error) {
    errors.set(kind, error?.code === 'CLIPPING_UNSUPPORTED'
      ? 'Ce navigateur ne permet pas la découpe de la zone 3D. Essayez un navigateur compatible WebGL 2.'
      : `${resourceNames[kind]} indisponible. Vérifiez la connexion puis réessayez.`);
    console.warn(resourceNames[kind], error);
    updateStatus();
  }

  function updateStatus() {
    const loading = !terrainReady || !viewer.scene.globe.tilesLoaded
      || (buildingsToggle.checked && (buildingRequest || !buildings || !buildings.tilesLoaded));
    const slow = loading && performance.now() - loadingSince > 30000;
    let message;
    let state;
    if (errors.size) {
      message = [...errors.values()].join(' ');
      state = 'error';
    } else if (flyingTo) {
      message = `Navigation vers ${PLACES[flyingTo].name}…`;
      state = 'loading';
    } else if (slow) {
      message = 'Chargement prolongé. Vérifiez la connexion ou réessayez.';
      state = 'slow';
    } else if (loading) {
      message = 'Chargement des données de la vue…';
      state = 'loading';
    } else {
      message = buildingsToggle.checked ? 'Scène 3D prête.' : 'Scène prête · bâtiments masqués.';
      state = 'ready';
      loadingSince = performance.now();
    }
    if (status.textContent !== message) status.textContent = message;
    status.dataset.state = state;
    retry.hidden = !errors.size && !slow;
  }

  function clearSelection() {
    layers.clearSelection();
    selectionPanel.classList.remove('is-heritage');
    document.querySelector('#selection-extra').hidden = true;
    document.querySelector('#selection-transport').hidden = true;
    document.querySelector('#selection-parking').hidden = true;
    document.querySelector('#transport-links').replaceChildren();
    const groupList = document.querySelector('#selection-group');
    groupList.hidden = true;
    groupList.replaceChildren();
    document.querySelector('#selection-credit').textContent = `Données ${territory.sources.credit}`;
    if (selectedFeature) {
      // Une tuile peut avoir été déchargée entre sélection et fermeture.
      try { selectedFeature.color = originalColor; } catch { /* Tuile déjà détruite. */ }
    }
    selectedFeature = undefined;
    originalColor = undefined;
    selectionKind = null;
    selectionPanel.hidden = true;
  }

  function loadImagery() {
    errors.delete('imagery');
    if (imageryLayer) viewer.imageryLayers.remove(imageryLayer, true);
    const provider = new UrlTemplateImageryProvider({
      url: territory.sources.maps[basemap.value].url, credit: territory.sources.credit,
      rectangle: Rectangle.fromDegrees(...territory.sources.imageryRectangle),
      maximumLevel: territory.sources.maps[basemap.value].maximumLevel,
    });
    imageryLayer = new ImageryLayer(provider);
    const layer = imageryLayer;
    provider.errorEvent.addEventListener((error) => {
      if (imageryLayer === layer) reportError('imagery', error);
    });
    viewer.imageryLayers.add(imageryLayer, 0);
    loadingSince = performance.now();
    viewer.scene.requestRender();
    updateStatus();
  }

  async function loadTerrain() {
    const generation = ++terrainGeneration;
    errors.delete('terrain');
    terrainReady = false;
    removeTerrainError?.();
    removeTerrainError = undefined;
    loadingSince = performance.now();
    updateStatus();
    try {
      const provider = await CesiumTerrainProvider.fromUrl(territory.sources.terrain.url, { requestVertexNormals: true });
      if (generation !== terrainGeneration) return;
      removeTerrainError = provider.errorEvent.addEventListener((error) => reportError('terrain', error));
      viewer.terrainProvider = provider;
      terrainReady = true;
      viewer.scene.requestRender();
      updateStatus();
    } catch (error) {
      if (generation === terrainGeneration) reportError('terrain', error);
    }
  }

  async function loadBuildings() {
    const generation = ++buildingGeneration;
    errors.delete('buildings');
    clearSelection();
    if (buildings) viewer.scene.primitives.remove(buildings);
    buildings = undefined;
    buildingRequest = true;
    loadingSince = performance.now();
    updateStatus();
    try {
      const tileset = await Cesium3DTileset.fromUrl(territory.sources.buildings.url, { credit: territory.sources.buildings.credit, maximumScreenSpaceError: screenSpaceError });
      if (generation !== buildingGeneration) { tileset.destroy(); return; }
      if (territory.sources.buildings.clipBounds) {
        if (!ClippingPolygonCollection.isSupported(viewer.scene)) {
          tileset.destroy(); const error = new Error('Découpe des bâtiments non prise en charge par ce navigateur');
          error.code = 'CLIPPING_UNSUPPORTED'; throw error;
        }
        const [w,s,e,n] = territory.sources.buildings.clipBounds;
        tileset.clippingPolygons = new ClippingPolygonCollection({ inverse: true,
          polygons: [new ClippingPolygon({ positions: Cartesian3.fromDegreesArray([w,s,e,s,e,n,w,n]) })] });
      }
      buildings = tileset;
      buildingRequest = false;
      buildings.shadows = ShadowMode.ENABLED;
      buildings.show = buildingsToggle.checked;
      buildings.tileFailed.addEventListener((error) => {
        if (buildings === tileset) reportError('buildings', error);
      });
      viewer.scene.primitives.add(buildings);
      updateStatus();
    } catch (error) {
      if (generation !== buildingGeneration) return;
      buildingRequest = false;
      reportError('buildings', error);
    }
  }

  const cameraController = viewer.scene.screenSpaceCameraController;
  cameraController.zoomEventTypes = [CameraEventType.WHEEL, CameraEventType.PINCH];
  viewer.addController(new ScreenSpaceTiltOrbitCameraController({ dragInputs: [{ button: MouseButton.RIGHT }] }));
  viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  viewer.scene.globe.enableLighting = true;
  // Réglages d'ombres préexistants conservés.
  viewer.shadowMap.softShadows = true;
  viewer.shadowMap.darkness = 0.65;
  shadowsToggle.addEventListener('change', () => {
    markCustomQuality();
    viewer.shadows = shadowsToggle.checked;
    viewer.scene.requestRender();
  });
  viewer.clock.shouldAnimate = false;
  function applyQuality(profile) {
    const preset = QUALITY_PRESETS[profile];
    qualityProfile = profile;
    viewer.resolutionScale = preset.scale;
    viewer.scene.msaaSamples = preset.msaa;
    viewer.shadows = preset.shadows;
    viewer.shadowMap.softShadows = true;
    shadowsToggle.checked = preset.shadows;
    // Seuil proportionnel au tampon : même tolérance de 16 pixels CSS.
    // Ne pas gagner des FPS en supprimant des groupes de bâtiments ADD.
    screenSpaceError = 16 * preset.scale;
    if (buildings) {
      buildings.maximumScreenSpaceError = screenSpaceError;
      buildings.shadows = ShadowMode.ENABLED;
    }
    qualityStatus.textContent = `${qualitySelect.value === 'auto' ? 'Auto : ' : ''}${preset.label} · ${preset.description} Bâtiments conservés.${qualitySelect.value === 'auto' && autoMeasuredFps !== null ? ` Dernière mesure : ${Math.round(autoMeasuredFps)} FPS.` : ''}`;
    qualityRecheck.hidden = qualitySelect.value !== 'auto';
    viewer.scene.requestRender();
  }
  function startAutoQuality() {
    qualitySelect.value = 'auto';
    applyQuality(dedicatedGpuHint ? 'high' : 'medium');
    autoReadings = [];
    autoFrames = 0;
    autoTick = 0;
    autoWarmUntil = performance.now() + 4000;
    autoMeasuring = true;
    autoMeasuredFps = null;
    autoVotes = [];
    autoHistory = [];
    autoProfilesTried = new Set([qualityProfile]);
    qualityStatus.textContent = `Auto : ${QUALITY_PRESETS[qualityProfile].label} · mesure au premier plan après chargement… Réglage manuel disponible.`;
  }
  function markCustomQuality() {
    autoMeasuring = false;
    qualitySelect.value = 'custom';
    qualityRecheck.hidden = true;
    qualityStatus.textContent = 'Personnalisé · réglages manuels conservés. Choisir Auto pour refaire la mesure.';
  }
  qualitySelect.addEventListener('change', () => {
    saveQualityPreference(qualitySelect.value);
    autoMeasuring = false;
    if (qualitySelect.value === 'auto') startAutoQuality();
    else applyQuality(qualitySelect.value);
  });
  qualityRecheck.addEventListener('click', () => { saveQualityPreference('auto'); startAutoQuality(); });
  viewer.scene.postRender.addEventListener(() => {
    if (!autoMeasuring) return;
    const now = performance.now();
    const ready = terrainReady && viewer.scene.globe.tilesLoaded
      && (!buildingsToggle.checked || (buildings && buildings.tilesLoaded)) && !flyingTo && !errors.size;
    if (!ready || document.hidden || !document.hasFocus()) {
      autoReadings = [];
      autoTick = 0;
      autoFrames = 0;
      autoVotes = [];
      autoWarmUntil = now + 4000;
      const message = `Auto : ${QUALITY_PRESETS[qualityProfile].label} · en attente du chargement et du navigateur au premier plan…`;
      if (qualityStatus.textContent !== message) qualityStatus.textContent = message;
      return;
    }
    if (now < autoWarmUntil) return;
    if (!autoTick) { autoTick = now; return; }
    autoFrames++;
    if (now - autoTick < 1000) return;
    autoReadings.push(autoFrames * 1000 / (now - autoTick));
    autoTick = now;
    autoFrames = 0;
    if (autoReadings.length < 6) return;
    const sorted = [...autoReadings].sort((a, b) => a - b);
    autoMeasuredFps = (sorted[2] + sorted[3]) / 2;
    const candidate = qualityProfile === 'high' ? (autoMeasuredFps < 35 ? 'medium' : 'high')
      : qualityProfile === 'medium' ? (autoMeasuredFps < 20 ? 'low' : autoMeasuredFps >= 55 ? 'high' : 'medium')
        : (autoMeasuredFps >= 45 ? 'medium' : 'low');
    autoHistory.push({ profile: qualityProfile, fps: autoMeasuredFps, candidate });
    autoVotes.push(candidate);
    autoReadings = [];
    qualityStatus.textContent = `Auto : ${QUALITY_PRESETS[qualityProfile].label} · ${Math.round(autoMeasuredFps)} FPS mesurés, confirmation en cours…`;
    if (autoVotes.length < 2 || autoVotes.at(-2) !== candidate) return;
    const ranks = ['low', 'medium', 'high'];
    const returning = autoProfilesTried.has(candidate) && candidate !== qualityProfile;
    if (candidate === qualityProfile || returning) {
      autoMeasuring = false;
      applyQuality(returning ? ranks[Math.min(ranks.indexOf(candidate), ranks.indexOf(qualityProfile))] : candidate);
      return;
    }
    autoProfilesTried.add(candidate);
    applyQuality(candidate);
    autoVotes = [];
    autoTick = 0;
    autoFrames = 0;
    autoWarmUntil = now + 4000;
    qualityStatus.textContent = `Auto : ${QUALITY_PRESETS[candidate].label} · vérification du nouveau niveau…`;
  });
  // Le probe conserve un point de comparaison déterministe ; il teste Auto
  // explicitement. L'usage normal commence par la mesure au niveau Moyen.
  if (probeParameters.has('probe') && !probeParameters.has('auto')) {
    qualitySelect.value = 'high';
    applyQuality('high');
  } else {
    const preference = probeParameters.has('auto') ? 'auto' : savedQualityPreference();
    qualitySelect.value = preference;
    if (preference === 'auto') startAutoQuality();
    else applyQuality(preference);
  }
  function updateFpsDisplay() {
    viewer.scene.debugShowFramesPerSecond = fpsToggle.checked;
    document.body.classList.toggle('fps-visible', fpsToggle.checked);
    viewer.scene.requestRender();
  }
  fpsToggle.addEventListener('change', updateFpsDisplay);
  updateFpsDisplay();
  viewer.camera.setView(INITIAL_VIEW);

  function updateActivePlace() {
    document.querySelector('#active-place').textContent = `Destination : ${PLACES[activePlace].name}`;
    document.querySelectorAll('[data-place]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.place === activePlace));
    });
    layers.navigate();
  }

  function navigate(id, home = false) {
    const generation = ++navigationGeneration;
    viewer.camera.cancelFlight();
    clearSelection();
    flyingTo = id;
    loadingSince = performance.now();
    updateStatus();
    const callbacks = {
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.2,
      complete: () => {
        if (generation !== navigationGeneration) return;
        activePlace = id;
        flyingTo = null;
        loadingSince = performance.now();
        updateActivePlace();
        updateStatus();
      },
      cancel: () => {
        if (generation !== navigationGeneration) return;
        flyingTo = null;
        updateStatus();
      },
    };
    if (home) viewer.camera.flyTo({ ...INITIAL_VIEW, ...callbacks });
    else {
      const place = PLACES[id];
      const center = Cartesian3.fromDegrees(place.longitude, place.latitude, place.elevation);
      viewer.camera.flyToBoundingSphere(new BoundingSphere(center, 180), {
        ...callbacks,
        offset: new HeadingPitchRange(CesiumMath.toRadians(10), CesiumMath.toRadians(-38), 1800),
      });
    }
  }

  document.querySelectorAll('[data-place]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.place));
  });
  document.querySelector('#home').addEventListener('click', () => navigate(territory.initialPlace, true));
  document.querySelectorAll('[data-camera]').forEach((button) => {
    button.addEventListener('click', () => {
      viewer.camera.cancelFlight();
      const action = button.dataset.camera;
      if (action.startsWith('zoom')) {
        const amount = Math.max(40, viewer.camera.positionCartographic.height * .2);
        if (action === 'zoom-in') viewer.camera.zoomIn(amount);
        else viewer.camera.zoomOut(amount);
      } else {
        const canvas = viewer.scene.canvas;
        const point = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
        const ray = viewer.camera.getPickRay(point);
        const target = viewer.scene.globe.pick(ray, viewer.scene);
        if (!target) return;
        const range = Cartesian3.distance(viewer.camera.positionWC, target);
        const heading = viewer.camera.heading + (action === 'left' ? -.25 : action === 'right' ? .25 : 0);
        const pitch = action === 'tilt'
          ? (viewer.camera.pitch < CesiumMath.toRadians(-55) ? CesiumMath.toRadians(-38) : CesiumMath.toRadians(-70))
          : viewer.camera.pitch;
        viewer.camera.lookAt(target, new HeadingPitchRange(heading, pitch, range));
        viewer.camera.lookAtTransform(Matrix4.IDENTITY);
      }
      viewer.scene.requestRender();
    });
  });
  basemap.addEventListener('change', loadImagery);
  buildingsToggle.addEventListener('change', () => {
    markCustomQuality();
    clearSelection();
    if (buildings) buildings.show = buildingsToggle.checked;
    loadingSince = performance.now();
    viewer.scene.requestRender();
    updateStatus();
  });
  retry.addEventListener('click', () => {
    const failed = [...errors.keys()];
    if (!failed.length) failed.push('imagery', 'terrain', 'buildings');
    loadingSince = performance.now();
    if (failed.includes('imagery')) loadImagery();
    if (failed.includes('terrain')) void loadTerrain();
    if (failed.includes('buildings')) void loadBuildings();
    updateStatus();
  });

  function updateTime() {
    const date = new Date(datetime.value);
    if (Number.isNaN(date.getTime())) return;
    viewer.clock.currentTime = JulianDate.fromDate(date);
    viewer.scene.requestRender();
  }
  function syncSliderFromDatetime() {
    const time = datetime.value.split('T')[1];
    if (!time) return;
    const [hours, minutes] = time.split(':').map(Number);
    timeSlider.value = String(hours * 60 + minutes);
    timeValue.value = time;
  }
  datetime.addEventListener('change', () => { syncSliderFromDatetime(); updateTime(); });
  timeSlider.addEventListener('input', () => {
    const minutes = Number(timeSlider.value);
    const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    datetime.value = `${datetime.value.split('T')[0]}T${time}`;
    timeValue.value = time;
    updateTime();
  });
  syncSliderFromDatetime();
  updateTime();

  function showHeritage(record, linkCheck) {
    clearSelection();
    selectionKind = 'heritage';
    const p = record.properties;
    document.querySelector('#selection-title').textContent = p.nom.trim() || 'Lieu patrimonial';
    document.querySelector('#selection-description').textContent = p.description?.trim() || 'Description non fournie dans le répertoire.';
    const coordinates = record.geometry?.coordinates[0];
    document.querySelector('#selection-position').textContent = coordinates
      ? `${coordinates[1].toFixed(5)}° N · ${coordinates[0].toFixed(5)}° E · repère de lieu`
      : 'Position source à vérifier · aucun repère affiché.';
    const metadata = document.querySelector('#selection-properties');
    metadata.replaceChildren();
    for (const [label, value] of [['Localité', p.localite], ['Commune', p.commune], ['Catégorie', p.categorie], ['Référence RBC', p.rbc_no], ['Datation', p.datation]]) {
      if (typeof value !== 'string' || !value.trim()) continue;
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      metadata.append(dt, dd);
    }
    const link = document.querySelector('#selection-pdf');
    const url = officialPdfUrl(p.url_pdf);
    const unavailable = linkCheck?.sourceUrl === p.url_pdf && (linkCheck.status !== 200 || !linkCheck.pdf);
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', String(!url || unavailable));
    if (url && !unavailable) link.href = url;
    document.querySelector('#selection-link-status').textContent = !url ? 'Lien de fiche officielle absent ou inutilisable.'
      : unavailable ? 'La fiche officielle était indisponible lors du dernier contrôle. Réessayez sur le site du canton plus tard.'
        : 'PDF sur le site du canton · connexion nécessaire. Si la fiche ne s’ouvre pas, réessayez plus tard.';
    document.querySelector('#selection-extra').hidden = false;
    document.querySelector('#selection-credit').textContent = layerConfig.heritage.credit;
    selectionPanel.classList.add('is-heritage');
    selectionPanel.hidden = false;
    document.querySelector('#selection-content').scrollTop = 0;
    if (phoneLayout.matches) { controlsUsed = true; setControlsExpanded(false); }
  }
  function updateCantonCredit() {
    const compact=document.querySelector('#basel-active-credit');
    if(compact){const parkingOn=document.querySelector('#parking').checked,transportOn=document.querySelector('#transport').checked;
      compact.hidden=!parkingOn&&!transportOn;compact.querySelector('[data-compact-layer="parking"]').hidden=!parkingOn;compact.querySelector('[data-compact-layer="transport"]').hidden=!transportOn;
      document.querySelector('#basel-credit-separator').hidden=!(parkingOn&&transportOn);
    }
    const credits = document.querySelector('#heritage-credit');
    credits.hidden = !territory.layers.some(layer => document.querySelector(`#${layer.id}`).checked);
    for (const span of credits.children) {
      const config = layerConfig[span.dataset.layerCredit];
      span.hidden = !territory.layers.some(layer => layer.credit === config.credit && layer.conditions === config.conditions && document.querySelector(`#${layer.id}`).checked);
    }
  }
  if (layerConfig.heritage) heritage = layers.register('heritage', createHeritageLayer(viewer, {
    config: layerConfig.heritage,
    onState: updateCantonCredit,
    getPlace: () => PLACES[activePlace].name,
    onSelect: showHeritage,
    onClear: () => { if (['heritage', 'heritage-group'].includes(selectionKind)) clearSelection(); },
    onGroup: (records) => {
      clearSelection();
      selectionKind = 'heritage-group';
      selectionPanel.classList.add('is-heritage');
      document.querySelector('#selection-title').textContent = `${records.length} lieux regroupés`;
      document.querySelector('#selection-description').textContent = 'Choisissez un lieu ci-dessous pour consulter sa fiche. Le zoom peut séparer les repères ; le groupe dépend des lieux proches à l’écran.';
      document.querySelector('#selection-position').textContent = '';
      const list = document.querySelector('#selection-group');
      for (const record of [...records].sort((a, b) => a.properties.nom.localeCompare(b.properties.nom, 'fr'))) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.heritageId = record.id;
        button.textContent = `${record.properties.nom} · ${record.properties.localite}`;
        button.addEventListener('click', () => heritage.select(record.id));
        list.append(button);
      }
      list.hidden = false;
      document.querySelector('#selection-credit').textContent = layerConfig.heritage.credit;
      selectionPanel.hidden = false;
      document.querySelector('#selection-content').scrollTop = 0;
      if (phoneLayout.matches) { controlsUsed = true; setControlsExpanded(false); }
    },
  }));

  function showBaselTransport(item) {
    clearSelection();selectionKind=`transport-${item.kind}`;selectionPanel.classList.add('is-heritage');
    const p=item.feature.properties,d=item.display;
    document.querySelector('#selection-title').textContent=d.name;
    document.querySelector('#selection-description').textContent=item.kind==='stop'
      ? 'Quai / point d’arrêt dans un sens donné. Les attributs d’accès sont ceux de la source, sans vérification sur place. Aucun départ en direct.'
      : 'Tracé du réseau statique, avec sens et offre source. Plusieurs tracés peuvent représenter une même ligne commerciale ; aucun véhicule suivi en direct.';
    const position=item.kind==='stop'?item.feature.geometry.coordinates[0]:null;
    document.querySelector('#selection-position').textContent=position?`${position[1].toFixed(5)}° N · ${position[0].toFixed(5)}° E · position source du quai`:'Géométrie de tracé, pas une position de véhicule.';
    const pairs=item.kind==='stop'?
      [['ID quai source',p.thst_nr],['Pôle d’arrêt source',p.hst_nr],['Sens / destination',p.richtung],['Type source',p.typ],['Catégorie source',p.art],
       ['Trams',d.tramLines.join(', ')],['Bus',d.busLines.join(', ')],['Lignes nocturnes',d.nightLines.join(', ')],['Accès tram · source',p.tramzugang],['Accès bus · source',p.buszugang]]:
      [['ID tracé source',p.l_nr],['Numéro de ligne',p.liniennmr],['Mode source',p.fahrzeug],['Sens source',p.hinrueck],['Opérateur source',p.tu],['Offre source',d.offer.join(', ')]];
    pairs.push(['Date annoncée au catalogue',d.sourceDate?new Date(d.sourceDate).toLocaleDateString('fr-CH',{timeZone:'Europe/Zurich'}):null]);
    const properties=document.querySelector('#transport-properties');properties.replaceChildren();
    for(const[label,value]of pairs){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value===null||value===undefined||!String(value).trim()?'Non renseigné':String(value);properties.append(dt,dd);}
    const links=document.querySelector('#transport-links');
    for(const[url,label]of[[BASEL_TIMETABLE,'Horaires officiels · choisir l’arrêt'],[BASEL_NETWORK,'Plans du réseau · BVB']]){
      const a=document.createElement('a');a.className='selection-link';a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;links.append(a);
    }
    if(d.sourceUrl&&!BASEL_OLD_LINKS.includes(d.sourceUrl)){
      const a=document.createElement('a');a.className='selection-link';a.href=d.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Lien horaire fourni par la source';links.append(a);
    }
    document.querySelector('#transport-link-status').textContent=(d.sourceUrl&&BASEL_OLD_LINKS.includes(d.sourceUrl)?'Ancien lien source indisponible au contrôle du 26.10.2026. ':'')
      +'Les pages officielles ci-dessus sont générales : cherchez le nom de l’arrêt ou le numéro de ligne. Aucun préremplissage ou départ actuel promis.';
    document.querySelector('#selection-transport').hidden=false;document.querySelector('#selection-credit').textContent=layerConfig.transport.credit;
    selectionPanel.hidden=false;document.querySelector('#selection-content').scrollTop=0;
    if(phoneLayout.matches){controlsUsed=true;setControlsExpanded(false);}
  }
  function showTransport(item, checks) {
    if(item.display)return showBaselTransport(item);
    clearSelection();
    selectionKind = `transport-${item.kind}`;
    selectionPanel.classList.add('is-heritage');
    const p = item.feature.properties;
    const title = item.kind === 'stop' ? p.nomarret : item.kind === 'line' ? p.nomcadrehoraire : p.nom_zone;
    document.querySelector('#selection-title').textContent = title?.trim() || (item.kind === 'stop' ? 'Arrêt de bus' : item.kind === 'line' ? 'Tracé de bus' : 'Zone Noctambus');
    document.querySelector('#selection-description').textContent = item.kind === 'zone'
      ? p.remarques?.trim() || 'Zone de desserte Noctambus, distincte d’un tracé de ligne.'
      : item.kind === 'line' ? 'Tracé statique fourni par le canton. Plusieurs tronçons peuvent partager un cadre horaire ; aucun véhicule suivi en direct.'
        : 'Arrêt du réseau statique. Consultez les sites officiels pour les horaires et changements ; aucun départ en direct affiché sur cette carte.';
    const position = item.kind === 'stop' ? item.feature.geometry.coordinates[0] : null;
    document.querySelector('#selection-position').textContent = position
      ? `${position[1].toFixed(5)}° N · ${position[0].toFixed(5)}° E · position source de l’arrêt`
      : item.kind === 'line' ? 'Géométrie d’un tracé, pas une position de véhicule.' : 'Emprise de zone, pas une ligne ou un véhicule.';
    const pairs = item.kind === 'stop'
      ? [['ID arrêt source', p.idarret], ['Jour', p.arret_jour], ['Nuit', p.arret_nocturne], ['Exploitation source', p.refetatexploitation]]
      : item.kind === 'line' ? [['Cadre horaire', p.idcadrehoraire], ['Opérateur source', p.sigleetc], ['Jour', p.ligne_jour], ['Nuit', p.ligne_nocturne]]
        : [['Zone source', p.nom_zone]];
    pairs.push(['Données', layerConfig.transport.date]);
    const properties = document.querySelector('#transport-properties'); properties.replaceChildren();
    for (const [label, value] of pairs) {
      const dt = document.createElement('dt'); dt.textContent = label;
      const dd = document.createElement('dd'); dd.textContent = value === null || value === undefined || String(value).trim() === '' ? 'Non renseigné' : String(value);
      properties.append(dt, dd);
    }
    const fields = item.kind === 'stop'
      ? [['urlhorairepassage', 'Horaires de cet arrêt · CarPostal'], ['urlhoraireorigine', 'CFF · lien source de départ'], ['urlhorairedestination', 'CFF · lien source de destination']]
      : item.kind === 'line' ? [['urlcadrehoraire', 'Ouvrir le cadre horaire officiel PDF']] : [['horaire', 'Horaires officiels de cette zone Noctambus']];
    const links = document.querySelector('#transport-links'); const notes = [];
    for (const [field, label] of fields) {
      let url = officialTransportUrl(p[field], field);
      if (field === 'urlhorairepassage' && url && new URL(url).searchParams.get('hid') !== String(p.idarret)) url = null;
      const check = checks.get(`${item.feature.id}:${field}`);
      const unavailable = [404, 410].includes(check?.status) || (field === 'urlcadrehoraire' && check?.status === 200 && !check.pdf);
      const link = document.createElement('a'); link.className = 'selection-link'; link.dataset.field = field; link.textContent = label;
      if (url && !unavailable) { link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      else { link.setAttribute('aria-disabled', 'true'); notes.push(`${label} : ${unavailable ? 'indisponible lors du contrôle' : 'lien absent ou inutilisable dans la source'}.`); }
      if (url && field === 'urlhorairepassage' && check?.status === 403 && !check?.browser?.stopNameVisible) notes.push('Accès CarPostal refusé au contrôle automatisé ; essayez le lien dans votre navigateur.');
      links.append(link);
    }
    if (item.kind === 'stop') notes.push('Les liens CFF sont ceux de la source ; préremplissage non confirmé. Vérifiez l’arrêt dans l’horaire ouvert.');
    notes.push('Liens externes dépendants du réseau ; dates et disponibilité à vérifier sur le site officiel.');
    document.querySelector('#transport-link-status').textContent = notes.join(' ');
    document.querySelector('#selection-transport').hidden = false;
    document.querySelector('#selection-credit').textContent = layerConfig.transport.credit;
    selectionPanel.hidden = false; document.querySelector('#selection-content').scrollTop = 0;
    if (phoneLayout.matches) { controlsUsed = true; setControlsExpanded(false); }
  }
  if (layerConfig.transport) transport = layers.register('transport', createTransportLayer(viewer, {
    config: layerConfig.transport,
    getPlace: () => PLACES[activePlace], onState: updateCantonCredit, onSelect: showTransport,
    onClear: () => { if (selectionKind?.startsWith('transport-')) clearSelection(); },
    onGroup: (items, kind) => {
      clearSelection(); selectionKind = 'transport-group'; selectionPanel.classList.add('is-heritage');
      document.querySelector('#selection-title').textContent = kind === 'line' ? `${items.length} tracés sous le clic` : `${items.length} ${layerConfig.transport.kind==='basel-transit'?'quais':'arrêts'} regroupés`;
      document.querySelector('#selection-description').textContent = kind === 'line' ? 'Plusieurs tracés se superposent dans la vue. Choisissez celui dont vous souhaitez consulter le cadre horaire.' : 'Choisissez un arrêt pour consulter sa fiche et ses liens horaires.';
      document.querySelector('#selection-position').textContent = '';
      const list = document.querySelector('#selection-group');
      const itemName = (item) => item.display?.name ?? (kind === 'line' ? item.feature.properties.nomcadrehoraire : item.feature.properties.nomarret)?.trim() ?? 'Nom non fourni';
      for (const item of [...items].sort((a, b) => itemName(a).localeCompare(itemName(b), 'fr'))) {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.transportId = item.feature.id;
        button.textContent = `${kind === 'line' ? (item.display ? `Réf. source ${item.feature.properties.l_nr} · ` : `Tracé ${item.feature.properties.id} · `) : ''}${itemName(item)}`; button.addEventListener('click', () => transport.select(item.feature.id)); list.append(button);
      }
      list.hidden = false; document.querySelector('#selection-credit').textContent = layerConfig.transport.credit;
      selectionPanel.hidden = false; document.querySelector('#selection-content').scrollTop = 0;
      if (phoneLayout.matches) { controlsUsed = true; setControlsExpanded(false); }
    },
  }));

  function showParking(record, metadata, updateOnly = false) {
    if (updateOnly && (selectionKind !== 'parking' || selectionPanel.hidden)) return;
    if (!updateOnly) { clearSelection(); selectionKind = 'parking'; }
    document.querySelector('#selection-title').textContent = record.name;
    document.querySelector('#selection-description').textContent = record.address || 'Adresse non fournie.';
    document.querySelector('#selection-position').textContent = `${record.latitude.toFixed(5)}° N · ${record.longitude.toFixed(5)}° E · position fournie par le service`;
    const freshness = parkingFreshness(record, Date.now(), layerConfig.parking.staleMs);
    const note = metadata.failed ? 'Actualisation indisponible · dernière observation conservée.'
      : freshness === 'stale' ? 'Observation ancienne · disponibilité actuelle inconnue.'
        : freshness === 'unknown' ? 'Date d’observation absente ou incohérente · disponibilité actuelle inconnue.' : 'Observation récente · la disponibilité peut changer.';
    const freshnessElement = document.querySelector('#parking-freshness');
    freshnessElement.textContent = note; freshnessElement.dataset.freshness = freshness;
    const properties = document.querySelector('#parking-properties'); properties.replaceChildren();
    for (const [label,value] of [['Places libres au relevé',record.free],['Capacité fournie',record.total],
      ['État au relevé',({offen:'Ouvert',geschlossen:'Fermé'})[record.status] ?? record.status],['Observation',parkingDate(record.observedAt)],['Dernière lecture du service',parkingDate(metadata.fetchedAt)]]) {
      const dt = document.createElement('dt'); const dd = document.createElement('dd');dt.textContent = label;
      dd.textContent = value === null || value === '' ? 'Non renseigné' : String(value);properties.append(dt,dd);
    }
    const link = document.querySelector('#parking-link');link.removeAttribute('href');link.setAttribute('aria-disabled',String(!record.url));
    if (record.url) link.href = record.url;
    document.querySelector('#parking-catalog').href = layerConfig.parking.catalog;
    document.querySelector('#selection-parking').hidden = false;
    document.querySelector('#selection-credit').textContent = layerConfig.parking.credit;
    selectionPanel.classList.add('is-heritage'); selectionPanel.hidden = false;
    if (!updateOnly) {
      document.querySelector('#selection-content').scrollTop = 0;
      if (phoneLayout.matches) { controlsUsed = true; setControlsExpanded(false); }
    }
  }
  if (layerConfig.parking) parking = layers.register('parking', createParkingLayer(viewer, {
    config: layerConfig.parking, onSelect: showParking, onState: updateCantonCredit,
    onClear: () => { if (selectionKind === 'parking') clearSelection(); },
  }));

  function selectAt(position) {
    const picked = viewer.scene.pick(position);
    if (layers.pick(picked, position)) return;
    clearSelection();
    const isBuilding = picked instanceof Cesium3DTileFeature && picked.tileset === buildings;
    let world;
    if (isBuilding && viewer.scene.pickPositionSupported) world = viewer.scene.pickPosition(position);
    if (!world) world = viewer.scene.globe.pick(viewer.camera.getPickRay(position), viewer.scene);
    let title = 'Aucun objet sélectionnable';
    let description = 'Touchez un bâtiment ou un point sur la carte. Aucune donnée de lieu disponible ici.';
    if (isBuilding) {
      selectedFeature = picked;
      originalColor = Color.clone(picked.color);
      picked.color = Color.YELLOW.withAlpha(.85);
      const name = ['NAME_KOMPLETT', 'name', 'Name', 'NAME', 'nom', 'NOM']
        .map((key) => picked.getProperty(key)).find((value) => typeof value === 'string' && value.trim());
      const egid = picked.getProperty('EGID') ?? picked.getProperty('egid');
      const address = (territory.sources.buildings.addressFields ?? []).map(key => picked.getProperty(key))
        .filter(value => typeof value === 'string' && value.trim()).map(value => value.trim().slice(0, 160));
      title = name ? name.trim() : 'Bâtiment 3D';
      description = name ? `Nom fourni par les données ${territory.sources.buildings.attributionName ?? 'swisstopo'}.`
        : address.length ? 'Nom de lieu non fourni par le modèle.' : 'Nom et adresse non fournis par les données de cet objet.';
      if (address.length) description += ` Adresse source : ${address.join(', ')}.`;
      if (egid !== undefined && egid !== null && String(egid).trim() && String(egid) !== '0') {
        description += ` EGID fourni : ${String(egid).slice(0, 80)}.`;
      }
      selectionKind = 'building';
      document.querySelector('#selection-credit').textContent = territory.sources.buildings.credit;
    } else if (world) {
      title = 'Point sur la carte';
      description = 'Position choisie sur le terrain. Aucun nom de lieu ni fiche disponible.';
      selectionKind = 'point';
    } else selectionKind = 'empty';
    document.querySelector('#selection-title').textContent = title;
    document.querySelector('#selection-description').textContent = description;
    const cartographic = world ? Cartographic.fromCartesian(world) : null;
    document.querySelector('#selection-position').textContent = cartographic
      ? `${CesiumMath.toDegrees(cartographic.latitude).toFixed(5)}° N · ${CesiumMath.toDegrees(cartographic.longitude).toFixed(5)}° E`
      : '';
    selectionPanel.hidden = false;
  }
  viewer.screenSpaceEventHandler.setInputAction((event) => selectAt(event.position), ScreenSpaceEventType.LEFT_CLICK);
  document.querySelector('#clear-selection').addEventListener('click', clearSelection);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') clearSelection(); });

  updateCantonCredit();
  addEventListener('pagehide', (event) => { if (!event.persisted) layers.destroy(); });
  if (probeParameters.has('probe')) {
    window.__jura3dLayers = layers;
    window.__jura3dParking = () => parking?.snapshot();
    window.__jura3dParkingTarget = id => parking?.target(id);
    window.__jura3dBuildings = () => ({ url: territory.sources.buildings.url, credit: territory.sources.buildings.credit,
      clipBounds: territory.sources.buildings.clipBounds ?? null, inverse: buildings?.clippingPolygons?.inverse ?? null });
    window.__jura3dTerritory = () => ({ id: territory.id, places: Object.keys(PLACES), layers: territory.layers.map(l => l.id) });
    window.__jura3dHeritage = () => heritage?.snapshot();
    window.__jura3dHeritageTarget = (id) => heritage?.target(id);
    window.__jura3dHeritageGroupTarget = () => heritage?.groupTarget();
    window.__jura3dTransport = () => ({ ...transport?.snapshot(), focusing: transport?.focusing() });
    window.__jura3dTransportTarget = (id) => transport?.target(id);
    window.__jura3dTransportGroupTarget = () => transport?.groupTarget();
    // Diagnostic local : statistiques privées vérifiées avec Cesium 1.145,
    // passe RENDER (0), bâtiments seuls, sans compter les passes d'ombres.
    window.__jura3dPerformance = (options = {}) => {
      if (typeof options.shadows === 'boolean') {
        viewer.shadows = options.shadows;
        shadowsToggle.checked = options.shadows;
      }
      if (typeof options.softShadows === 'boolean') viewer.shadowMap.softShadows = options.softShadows;
      if (Number.isFinite(options.screenSpaceError) && options.screenSpaceError >= 4 && options.screenSpaceError <= 128 && buildings) {
        buildings.maximumScreenSpaceError = options.screenSpaceError;
        loadingSince = performance.now();
      }
      if ([1, 4].includes(options.msaaSamples)) viewer.scene.msaaSamples = options.msaaSamples;
      if ([.6, .75, 1, 1.5].includes(options.resolutionScale)) viewer.resolutionScale = options.resolutionScale;
      if (typeof options.lockCamera === 'boolean') cameraController.enableInputs = !options.lockCamera;
      if (['enabled', 'cast', 'disabled'].includes(options.buildingShadows) && buildings) {
        buildings.shadows = { enabled: ShadowMode.ENABLED, cast: ShadowMode.CAST_ONLY, disabled: ShadowMode.DISABLED }[options.buildingShadows];
      }
      if (Number.isFinite(options.range) && options.range >= 500 && options.range <= 10000) {
        clearSelection();
        const place = PLACES[territory.initialPlace];
        viewer.camera.lookAt(Cartesian3.fromDegrees(place.longitude, place.latitude, place.elevation),
          new HeadingPitchRange(CesiumMath.toRadians(10), CesiumMath.toRadians(-38), options.range));
        viewer.camera.lookAtTransform(Matrix4.IDENTITY);
        loadingSince = performance.now();
      }
      viewer.scene.requestRender();
      const statistics = buildings?.show ? buildings._statisticsPerPass?.[0] : null;
      return {
        shadows: viewer.shadows, softShadows: viewer.shadowMap.softShadows,
        buildingShadowMode: buildings?.shadows,
        screenSpaceError: buildings?.maximumScreenSpaceError,
        msaaSamples: viewer.scene.msaaSamples, resolutionScale: viewer.resolutionScale,
        tiles: statistics?.selected ?? 0, triangles: statistics?.numberOfTrianglesSelected ?? 0,
        features: statistics?.numberOfFeaturesSelected ?? 0, commands: statistics?.numberOfCommands ?? 0,
        buildingMemoryBytes: buildings?.totalMemoryUsageInBytes ?? 0,
        canvas: { width: viewer.scene.canvas.width, height: viewer.scene.canvas.height },
      };
    };
    window.__jura3dCamera = () => ({
      heading: viewer.camera.heading, pitch: viewer.camera.pitch,
      height: viewer.camera.positionCartographic.height,
      longitude: CesiumMath.toDegrees(viewer.camera.positionCartographic.longitude),
      latitude: CesiumMath.toDegrees(viewer.camera.positionCartographic.latitude),
      time: JulianDate.toIso8601(viewer.clock.currentTime),
      imageryMaximumLevel: imageryLayer.imageryProvider.maximumLevel,
      activePlace, flyingTo, buildingsShown: buildings?.show ?? false,
      shadowsShown: viewer.shadows,
      quality: { mode: qualitySelect.value, profile: qualityProfile, measuring: autoMeasuring, measuredFps: autoMeasuredFps,
        gpu: gpuRenderer, dedicatedGpuHint, history: autoHistory },
      selectionKind, terrainReady, buildingsLoaded: buildings?.tilesLoaded ?? false,
      globeLoaded: viewer.scene.globe.tilesLoaded,
    });
    // Cible réelle pour un clic Playwright ; aucun faux objet n'est créé.
    window.__jura3dBuildingTarget = () => {
      const canvas = viewer.scene.canvas;
      for (let y = canvas.clientHeight * .3; y < canvas.clientHeight * .85; y += 18) {
        for (let x = canvas.clientWidth * .1; x < canvas.clientWidth * .9; x += 18) {
          if (document.elementFromPoint(x, y) !== canvas) continue;
          const picked = viewer.scene.pick(new Cartesian2(x, y));
          if (picked instanceof Cesium3DTileFeature && picked.tileset === buildings) {
            return { x, y, properties: picked.getPropertyIds().map((key) => ({ key, value: picked.getProperty(key) })) };
          }
        }
      }
      return null;
    };
  }
  loadImagery();
  void loadTerrain();
  void loadBuildings();
  setInterval(updateStatus, 300);
}
