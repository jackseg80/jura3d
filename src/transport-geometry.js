// Display geometry only. Official features/properties and files are never mutated.
export const TRANSPORT_LINE_TOLERANCE_METERS = 1;
export const TRANSPORT_RENDER_RADIUS_METERS = 5250;
const METERS_PER_DEGREE = 111320;

export function projectTransportPoint(point, center) {
  return [(point[0] - center.longitude) * METERS_PER_DEGREE * Math.cos(center.latitude * Math.PI / 180),
    (point[1] - center.latitude) * METERS_PER_DEGREE];
}

function squaredDistanceToSegment(point, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length)) : 0;
  return (point[0] - a[0] - t * dx) ** 2 + (point[1] - a[1] - t * dy) ** 2;
}

export function simplifyTransportLine(line, center, tolerance = TRANSPORT_LINE_TOLERANCE_METERS) {
  if (line.length < 3 || tolerance <= 0) return line.map(point => [...point]);
  const projected = line.map(point => projectTransportPoint(point, center));
  const keep = new Uint8Array(line.length); keep[0] = keep[line.length - 1] = 1;
  const stack = [[0, line.length - 1]], squaredTolerance = tolerance * tolerance;
  while (stack.length) {
    const [first, last] = stack.pop(); let maximum = squaredTolerance, farthest = -1;
    for (let i = first + 1; i < last; i++) {
      const distance = squaredDistanceToSegment(projected[i], projected[first], projected[last]);
      if (distance > maximum) { maximum = distance; farthest = i; }
    }
    if (farthest !== -1) { keep[farthest] = 1; stack.push([first, farthest], [farthest, last]); }
  }
  return line.filter((_, index) => keep[index]).map(point => [...point]);
}

export function clipTransportLine(line, center, radius = TRANSPORT_RENDER_RADIUS_METERS) {
  const parts = []; let current;
  const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-10 && Math.abs(a[1] - b[1]) < 1e-10;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i];
    const [ax, ay] = projectTransportPoint(a, center), [bx, by] = projectTransportPoint(b, center);
    const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
    if (length < 1e-12) continue; // Zero-length segments must not reach Cesium.
    const halfB = ax * dx + ay * dy;
    const discriminant = halfB * halfB - length * (ax * ax + ay * ay - radius * radius);
    if (discriminant <= 0) { current = undefined; continue; } // Tangency has no drawable length.
    const root = Math.sqrt(discriminant);
    const start = Math.max(0, (-halfB - root) / length), end = Math.min(1, (-halfB + root) / length);
    if (end <= start) { current = undefined; continue; }
    const interpolate = t => t === 0 ? [...a] : t === 1 ? [...b] : [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    const first = interpolate(start), last = interpolate(end);
    if (!current || !same(current.at(-1), first)) { current = [first]; parts.push(current); }
    if (!same(current.at(-1), last)) current.push(last);
    if (end < 1 - 1e-12) current = undefined;
  }
  return parts.filter(part => part.length >= 2);
}

export function prepareTransportLines(feature, center = null) {
  const reference = center ?? { longitude: feature.geometry.coordinates[0][0][0], latitude: feature.geometry.coordinates[0][0][1] };
  return feature.geometry.coordinates.flatMap(line => {
    const parts = center ? clipTransportLine(line, center) : [line];
    return parts.map(part => simplifyTransportLine(part, reference));
  }).filter(line => line.length >= 2);
}
