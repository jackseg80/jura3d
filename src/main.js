import {
  Cartesian3,
  CameraEventType,
  Cesium3DTileset,
  CesiumTerrainProvider,
  ImageryLayer,
  JulianDate,
  Math as CesiumMath,
  MouseButton,
  Rectangle,
  ShadowMode,
  ScreenSpaceTiltOrbitCameraController,
  Terrain,
  UrlTemplateImageryProvider,
  Viewer,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './style.css';

const TERRAIN_URL = 'https://3d.geo.admin.ch/ch.swisstopo.terrain.3d/v1/';
const BUILDINGS_URL = 'https://3d.geo.admin.ch/ch.swisstopo.swissbuildings3d.3d/v1/tileset.json';
const MAP_URLS = {
  aerial: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg',
  topo: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
};
const MAX_IMAGERY_LEVEL = { aerial: 20, topo: 18 };

const status = document.querySelector('#status');
const datetime = document.querySelector('#datetime');
const timeSlider = document.querySelector('#time-slider');
const timeValue = document.querySelector('#time-value');
const buildingsToggle = document.querySelector('#buildings');
const basemap = document.querySelector('#basemap');
let terrainReady = false;
let buildingsReady = false;
let loadError = null;

function updateStatus() {
  if (loadError) {
    status.textContent = loadError;
  } else if (terrainReady && buildingsReady) {
    status.textContent = 'Scène 3D prête.';
  } else if (terrainReady) {
    status.textContent = 'Relief chargé. Bâtiments en chargement…';
  } else {
    status.textContent = 'Chargement du relief et des bâtiments…';
  }
}

function createImageryLayer(kind) {
  return new ImageryLayer(new UrlTemplateImageryProvider({
    url: MAP_URLS[kind],
    credit: '© swisstopo',
    rectangle: Rectangle.fromDegrees(5.6, 45.5, 11.0, 48.2),
    maximumLevel: MAX_IMAGERY_LEVEL[kind],
  }));
}

let imageryLayer = createImageryLayer(basemap.value);

const terrain = new Terrain(CesiumTerrainProvider.fromUrl(TERRAIN_URL, {
  requestVertexNormals: true,
}));

const viewer = new Viewer('cesiumContainer', {
  baseLayer: imageryLayer,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  animation: false,
  timeline: false,
  infoBox: false,
  selectionIndicator: false,
  navigationHelpButton: false,
  fullscreenButton: false,
  terrain,
  shadows: true,
  terrainShadows: ShadowMode.ENABLED,
});

const cameraController = viewer.scene.screenSpaceCameraController;
cameraController.zoomEventTypes = [CameraEventType.WHEEL, CameraEventType.PINCH];
viewer.addController(new ScreenSpaceTiltOrbitCameraController({
  dragInputs: [{ button: MouseButton.RIGHT }],
}));

if (new URLSearchParams(location.search).has('probe')) {
  window.__jura3dCamera = () => ({
    heading: viewer.camera.heading,
    pitch: viewer.camera.pitch,
    height: viewer.camera.positionCartographic.height,
    time: JulianDate.toIso8601(viewer.clock.currentTime),
    imageryMaximumLevel: imageryLayer.imageryProvider.maximumLevel,
  });
}

viewer.scene.globe.enableLighting = true;
viewer.clock.shouldAnimate = false;
viewer.camera.setView({
  destination: Cartesian3.fromDegrees(7.345, 47.34, 2400),
  orientation: {
    heading: CesiumMath.toRadians(10),
    pitch: CesiumMath.toRadians(-38),
  },
});

basemap.addEventListener('change', () => {
  viewer.imageryLayers.remove(imageryLayer, true);
  imageryLayer = createImageryLayer(basemap.value);
  viewer.imageryLayers.add(imageryLayer, 0);
  viewer.scene.requestRender();
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

datetime.addEventListener('change', () => {
  syncSliderFromDatetime();
  updateTime();
});
timeSlider.addEventListener('input', () => {
  const minutes = Number(timeSlider.value);
  const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  datetime.value = `${datetime.value.split('T')[0]}T${time}`;
  timeValue.value = time;
  updateTime();
});
syncSliderFromDatetime();
updateTime();

terrain.readyEvent.addEventListener(() => {
  terrainReady = true;
  updateStatus();
});
terrain.errorEvent.addEventListener((error) => {
  loadError = `Erreur de relief : ${error.message ?? error}`;
  updateStatus();
  console.error('Terrain swisstopo', error);
});

try {
  const buildings = await Cesium3DTileset.fromUrl(BUILDINGS_URL, {
    maximumScreenSpaceError: 16,
  });
  buildings.shadows = ShadowMode.ENABLED;
  buildings.show = buildingsToggle.checked;
  buildings.initialTilesLoaded.addEventListener(() => {
    buildingsReady = true;
    updateStatus();
  });
  viewer.scene.primitives.add(buildings);
  buildingsToggle.addEventListener('change', () => {
    buildings.show = buildingsToggle.checked;
    viewer.scene.requestRender();
  });
  updateStatus();
} catch (error) {
  loadError = `Erreur de bâtiments : ${error.message ?? error}`;
  updateStatus();
  console.error('Bâtiments swisstopo', error);
}
