import { Cartesian3, ClippingPlane, ClippingPlaneCollection, ClippingPolygon,
  ClippingPolygonCollection, Matrix4, Transforms } from 'cesium';

// Four vertical planes for a small geographic rectangle. Numeric edge checks
// cover the Basel bounds/heights; transformed models retain geographic polygons.
export function rectangularBuildingPlanes(tileset, bounds) {
  const [w, s, e, n] = bounds;
  if (!Matrix4.equals(tileset.modelMatrix, Matrix4.IDENTITY)
    || !Matrix4.equals(tileset.root.transform, Matrix4.IDENTITY)
    || e - w > .1 || n - s > .1
    || Cartesian3.magnitude(tileset.boundingSphere.center) < 6300000) return null;
  const frame = Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees((w + e) / 2, (s + n) / 2));
  const inverse = Matrix4.inverseTransformation(frame, new Matrix4());
  const points = [[w, s], [e, s], [e, n], [w, n]].map(p =>
    Matrix4.multiplyByPoint(inverse, Cartesian3.fromDegrees(...p), new Cartesian3()));
  const planes = points.map((a, i) => {
    const b = points[(i + 1) % points.length];
    const normal = Cartesian3.normalize(new Cartesian3(a.y - b.y, b.x - a.x, 0), new Cartesian3());
    return new ClippingPlane(normal, -Cartesian3.dot(normal, a));
  });
  const origin = Transforms.eastNorthUpToFixedFrame(tileset.boundingSphere.center);
  const modelMatrix = Matrix4.multiply(Matrix4.inverseTransformation(origin, new Matrix4()), frame, new Matrix4());
  return new ClippingPlaneCollection({ planes, modelMatrix, unionClippingRegions: true, edgeWidth: 0 });
}

export function configureBuildingClip(tileset, bounds, scene) {
  const planes = rectangularBuildingPlanes(tileset, bounds);
  if (planes) { tileset.clippingPlanes = planes; return; }
  if (!ClippingPolygonCollection.isSupported(scene)) {
    const error = new Error('Découpe des bâtiments non prise en charge par ce navigateur');
    error.code = 'CLIPPING_UNSUPPORTED'; throw error;
  }
  const [w, s, e, n] = bounds;
  tileset.clippingPolygons = new ClippingPolygonCollection({ inverse: true,
    polygons: [new ClippingPolygon({ positions: Cartesian3.fromDegreesArray([w, s, e, s, e, n, w, n]) })] });
}
