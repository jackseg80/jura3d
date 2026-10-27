// Cadrages approximatifs : aucune identité de bâtiment n'en est déduite.
const cantonCredit = '© Géodonnées de la République et Canton du Jura';
export default {
  id: 'jura', title: 'Jura 3D', description: 'explorer le Jura', label: 'Explorer le Jura',
  initialPlace: 'delemont',
  initialView: { longitude: 7.345, latitude: 47.34, height: 2400, heading: 10, pitch: -38 },
  places: {
    delemont: { name: 'Delémont', longitude: 7.3448, latitude: 47.3653, elevation: 435 },
    porrentruy: { name: 'Porrentruy', longitude: 7.0755, latitude: 47.4156, elevation: 425 },
    saignelegier: { name: 'Saignelégier', longitude: 6.9977, latitude: 47.2560, elevation: 980 },
    'saint-ursanne': { name: 'Saint-Ursanne', longitude: 7.1547, latitude: 47.3652, elevation: 440 },
  },
  sources: {
    terrain: { url: 'https://3d.geo.admin.ch/ch.swisstopo.terrain.3d/v1/' },
    buildings: { url: 'https://3d.geo.admin.ch/ch.swisstopo.swissbuildings3d.3d/v1/tileset.json', credit: '© swisstopo' },
    maps: {
      aerial: { label: 'Vue aérienne', url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg', maximumLevel: 20 },
      topo: { label: 'Carte topographique', url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg', maximumLevel: 18 },
    },
    imageryRectangle: [5.6, 45.5, 11.0, 48.2], credit: '© swisstopo',
  },
  layers: [
    { id: 'heritage', kind: 'jura-heritage', credit: cantonCredit, conditions: 'jura/Conditions_utilisation_geodonnees.pdf',
      base: 'jura/', files: ['heritage.geojson', 'heritage-link-checks.json'], checksSource: 'data/jura-heritage-link-checks.json', count: 1159,
      bounds: [6.5, 46.5, 8, 48], sourceName: 'Patrimoine Jura' },
    { id: 'transport', kind: 'jura-transport', lineRenderer: 'terrain-imagery', credit: cantonCredit, conditions: 'jura/Conditions_utilisation_geodonnees.pdf',
      base: 'jura/', files: ['bus-stops.geojson', 'bus-lines.geojson', 'noctambus-zones.geojson', 'transport-link-checks.json'], checksSource: 'data/jura-transport-link-checks.json',
      specs: [['stop', 'MultiPoint', 464], ['line', 'MultiLineString', 140], ['zone', 'MultiPolygon', 2]],
      bounds: [6.5, 46.5, 8, 48], date: '13.09.2026', sourceName: 'Transports Jura' },
  ],
};
