// Configuration de non-régression P7, pas une seconde ville publiée.
// Même fournisseur suisse, autre départ et aucune donnée cantonale chargée/livrée.
import jura from './jura.js';
export default {
  id: 'navigation-control', title: 'Contrôle P7', description: 'navigation configurable', label: 'Contrôle territorial',
  initialPlace: 'porrentruy',
  initialView: { longitude: 7.0755, latitude: 47.3956, height: 2400, heading: 10, pitch: -38 },
  places: { porrentruy: jura.places.porrentruy, saignelegier: jura.places.saignelegier },
  sources: jura.sources, layers: [],
};
