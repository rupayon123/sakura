import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { makeFloretTexture } from "../textures";

/* deterministic RNG so the planting beds are the same every load */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Low planted beds around the garden. They add soft color and planting logic
 * without turning the scene into rows of toy flowers or extra tree shapes.
 */
export default function PlantingBeds({
  count = 220,
  play = true,
  theme = "light",
}: {
  count?: number;
  play?: boolean;
  theme?: "dark" | "light";
}) {
  const flowers = useRef<THREE.InstancedMesh>(null);
  const leaves = useRef<THREE.InstancedMesh>(null);
  const flowerMat = useRef<THREE.MeshStandardMaterial>(null);
  const tex = useMemo(makeFloretTexture, []);

  const plantings = useMemo(() => {
    const rng = mulberry32(77123);
    const palette = ["#ff8fbd", "#ffaccd", "#ffd3df", "#f37ca9", "#f6b6c9", "#f9e1d8"];
    const beds = [
      { x: -5.5, z: -0.9, rx: 2.2, rz: 0.58 },
      { x: 5.9, z: -1.35, rx: 1.65, rz: 0.52 },
      { x: -5.7, z: 4.3, rx: 1.8, rz: 0.52 },
      { x: 6.4, z: 4.5, rx: 1.45, rz: 0.48 },
      { x: -1.9, z: -6.0, rx: 1.45, rz: 0.46 },
    ];

    return Array.from({ length: count }, (_, i) => {
      const bed = beds[i % beds.length];
      let x = 0;
      let z = 0;
      for (let attempt = 0; attempt < 18; attempt++) {
        const a = rng() * Math.PI * 2;
        const rr = Math.sqrt(rng());
        x = bed.x + Math.cos(a) * rr * bed.rx;
        z = bed.z + Math.sin(a) * rr * bed.rz;
        const clearMainPath = Math.abs(x + 0.15) > 1.65 || z < -5.9 || z > 8.2;
        const clearHouseStep = !(z < -5.8 && Math.abs(x - 3.9) < 1.65);
        if (clearMainPath && clearHouseStep) break;
      }

      return {
        x,
        z,
        y: 0.052 + rng() * 0.025,
        flowerS: 0.12 + rng() * 0.085,
        leafS: 0.15 + rng() * 0.13,
        rot: rng() * Math.PI * 2,
        tilt: (rng() - 0.5) * 0.22,
        color: palette[Math.floor(rng() * palette.length)],
      };
    });
  }, [count]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const c = new THREE.Color();

    plantings.forEach((t, i) => {
      e.set(-Math.PI / 2 + t.tilt, 0, t.rot);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(t.x, t.y, t.z), q, new THREE.Vector3(t.flowerS, t.flowerS, t.flowerS));
      flowers.current!.setMatrixAt(i, m);
      c.set(t.color);
      flowers.current!.setColorAt(i, c);

      e.set(-Math.PI / 2 + t.tilt * 0.35, 0, t.rot + Math.PI * 0.24);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(t.x, 0.042, t.z), q, new THREE.Vector3(t.leafS * 0.42, t.leafS, t.leafS));
      leaves.current!.setMatrixAt(i, m);
    });
    flowers.current!.instanceMatrix.needsUpdate = true;
    leaves.current!.instanceMatrix.needsUpdate = true;
    if (flowers.current!.instanceColor) flowers.current!.instanceColor.needsUpdate = true;
  }, [plantings]);

  useFrame((state) => {
    if (flowerMat.current) {
      const base = theme === "dark" ? 0.08 : 0.018;
      flowerMat.current.emissiveIntensity = play
        ? base + Math.sin(state.clock.elapsedTime * 0.45) * 0.022
        : base;
    }
  });

  return (
    <group>
      <instancedMesh ref={leaves} args={[undefined, undefined, count]}>
        <circleGeometry args={[1, 12]} />
        <meshStandardMaterial
          color={theme === "dark" ? "#3f6444" : "#6b8d5b"}
          roughness={0.92}
          side={THREE.DoubleSide}
          transparent
          opacity={theme === "dark" ? 0.42 : 0.48}
          depthWrite={false}
        />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[undefined, undefined, count]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial
          ref={flowerMat}
          map={tex}
          vertexColors
          side={THREE.DoubleSide}
          transparent
          alphaTest={0.4}
          roughness={0.7}
          metalness={0.0}
          emissive={theme === "dark" ? "#ff7eb6" : "#000000"}
          emissiveIntensity={0.02}
          depthWrite={false}
          toneMapped
        />
      </instancedMesh>
    </group>
  );
}
