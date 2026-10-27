export const SANITARY_CATALOG = 'https://data.bs.ch/explore/dataset/100031/';
export const SANITARY_INFO = 'https://www.bs.ch/bvd/tiefbauamt/oeffentliche-toiletten';
const text = value => typeof value === 'string' ? value.trim() : '';
const shown = value => text(value) && text(value) !== '-' ? text(value) : 'Non renseigné';
const types = {'rollstuhlgängig':'WC · accès fauteuil indiqué','nicht rollstuhlgängig':'WC · non adapté selon la source',
  'nur Pissoir':'Urinoirs','Dusche':'Douches','Nette Toilette - nicht rollstuhlgängig':'Toilettes partenaires'};
export function sanitaryUrl(value) { return value === SANITARY_INFO ? value : null; }
export function parseSanitaryRecords(rows, bounds) {
  const ids = new Set(), [w,s,e,n] = bounds;
  return rows.map(native => {
    const p = native?.geo_shape?.geometry, point = native?.geo_point_2d;
    if (!/^[A-Za-z0-9_-]+$/.test(text(native?.id)) || ids.has(native.id) || !text(native.bezeichnung)
      || p?.type !== 'Point' || !Array.isArray(p.coordinates) || p.coordinates.length !== 2 || !p.coordinates.every(Number.isFinite)
      || p.coordinates[0] < w || p.coordinates[0] > e || p.coordinates[1] < s || p.coordinates[1] > n
      || point?.lon !== p.coordinates[0] || point?.lat !== p.coordinates[1]
      || ![true,false,null,undefined].includes(native.eurokey)) throw new Error('Installation sanitaire invalide ou dupliquée');
    for (const key of ['typ','status','kategorie','strasse','plz','ort','zusatz','gebuehr','link'])
      if (native[key] !== null && native[key] !== undefined && typeof native[key] !== 'string') throw new Error('Attribut sanitaire invalide');
    ids.add(native.id);
    const type=text(native.typ),status=text(native.status),tariff=text(native.gebuehr);
    const partner = type.startsWith('Nette Toilette'), closed = status === 'geschlossen';
    const state = status === 'in Betrieb' ? 'Déclaré en service · pas de temps réel' : closed ? 'Fermeture signalée par la source' : shown(native.status);
    const fee = tariff === 'kostenlos' ? 'Gratuit indiqué par la source' : tariff === 'kostenpflichtig' ? 'Payant indiqué · montant non fourni' : shown(native.gebuehr);
    const eurokey = native.eurokey === true ? 'Équipement Eurokey indiqué' : native.eurokey === false ? 'Équipement non indiqué (valeur source : non)' : 'Non renseigné';
    const description = partner ? 'Toilette d’un établissement partenaire « Nette Toilette ». Le canton annonce un accès sans obligation de consommer ; vérifiez les horaires et conditions auprès de l’établissement.'
      : type === 'Dusche' ? 'Douche répertoriée. Le canton annonce un fonctionnement saisonnier des douches du Rhin ; aucun horaire individuel n’est fourni ici.'
        : 'Installation sanitaire répertoriée. Les indications d’équipement et d’accès sont celles de la source ; vérifiez la signalisation sur place.';
    const category = Object.hasOwn(types,type) ? types[type] : shown(native.typ);
    return {id:`sanitary:${native.id}`,native,feature:{type:'Feature',id:native.id,geometry:p,properties:native},
      display:{name:text(native.bezeichnung),category,description,closed,eurokey:native.eurokey??null,
        url:sanitaryUrl(native.link),source:SANITARY_CATALOG,sourceLabel:'Installations sanitaires · Basel-Stadt',
        note:'Données statiques, sans horaire individuel ni ouverture en direct. Les champs peuvent être incomplets ou anciens ; vérifiez l’accès, la signalisation et le tarif sur place.',
        fields:[['Type',category],['État source',state],['Tarif source',fee],['Eurokey',eurokey],
          ['Accès fauteuil (source)',type==='rollstuhlgängig'?'Accès indiqué, sans vérification sur place':type.includes('nicht rollstuhlgängig')?'Non adapté selon la source':'Non renseigné pour ce type'],
          ['Adresse',[text(native.strasse),[text(native.plz),text(native.ort)].filter(Boolean).join(' ')].filter(Boolean).join(', ')||'Non renseignée'],
          ['Installation',native.kategorie==='selbstreinigend'?'Autonettoyante (source)':native.kategorie==='konventionell'?'Conventionnelle (source)':shown(native.kategorie)],
          ['Complément source',shown(native.zusatz)],['Horaires','Non fournis'],['Référence source',native.id]],
      }};
  });
}
export async function loadSanitary(config, signal, fetcher = fetch) {
  const base='https://data.bs.ch/api/explore/v2.1/catalog/datasets/100031';
  const json=async url=>{const r=await fetcher(url,{signal});if(!r.ok)throw new Error(`Sanitaires : HTTP ${r.status}`);return r.json();};
  const meta=await json(base);
  if(meta.metas?.default?.license!=='CC BY 4.0'||meta.metas.default.license_url!=='https://creativecommons.org/licenses/by/4.0/'
    ||!meta.metas.default.attributions?.includes('Geodaten Kanton Basel-Stadt'))throw new Error('Conditions sanitaires modifiées : contrôle requis');
  const first=await json(`${base}/records?limit=100&offset=0&order_by=id`),count=first.total_count;
  if(!Number.isInteger(count)||count<0||count>2500)throw new Error('Effectif sanitaires invalide');
  const pages=[first,...await Promise.all(Array.from({length:Math.max(0,Math.ceil(count/100)-1)},(_,i)=>json(`${base}/records?limit=100&offset=${(i+1)*100}&order_by=id`)))];
  if(pages.some((p,i)=>p.total_count!==count||!Array.isArray(p.results)||p.results.length!==Math.min(100,count-i*100)))throw new Error('Réponse sanitaires incomplète');
  return {records:parseSanitaryRecords(pages.flatMap(p=>p.results),config.bounds),counts:{sanitary:count},fetchedAt:Date.now(),catalogDate:meta.metas.default.modified??null};
}
