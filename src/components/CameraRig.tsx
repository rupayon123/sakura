import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { Patch } from "../content";

const OVERVIEW_POS = new THREE.Vector3(-7.0, 1.86, 10.9);
const OVERVIEW_TARGET = new THREE.Vector3(0.75, 3.18, -7.55);
const MOBILE_OVERVIEW_POS = new THREE.Vector3(-6.25, 1.92, 12.8);
const MOBILE_OVERVIEW_TARGET = new THREE.Vector3(1.0, 3.2, -7.2);

export default function CameraRig({
  controls,
  focused,
  entered,
  motion,
  isMobile,
}: {
  controls: React.MutableRefObject<any>;
  focused: Patch | null;
  entered: boolean;
  motion: boolean;
  isMobile: boolean;
}) {
  const { camera } = useThree();
  const desiredPos = useRef((isMobile ? MOBILE_OVERVIEW_POS : OVERVIEW_POS).clone());
  const desiredTarget = useRef((isMobile ? MOBILE_OVERVIEW_TARGET : OVERVIEW_TARGET).clone());
  const animating = useRef(true);

  useEffect(() => {
    if (focused?.id === "house-story") {
      desiredPos.current.set(isMobile ? -5.7 : -6.2, isMobile ? 2.0 : 2.08, isMobile ? 1.8 : -0.2);
      desiredTarget.current.set(0.35, 1.35, -10.25);
    } else if (focused && focused.kind === "about") {
      desiredPos.current.set(0, 3.25, 9.5);
      desiredTarget.current.set(0, 3.65, -2.2);
    } else if (focused) {
      const rad = THREE.MathUtils.degToRad(focused.angle);
      const px = Math.sin(rad) * focused.radius;
      const pz = Math.cos(rad) * focused.radius;
      desiredPos.current.set(px + Math.sin(rad) * 3.2, 2.1, pz + Math.cos(rad) * 3.2);
      desiredTarget.current.set(px, 0.8, pz);
    } else {
      desiredPos.current.copy(isMobile ? MOBILE_OVERVIEW_POS : OVERVIEW_POS);
      desiredTarget.current.copy(isMobile ? MOBILE_OVERVIEW_TARGET : OVERVIEW_TARGET);
    }
    animating.current = true;
  }, [focused, isMobile]);

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
