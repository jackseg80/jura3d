// Pas de dépendance Cesium : configuration lisible aussi par les contrôles Node.
export function validateTerritory(territory) {
  const fail = (message) => { throw new Error(`Configuration territoriale : ${message}`); };
  const finite = (...values) => values.every(Number.isFinite);
  const position = (p) => p && finite(p.longitude, p.latitude) && Math.abs(p.longitude) <= 180 && Math.abs(p.latitude) <= 90;
  if (!territory?.id || !territory.title || !territory.label || !territory.description) fail('identité absente');
  if (!territory.places?.[territory.initialPlace]) fail('destination initiale absente');
  for (const [id, place] of Object.entries(territory.places)) {
    if (!/^[a-z0-9-]+$/.test(id) || !place.name || !position(place) || !finite(place.elevation)) fail('destination invalide');
  }
  const view = territory.initialView;
  if (!position(view) || !finite(view.height, view.heading, view.pitch) || view.height <= 0) fail('vue initiale invalide');
  const sources = territory.sources;
  const remote = (url) => { try { const u = new URL(url); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; } };
  if (!remote(sources?.terrain?.url) || !remote(sources?.buildings?.url) || !sources.credit || !sources.buildings.credit) fail('sources 3D invalides');
  if (!sources.maps?.aerial || !Object.keys(sources.maps).length) fail('fond initial absent');
  for (const map of Object.values(sources.maps)) {
    if (!remote(map.url) || !map.label || !Number.isInteger(map.maximumLevel) || map.maximumLevel < 0) fail('fond invalide');
  }
  const bounds = (b) => Array.isArray(b) && b.length === 4 && finite(...b) && b[0] < b[2] && b[1] < b[3];
  if (!bounds(sources.imageryRectangle)) fail('emprise du fond invalide');
  if (!Array.isArray(territory.layers) || new Set(territory.layers.map(l => l.id)).size !== territory.layers.length) fail('couches dupliquées ou absentes');
  const safePath = (p) => typeof p === 'string' && /^[a-zA-Z0-9_./-]+$/.test(p) && !p.startsWith('/') && !p.split('/').includes('..');
  for (const layer of territory.layers) {
    if (layer.id === 'transport' && ![undefined, 'ground-polyline', 'terrain-imagery'].includes(layer.lineRenderer)) fail('rendu des tracés invalide');
    if(layer.kind==='basel-transit'){
      if(layer.id!=='transport'||!layer.sourceName||!layer.credit||!remote(layer.conditions)||!bounds(layer.bounds)
        ||JSON.stringify(layer.datasets)!==JSON.stringify([{id:'100064',order:'l_nr'},{id:'100065',order:'thst_nr'}])
        ||!Array.isArray(layer.licenses)||layer.licenses.length!==2||layer.licenses.some(l=>!l.label||!remote(l.url)))fail('configuration transports Bâle invalide');
      continue;
    }
    if (layer.kind === 'basel-parking') {
      if (layer.id !== 'parking' || !remote(layer.url) || !remote(layer.catalog) || !remote(layer.conditions)
        || !layer.credit || !bounds(layer.bounds) || !Number.isFinite(layer.refreshMs) || layer.refreshMs < 60000
        || !Number.isFinite(layer.staleMs) || layer.staleMs < layer.refreshMs) fail('configuration parkings invalide');
      continue;
    }
    if (!['jura-heritage', 'jura-transport'].includes(layer.kind) || layer.id !== (layer.kind === 'jura-heritage' ? 'heritage' : 'transport')) fail('adaptateur de couche inconnu');
    if (!safePath(layer.base) || !safePath(layer.checksSource) || !safePath(layer.conditions) || !layer.credit || !layer.sourceName || !bounds(layer.bounds)) fail('source de couche invalide');
    if (!Array.isArray(layer.files) || layer.files.length !== (layer.id === 'heritage' ? 2 : 4) || !layer.files.every(safePath)) fail('fichiers de couche invalides');
    if (layer.id === 'heritage' && (!Number.isInteger(layer.count) || layer.count <= 0)) fail('effectif patrimoine invalide');
    if (layer.id === 'transport' && (!layer.date || !Array.isArray(layer.specs) || layer.specs.length !== 3
      || layer.specs.some((s, i) => s[0] !== ['stop', 'line', 'zone'][i] || s[1] !== ['MultiPoint', 'MultiLineString', 'MultiPolygon'][i] || !Number.isInteger(s[2]) || s[2] <= 0))) fail('effectifs transports invalides');
  }
  if (sources.buildings.clipBounds && (!bounds(sources.buildings.clipBounds) || !remote(sources.buildings.conditions))) fail('cadre bâtiments invalide');
  if (sources.buildings.addressFields && (!Array.isArray(sources.buildings.addressFields)
    || !sources.buildings.addressFields.every(f => typeof f === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(f)))) fail('champs d’adresse invalides');
  return territory;
}

export function configureTerritoryUi(territory, root = document, base = '/') {
  root.title = `${territory.title} — ${territory.description}`;
  root.querySelector('h1').textContent = territory.title;
  root.querySelector('.controls').setAttribute('aria-label', territory.label);
  root.querySelector('#active-place').textContent = `Destination : ${territory.places[territory.initialPlace].name}`;
  root.querySelector('#home').textContent = `Vue initiale · ${territory.places[territory.initialPlace].name}`;
  const nav = root.querySelector('.destinations'); nav.replaceChildren();
  for (const [id, place] of Object.entries(territory.places)) {
    const button = root.createElement('button'); button.dataset.place = id; button.textContent = place.name;
    button.setAttribute('aria-pressed', String(id === territory.initialPlace)); nav.append(button);
  }
  const maps = root.querySelector('#basemap'); maps.replaceChildren();
  for (const [id, map] of Object.entries(territory.sources.maps)) {
    const option = root.createElement('option'); option.value = id; option.textContent = map.label; maps.append(option);
  }
  maps.value = 'aerial';
  root.querySelector('.credit').textContent = `Données ${territory.sources.credit}`;
  const locality = root.querySelector('#heritage-locality');
  while (locality.options.length > 2) locality.remove(2);
  for (const place of Object.values(territory.places)) {
    const option = root.createElement('option'); option.textContent = place.name; locality.append(option);
  }
  for (const id of ['heritage', 'transport', 'parking']) root.querySelector(`#${id}-settings`).hidden = !territory.layers.some(l => l.id === id);
  const baselTransit=territory.layers.some(l=>l.kind==='basel-transit');
  for(const selector of ['#transport-mode','label[for="transport-mode"]'])root.querySelector(selector).hidden=!baselTransit;
  if(baselTransit){
    root.querySelector('#transport-settings summary').textContent='Tram, bus et horaires';
    root.querySelector('#transport').parentNode.lastChild.textContent=' Afficher les trams et bus';
    root.querySelector('#transport-zones').checked=false;root.querySelector('#transport-zones').closest('label').hidden=true;
    root.querySelector('#transport-lines').checked=false; // Quais d'abord ; tracés activables séparément.
    root.querySelector('#transport-stops').parentNode.lastChild.textContent=' Quais / points d’arrêt';
    root.querySelector('#transport-offer').hidden=true;root.querySelector('label[for="transport-offer"]').hidden=true;
    root.querySelector('#transport-kind option[value="zone"]').remove();
    root.querySelector('#transport-kind option[value="stop"]').textContent='Quai / point d’arrêt';
    root.querySelector('#transport-sector option[value=""]').textContent='Tout le réseau tram/bus fourni';
    root.querySelector('.transport-legend').textContent='Bordeaux : tram ; bleu : bus ; pointillés : tracés nocturnes. T/B : quai mixte, R + nombre : groupe de quais. Les quais d’un même arrêt restent distincts. Secteur ~5 km, tracés découpés à 5,25 km ; le réseau fourni dépasse Bâle. Données statiques, aucune position de véhicule ou perturbation en direct. Les bâtiments restent limités au secteur étudié.';
    const note=root.querySelector('#transport-source-note');note.replaceChildren();
    note.append('Sources : ');
    for(const[id,label]of[['100064','Tracés'],['100065','Quais']]){const a=root.createElement('a');a.href=`https://data.bs.ch/explore/dataset/${id}/`;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';note.append(a,' · ');}
    note.append('CC BY 4.0 + OpenStreetMap (ODbL). La date annoncée au catalogue ne garantit pas la date de chaque tracé ; une lecture récente ne rend pas le réseau actuel.');
  }
  const scope = root.querySelector('#territory-scope');
  scope.hidden = !territory.sources.buildings.scope; scope.textContent = territory.sources.buildings.scope ?? '';
  const buildingCredit = root.querySelector('#buildings-source');
  buildingCredit.hidden = territory.sources.buildings.credit === territory.sources.credit;
  buildingCredit.replaceChildren(); buildingCredit.append(territory.sources.buildings.credit + ' ');
  if (territory.sources.buildings.conditions) {
    const link = root.createElement('a'); link.href = territory.sources.buildings.conditions; link.textContent = 'Conditions';
    link.target = '_blank'; link.rel = 'noopener noreferrer'; buildingCredit.append(link);
  }
  root.querySelector('#heritage-credit').replaceChildren();
  for (const layer of territory.layers.filter((l, i, all) => all.findIndex(x => x.credit === l.credit && x.conditions === l.conditions) === i)) {
    const span = root.createElement('span'); span.dataset.layerCredit = layer.id;
    span.append(`${layer.credit} · `);
    const link = root.createElement('a'); link.href = layer.conditions.startsWith('https://') ? layer.conditions : `${base}${layer.conditions}`; link.textContent = 'Conditions';
    link.target = '_blank'; link.rel = 'noopener noreferrer'; span.append(link); root.querySelector('#heritage-credit').append(span);
    for(const license of layer.licenses??[]){const a=root.createElement('a');a.href=license.url;a.textContent=license.label;a.target='_blank';a.rel='noopener noreferrer';span.append(' · ',a);}
  }
  if(baselTransit){
    // Les attributions restent visibles ; les liens détaillés défilent avec le panneau.
    const details=root.createElement('details');details.id='basel-sources';const summary=root.createElement('summary');summary.textContent='Sources et conditions';
    details.append(summary,buildingCredit,root.querySelector('#heritage-credit'));root.querySelector('#controls-body').append(details);
    const footer=root.querySelector('.data-credits'),canton=root.createElement('span');canton.textContent=' · Quelle: Geodaten Kanton Basel-Stadt';footer.append(canton);
    const active=root.createElement('div');active.id='basel-active-credit';active.hidden=true;
    const parking=root.createElement('span');parking.dataset.compactLayer='parking';parking.textContent='Parkhäuser Basel-Stadt';
    const separator=root.createElement('span');separator.id='basel-credit-separator';separator.textContent=' · ';
    const osm=root.createElement('a');osm.dataset.compactLayer='transport';osm.href='https://www.openstreetmap.org/copyright';osm.textContent='© OpenStreetMap contributors';osm.target='_blank';osm.rel='noopener noreferrer';
    active.append(parking,separator,osm);footer.append(active);root.querySelector('.controls').classList.add('basel-compact-credits');
  }
}
