import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { Patch } from "../content";

const OVERVIEW_POS = new THREE.Vector3(-7.2, 3.35, 9.35);
const OVERVIEW_TARGET = new THREE.Vector3(0.9, 1.18, -3.85);
const MOBILE_OVERVIEW_POS = new THREE.Vector3(-6.35, 3.55, 11.25);
const MOBILE_OVERVIEW_TARGET = new THREE.Vector3(0.35, 1.08, -3.8);

export default function CameraRig({
  controls,
  focused,
  entered,
  motion,
  isMobile,
  userOrbiting,
}: {
  controls: React.MutableRefObject<any>;
  focused: Patch | null;
  entered: boolean;
  motion: boolean;
  isMobile: boolean;
  userOrbiting: React.MutableRefObject<boolean>;
}) {
  const { camera } = useThree();
  const desiredPos = useRef((isMobile ? MOBILE_OVERVIEW_POS : OVERVIEW_POS).clone());
  const desiredTarget = useRef((isMobile ? MOBILE_OVERVIEW_TARGET : OVERVIEW_TARGET).clone());
  const animating = useRef(true);
  const returningToOverview = useRef(false);

  useEffect(() => {
    returningToOverview.current = !focused;
    userOrbiting.current = false;

    if (focused?.id === "house-story") {
      desiredPos.current.set(isMobile ? -5.2 : -5.8, isMobile ? 1.75 : 1.82, isMobile ? 2.05 : -0.25);
      desiredTarget.current.set(-0.8, 1.0, -10.1);
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
  }, [focused, isMobile, userOrbiting]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;

    const canOrbit = !focused && entered;
    c.enabled = canOrbit;
    c.autoRotate = canOrbit && motion && !userOrbiting.current;
    c.update();
  }, [controls, entered, focused, motion, userOrbiting]);

  useFrame(() => {
    const c = controls.current;
    if (!c) return;

    const canOrbit = !focused && entered;

    if (animating.current) {
      const returning = returningToOverview.current;

      if (returning && userOrbiting.current) {
        animating.current = false;
        c.enabled = canOrbit;
        c.autoRotate = false;
        c.update();
        return;
      }

      // Focused panels get a clean guided camera move. Closing a panel keeps
      // controls live so the garden never feels stuck while easing home.
      c.enabled = returning ? canOrbit : false;
      c.autoRotate = returning && canOrbit && motion && !userOrbiting.current;
      camera.position.lerp(desiredPos.current, returning ? 0.045 : 0.07);
      c.target.lerp(desiredTarget.current, returning ? 0.045 : 0.07);
      c.update();
      if (
        camera.position.distanceTo(desiredPos.current) < 0.05 &&
        c.target.distanceTo(desiredTarget.current) < 0.05
      ) {
        animating.current = false;
      }
    } else {
      // Settled: hand control back and keep updating it ourselves so
      // auto-rotate resumes after pointer drags instead of waiting for a new grab.
      c.enabled = canOrbit;
      c.autoRotate = canOrbit && motion && !userOrbiting.current;
      c.update();
    }
  });

  return null;
}
