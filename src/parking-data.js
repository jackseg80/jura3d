export function officialParkingUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname === 'www.parkleitsystem-basel.ch'
      && !u.port && !u.username && !u.password && /^\/parkhaus\/[a-z0-9-]+\/?$/.test(u.pathname)
      && !u.search && !u.hash ? u.href : null;
  } catch { return null; }
}

export function parseParkingResponse(data, bounds) {
  if (!Array.isArray(data?.results) || !Number.isInteger(data.total_count) || data.total_count < 1
    || data.total_count > 100 || data.results.length !== data.total_count) throw new Error('Réponse parkings incomplète');
  const ids = new Set(); const [west,south,east,north] = bounds;
  return data.results.map(p => {
    const point = p.geo_point_2d;
    if (typeof p.id !== 'string' || !p.id || ids.has(p.id) || typeof p.title !== 'string' || !p.title.trim()
      || !Number.isFinite(point?.lon) || !Number.isFinite(point?.lat)
      || point.lon < west || point.lon > east || point.lat < south || point.lat > north) throw new Error('Parking invalide');
    ids.add(p.id);
    const count = value => Number.isInteger(value) && value >= 0 ? value : null;
    const total = count(p.total); let free = count(p.free);
    if (free !== null && total !== null && free > total) free = null;
    // La date de collecte ne remplace jamais l'observation de l'exploitant.
    const observedAt = typeof p.published === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(p.published) ? Date.parse(p.published) : NaN;
    return { id:p.id, name:p.title.trim(), longitude:point.lon, latitude:point.lat,
      free, total, observedAt:Number.isFinite(observedAt)?observedAt:null,
      status:typeof p.status==='string'?p.status:null, address:typeof p.address==='string'?p.address:null,
      url:officialParkingUrl(p.link) };
  });
}

export function parkingFreshness(record, now, staleMs) {
  if (record.observedAt === null || record.observedAt > now + 120000) return 'unknown';
  return now - record.observedAt > staleMs ? 'stale' : 'recent';
}

export function parkingDate(timestamp) {
  return timestamp === null ? 'Non renseignée' : new Intl.DateTimeFormat('fr-CH', {
    dateStyle:'medium',timeStyle:'medium',timeZone:'Europe/Zurich',
  }).format(timestamp) + ' · heure suisse';
}
