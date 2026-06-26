import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { Patch } from "../content";

const OVERVIEW_POS = new THREE.Vector3(0, 7.6, 19.5);
const OVERVIEW_TARGET = new THREE.Vector3(0, 3.0, 0);

export default function CameraRig({
  controls,
  focused,
  entered,
  motion,
}: {
  controls: React.MutableRefObject<any>;
  focused: Patch | null;
  entered: boolean;
  motion: boolean;
}) {
  const { camera } = useThree();
  const desiredPos = useRef(OVERVIEW_POS.clone());
  const desiredTarget = useRef(OVERVIEW_TARGET.clone());
  const animating = useRef(true);

  useEffect(() => {
    if (focused && focused.kind === "about") {
      desiredPos.current.set(0, 4.6, 12.5);
      desiredTarget.current.set(0, 3.4, 0);
    } else if (focused) {
      const rad = THREE.MathUtils.degToRad(focused.angle);
      const px = Math.sin(rad) * focused.radius;
      const pz = Math.cos(rad) * focused.radius;
      desiredPos.current.set(px + Math.sin(rad) * 3.2, 2.1, pz + Math.cos(rad) * 3.2);
      desiredTarget.current.set(px, 0.8, pz);
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
      // flying to a target — rig is fully in control, no auto-rotate
      c.enabled = false;
      c.autoRotate = false;
      camera.position.lerp(desiredPos.current, 0.07);
      c.target.lerp(desiredTarget.current, 0.07);
      c.update();
      if (camera.position.distanceTo(desiredPos.current) < 0.05) {
        animating.current = false;
      }
    } else {
      // settled: hand control back. drei calls update() whenever enabled,
      // which drives autoRotate — so this reliably resumes after exiting a flower.
      c.enabled = !focused && entered;
      c.autoRotate = !focused && entered && motion;
    }
  });

  return null;
}
