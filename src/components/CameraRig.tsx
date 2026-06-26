import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { Patch } from "../content";

const OVERVIEW_POS = new THREE.Vector3(0, 7.6, 19.5);
const OVERVIEW_TARGET = new THREE.Vector3(0, 2.6, 0);

export default function CameraRig({
  controls,
  focused,
  entered,
}: {
  controls: React.MutableRefObject<any>;
  focused: Patch | null;
  entered: boolean;
}) {
  const { camera } = useThree();
  const desiredPos = useRef(OVERVIEW_POS.clone());
  const desiredTarget = useRef(OVERVIEW_TARGET.clone());
  const animating = useRef(true);

  useEffect(() => {
    if (focused && focused.kind === "about") {
      // frame the whole tree for the "about me" view
      desiredPos.current.set(0, 4.4, 12);
      desiredTarget.current.set(0, 3.2, 0);
    } else if (focused) {
      const rad = THREE.MathUtils.degToRad(focused.angle);
      const px = Math.sin(rad) * focused.radius;
      const pz = Math.cos(rad) * focused.radius;
      desiredPos.current.set(px + Math.sin(rad) * 3.2, 2.0, pz + Math.cos(rad) * 3.2);
      desiredTarget.current.set(px, 0.7, pz);
    } else {
      desiredPos.current.copy(OVERVIEW_POS);
      desiredTarget.current.copy(OVERVIEW_TARGET);
    }
    animating.current = true;
  }, [focused]);

  useFrame(() => {
    const c = controls.current;
    if (!c) return;

    if (animating.current) {
      c.enabled = false;
      camera.position.lerp(desiredPos.current, 0.06);
      c.target.lerp(desiredTarget.current, 0.06);
      c.update();
      if (camera.position.distanceTo(desiredPos.current) < 0.06) {
        animating.current = false;
        c.enabled = !focused && entered;
      }
    } else {
      c.enabled = !focused && entered;
    }
  });

  return null;
}
