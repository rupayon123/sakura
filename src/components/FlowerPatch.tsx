import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { makeFloretTexture } from "../textures";
import type { Patch } from "../content";

type BedStyle = {
  count: number;
  ellipseX: number;
  ellipseZ: number;
  disc: number;
  floret: [number, number];
  leaf: [number, number];
  centerBias: number;
  lean: number;
};

const bedStyles: Record<Patch["flower"], BedStyle> = {
  sakura: {
    count: 46,
    ellipseX: 0.92,
    ellipseZ: 0.74,
    disc: 1.04,
    floret: [0.14, 0.095],
    leaf: [0.1, 0.075],
    centerBias: 0.54,
    lean: 0.18,
  },
  heritage: {
    count: 32,
    ellipseX: 1.18,
    ellipseZ: 0.58,
    disc: 1.2,
    floret: [0.16, 0.09],
    leaf: [0.13, 0.08],
    centerBias: 0.62,
    lean: 0.14,
  },
  daisy: {
    count: 34,
    ellipseX: 1.08,
    ellipseZ: 0.68,
    disc: 1.12,
    floret: [0.11, 0.075],
    leaf: [0.12, 0.08],
    centerBias: 0.5,
    lean: 0.16,
  },
  lavender: {
    count: 38,
    ellipseX: 0.72,
    ellipseZ: 1.02,
    disc: 1.08,
    floret: [0.1, 0.068],
    leaf: [0.11, 0.07],
    centerBias: 0.46,
    lean: 0.22,
  },
  poppy: {
    count: 30,
    ellipseX: 0.98,
    ellipseZ: 0.76,
    disc: 1.1,
    floret: [0.17, 0.095],
    leaf: [0.1, 0.075],
    centerBias: 0.56,
    lean: 0.2,
  },
};

function seeded(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* A patch is a low ground-level flower bed marker. The only tree is Tree.tsx. */
export default function FlowerPatch({
  patch,
  active,
  dimmed,
  theme,
  onClick,
}: {
  patch: Patch;
  active: boolean;
  dimmed: boolean;
  theme: "dark" | "light";
  onClick: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const floretRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const floretMat = useRef<THREE.MeshStandardMaterial>(null);
  const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const [hovered, setHovered] = useState(false);

  const dark = theme === "dark";
  const tex = useMemo(makeFloretTexture, []);
  const style = bedStyles[patch.flower];

  const rad = THREE.MathUtils.degToRad(patch.angle);
  const base: [number, number, number] = [
    Math.sin(rad) * patch.radius,
    0,
    Math.cos(rad) * patch.radius,
  ];

  const isFamily = patch.kind === "family";
  const isAbout = patch.kind === "about";
  const N = style.count + (isAbout ? 8 : 0);
  const items = useMemo(() => {
    const flowerSalt = patch.flower.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const r = seeded(Math.round(patch.angle * 91.3) + flowerSalt + 11);
    return Array.from({ length: N }, () => {
      const ang = r() * Math.PI * 2;
      const rr = Math.pow(r(), style.centerBias);
      const familyTuck = isFamily ? 0.94 : 1;
      const aboutLift = isAbout ? 1.08 : 1;
      return {
        x: Math.cos(ang) * rr * style.ellipseX * familyTuck,
        z: Math.sin(ang) * rr * style.ellipseZ * aboutLift,
        y: 0.052 + r() * 0.028,
        yaw: r() * Math.PI * 2,
        lean: (r() - 0.5) * style.lean,
        s: style.floret[0] + r() * style.floret[1],
        leafS: style.leaf[0] + r() * style.leaf[1],
      };
    });
  }, [patch.angle, patch.flower, N, isFamily, isAbout, style]);

  useEffect(() => {
    return () => {
      if (hovered) document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();

    items.forEach((it, i) => {
      e.set(-Math.PI / 2 + it.lean, 0, it.yaw);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(it.s, it.s, it.s));
      floretRef.current!.setMatrixAt(i, m);

      e.set(-Math.PI / 2 + it.lean * 0.4, 0, it.yaw + Math.PI * 0.33);
      q.setFromEuler(e);
      m.compose(
        new THREE.Vector3(it.x, 0.038, it.z),
        q,
        new THREE.Vector3(it.leafS * 0.45, it.leafS, it.leafS)
      );
      leafRef.current!.setMatrixAt(i, m);
    });
    floretRef.current!.instanceMatrix.needsUpdate = true;
    leafRef.current!.instanceMatrix.needsUpdate = true;
  }, [items]);

  useFrame((state) => {
    if (group.current) {
      const target = active ? 1.14 : hovered ? 1.06 : 1;
      targetScale.set(target, target, target);
      group.current.scale.lerp(targetScale, 0.1);
      group.current.position.y = active ? 0.045 + Math.sin(state.clock.elapsedTime * 2) * 0.015 : 0;
    }

    const glow = dark
      ? dimmed
        ? 0.03
        : active || hovered
        ? 0.34
        : 0.1
      : dimmed
      ? 0.05
      : active || hovered
      ? 0.22
      : 0.12;
    if (floretMat.current) floretMat.current.emissiveIntensity = glow;
  });

  const leafColor = dark ? "#456f4b" : "#90aa69";
  const soilColor = dark ? "#2d2530" : "#7a654d";
  const discOpacity = dark
    ? dimmed
      ? 0.035
      : active || hovered
      ? 0.16
      : 0.075
    : active || hovered
    ? 0.14
    : 0.045;
  const discRadius = active || hovered ? style.disc * 1.04 : style.disc;

  return (
    <group position={base}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]} receiveShadow>
        <circleGeometry args={[discRadius, 42]} />
        <meshStandardMaterial color={soilColor} transparent opacity={discOpacity} roughness={1} />
      </mesh>

      <group
        ref={group}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <instancedMesh ref={leafRef} args={[undefined, undefined, N]}>
          <circleGeometry args={[1, 12]} />
          <meshStandardMaterial
            color={leafColor}
            side={THREE.DoubleSide}
            roughness={0.9}
            transparent
            opacity={dark ? 0.24 : 0.1}
            depthWrite={false}
          />
        </instancedMesh>

        <instancedMesh ref={floretRef} args={[undefined, undefined, N]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshStandardMaterial
            ref={floretMat}
            map={tex}
            color={patch.color}
            emissive={patch.color}
            emissiveIntensity={0.02}
            side={THREE.DoubleSide}
            transparent
            alphaTest={0.4}
            roughness={0.72}
            depthWrite={false}
            toneMapped
          />
        </instancedMesh>
      </group>
    </group>
  );
}
