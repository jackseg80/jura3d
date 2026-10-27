export function placeDistanceMeters(point, center) {
  const radians = Math.PI / 180, a = center.latitude * radians, b = point[1] * radians;
  const q = Math.sin((b - a) / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin((point[0] - center.longitude) * radians / 2) ** 2;
  return 6371008.8 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(Math.max(0, 1 - q)));
}
