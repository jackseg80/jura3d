// Native GeoBS records remain separate from display labels and filtering.
export const BASEL_PLACE_DATASETS = [
  { key: 'culture', product: 'BIPO', collection: 'ch.bs.basel_info_points_of_interest_bipo.kultur_unterhaltung', label: 'Culture et spectacles' },
  { key: 'sights', product: 'BIPO', collection: 'ch.bs.basel_info_points_of_interest_bipo.sehenswuerdigkeiten', label: 'Points d’intérêt' },
  { key: 'landmarks', product: 'BIFO', collection: 'ch.bs.basel_info_bifo.landmark', label: 'Repères remarquables' },
];
const categories = {
  'Museen, Ausstellungen, Sammlungen': 'Musées, expositions et collections',
  'Konzerte, Theater, Vorträge': 'Concerts, théâtres et conférences',
  Aussichtspunkte: 'Points de vue', Mittelpunkt_BS: 'Centre du canton',
  Brunnen: 'Fontaines remarquables', Rheinfähren: 'Bacs du Rhin',
  'Archäologische Fundstellen': 'Sites archéologiques',
};
const text = value => typeof value === 'string' ? value.trim() : '';
export function baselPlaceUrl(value) {
  try {
    const u = new URL(value);
    return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password && !u.port ? u.href : null;
  } catch { return null; }
}
export function parseBaselPlaces(features, dataset, bounds) {
  const ids = new Set(), [w, s, e, n] = bounds;
  return features.map(feature => {
    const p = feature?.properties, point = feature?.geometry?.coordinates;
    if (feature?.type !== 'Feature' || !['string', 'number'].includes(typeof feature.id)
      || !String(feature.id).trim() || ids.has(String(feature.id)) || !text(p?.Name)
      || feature.geometry?.type !== 'Point' || !Array.isArray(point) || point.length !== 2
      || !point.every(Number.isFinite) || point[0] < w || point[0] > e || point[1] < s || point[1] > n)
      throw new Error('Lieu GeoBS invalide ou identifiant dupliqué');
    ids.add(String(feature.id));
    return { id: `${dataset.key}:${feature.id}`, feature, dataset: dataset.key, product: dataset.product,
      display: { name: text(p.Name), category: dataset.key === 'landmarks' ? dataset.label : (Object.hasOwn(categories, p.Subkategorie) ? categories[p.Subkategorie] : (text(p.Subkategorie) || dataset.label)),
        description: text(p.Beschreibung), address: [text(p.Strasse), text(p.Ort)].filter(Boolean).join(', '),
        url: baselPlaceUrl(p.Link), source: `https://api.geo.bs.ch/geometa/v1/metadata_details/dataset/published/html/${dataset.product}` } };
  });
}
export { placeDistanceMeters } from './point-geometry.js';
export async function loadBaselPlaces(config, signal, fetcher = fetch) {
  const json = async url => { const r = await fetcher(url, { signal }); if (!r.ok) throw new Error(`Lieux : HTTP ${r.status}`); return r.json(); };
  const licenses = await Promise.all(['BIPO', 'BIFO'].map(async id => {
    const meta = await json(`https://api.geo.bs.ch/stac/v1/collections/${id}`);
    if (meta.id !== id || meta.license !== 'CC-BY-4.0') throw new Error('Conditions des lieux modifiées : contrôle requis');
    return { id, license: meta.license };
  }));
  const sources = await Promise.all(BASEL_PLACE_DATASETS.map(async dataset => {
    let features = [], count;
    do {
      const page = await json(`https://api.geo.bs.ch/ogc/v1/wfs3/collections/${dataset.collection}/items.json?limit=1000&offset=${features.length}`);
      count ??= page.numberMatched;
      if (page.type !== 'FeatureCollection' || !Number.isInteger(count) || count < 0 || count > 5000
        || page.numberMatched !== count || !Array.isArray(page.features) || page.numberReturned !== page.features.length
        || page.features.length !== Math.min(1000, count - features.length)) throw new Error('Réponse lieux incomplète ou incohérente');
      features.push(...page.features);
    } while (features.length < count);
    return { dataset: dataset.key, count, records: parseBaselPlaces(features, dataset, config.bounds) };
  }));
  return { records: sources.flatMap(s => s.records), counts: Object.fromEntries(sources.map(s => [s.dataset, s.count])), licenses, fetchedAt: Date.now() };
}
