import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Point the camera looks at — biased toward the island so it frames right-of-center.
const TARGET = new THREE.Vector3(1.8, 3.6, 0);

/**
 * CameraRig — subtle mouse parallax. Eases the camera toward an offset driven by
 * the normalized pointer each frame, then re-aims at the fixed target.
 */
export default function CameraRig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 4, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.6 + pointer.y * 2.0, 0.05);
    camera.lookAt(TARGET);
  });

  return null;
}
