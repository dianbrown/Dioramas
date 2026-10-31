import * as THREE from 'three';

export const CAMERA_CALIBRATION = {
  distance: 94.6715,
  targetX: 0.197,
  targetY: 1.08,
  azimuth: 45.5125,
  elevation: 33.3875,
};
function camera(distance, x, y, az, el) {
  const c = new THREE.PerspectiveCamera(20.5, 1082 / 1080, 0.3, 500),
    a = (az * Math.PI) / 180,
    e = (el * Math.PI) / 180,
    target = new THREE.Vector3(x, y, 0);
  c.position
    .copy(target)
    .addScaledVector(
      new THREE.Vector3(
        Math.cos(e) * Math.cos(a),
        Math.sin(e),
        Math.cos(e) * Math.sin(a),
      ),
      distance,
    );
  c.lookAt(target);
  c.updateMatrixWorld(true);
  return c;
}
const previous = camera(95.6415, 0.182, 0.96, 45, 33),
  current = camera(
    CAMERA_CALIBRATION.distance,
    CAMERA_CALIBRATION.targetX,
    CAMERA_CALIBRATION.targetY,
    CAMERA_CALIBRATION.azimuth,
    CAMERA_CALIBRATION.elevation,
  );

export function preserveProjection(point) {
  const p = new THREE.Vector3(...point),
    ndc = p.clone().project(previous),
    ray = new THREE.Vector3(ndc.x, ndc.y, 0.5)
      .unproject(current)
      .sub(current.position)
      .normalize();
  return current.position
    .clone()
    .addScaledVector(ray, (p.y - current.position.y) / ray.y)
    .toArray();
}
