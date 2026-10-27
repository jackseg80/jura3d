import jura from './jura.js';
export default {
  id: 'basel', title: 'Bâle 3D', description: 'essai du centre de Bâle', label: 'Explorer Bâle',
  initialPlace: 'basel-centre',
  initialView: { longitude: 7.589, latitude: 47.544, height: 2200, heading: 10, pitch: -38 },
  places: {
    'basel-centre': { name: 'Bâle · centre', longitude: 7.5903, latitude: 47.5575, elevation: 270 },
    'basel-sbb': { name: 'Bâle · gare CFF', longitude: 7.5905, latitude: 47.5485, elevation: 275 },
    'basel-messe': { name: 'Bâle · Messe', longitude: 7.6005, latitude: 47.5635, elevation: 265 },
  },
  sources: {
    ...jura.sources,
    buildings: {
      url: 'https://3d.geo.bs.ch/cesium/tiles/av-gebaeude-basel-stadt/tileset.json',
      credit: 'Quelle: Geodaten Kanton Basel-Stadt', attributionName: 'Basel-Stadt',
      addressFields: ['STR_HAUSNR', 'ORT'],
      conditions: 'https://www.bs.ch/en/node/29871',
      clipBounds: [7.57, 47.54, 7.615, 47.57],
      scope: 'Essai du centre de Bâle : bâtiments limités au cadre étudié, pas au canton entier.',
    },
  },
  layers: [{
    id: 'parking', kind: 'basel-parking', credit: 'Parkhäuser Basel-Stadt · CC BY 4.0',
    conditions: 'https://creativecommons.org/licenses/by/4.0/',
    catalog: 'https://data.bs.ch/explore/dataset/100088/',
    url: 'https://data.bs.ch/api/explore/v2.1/catalog/datasets/100088/records?limit=100',
    refreshMs: 60000, staleMs: 300000, bounds: [7.57,47.54,7.615,47.57],
  },{
    id:'transport',kind:'basel-transit',lineRenderer:'terrain-imagery',sourceName:'Tram et bus · Basel-Stadt',
    credit:'© Geodaten Kanton Basel-Stadt · © OpenStreetMap contributors',
    conditions:'https://data.bs.ch/explore/dataset/100064/',
    licenses:[{label:'CC BY 4.0',url:'https://creativecommons.org/licenses/by/4.0/'},{label:'ODbL',url:'https://www.openstreetmap.org/copyright'}],
    datasets:[{id:'100064',order:'l_nr'},{id:'100065',order:'thst_nr'}],bounds:[5.5,45.5,11,49],
  }],
};
