// Géométrie d'affichage déjà découpée/simplifiée ; les sources restent intactes.
export function mercatorPoint([longitude, latitude]) {
  const phi = Math.max(-85.05112878, Math.min(85.05112878, latitude)) * Math.PI / 180;
  return [(longitude + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / Math.PI) / 2];
}

export function prepareRasterPaths(lines) {
  return lines.flatMap(line => line.parts.map(part => {
    const points = part.map(mercatorPoint);
    return { id: line.id, color: line.color, night: line.night, points,
      bounds: points.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]) };
  }));
}

export function pathsForTile(paths, x, y, level, size = 512, padding = 4) {
  const count = 2 ** level, extra = padding / size;
  return paths.filter(({ bounds: b }) => b[2] * count >= x - extra && b[0] * count <= x + 1 + extra
    && b[3] * count >= y - extra && b[1] * count <= y + 1 + extra);
}

export function nearbyRasterPaths(paths, position, meters) {
  const point = mercatorPoint(position), radius = meters / (40075016.68557849 * Math.cos(position[1] * Math.PI / 180));
  const matches = new Map();
  for (const row of paths) {
    const b = row.bounds;
    if (point[0] < b[0] - radius || point[0] > b[2] + radius || point[1] < b[1] - radius || point[1] > b[3] + radius) continue;
    for (let i = 1; i < row.points.length; i++) {
      const a = row.points[i - 1], z = row.points[i], dx = z[0] - a[0], dy = z[1] - a[1];
      const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
      const x = a[0] + t * dx, y = a[1] + t * dy, distance = Math.hypot(x - point[0], y - point[1]);
      if (distance <= radius && (!matches.has(row.id) || distance < matches.get(row.id).distance)) {
        matches.set(row.id, { id: row.id, distance, position: [x * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI] });
      }
    }
  }
  return [...matches.values()];
}
