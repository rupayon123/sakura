import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeGrassBladeTexture } from "../textures";

function seeded(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function GrassTufts({
  count = 180,
  theme,
  play,
}: {
  count?: number;
  theme: "dark" | "light";
  play: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const bladeMap = useMemo(makeGrassBladeTexture, []);

  const tufts = useMemo(() => {
    const r = seeded(60629);
    const beds = [
      { x: -4.5, z: 1.1, rx: 3.1, rz: 1.0 },
      { x: 4.4, z: 2.0, rx: 2.4, rz: 0.85 },
      { x: -2.2, z: -4.6, rx: 2.2, rz: 0.75 },
      { x: 5.8, z: -4.4, rx: 1.8, rz: 0.6 },
      { x: 0.5, z: 5.7, rx: 2.8, rz: 0.7 },
    ];

    return Array.from({ length: count }, (_, i) => {
      const bed = beds[i % beds.length];
      let x = 0;
      let z = 0;
      for (let attempt = 0; attempt < 16; attempt++) {
        const a = r() * Math.PI * 2;
        const rr = Math.sqrt(r());
        x = bed.x + Math.cos(a) * rr * bed.rx;
        z = bed.z + Math.sin(a) * rr * bed.rz;
        const clearMainPath = Math.abs(x + 0.15) > 1.15 || z < -6.2 || z > 8.4;
        const clearHouseStep = !(z < -5.8 && Math.abs(x - 3.9) < 1.6);
        const clearTreeBase = Math.hypot(x - 4.35, z - 0.1) > 2.35;
        if (clearMainPath && clearHouseStep && clearTreeBase) break;
      }

      return {
        x,
        z,
        h: 0.12 + r() * 0.12,
        w: 0.1 + r() * 0.08,
        rot: r() * Math.PI * 2,
        lean: (r() - 0.5) * 0.18,
        color: r() > 0.48 ? "#6f934f" : r() > 0.5 ? "#8aa15f" : "#526f42",
      };
    });
  }, [count]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const c = new THREE.Color();

    tufts.forEach((t, i) => {
      e.set(t.lean, t.rot, t.lean * 0.45);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(t.x, t.h / 2, t.z), q, new THREE.Vector3(t.w, t.h, t.w));
      mesh.current!.setMatrixAt(i, m);
      c.set(t.color);
      mesh.current!.setColorAt(i, c);
    });

    mesh.current!.instanceMatrix.needsUpdate = true;
    if (mesh.current!.instanceColor) mesh.current!.instanceColor.needsUpdate = true;
  }, [tufts]);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = play ? Math.sin(state.clock.elapsedTime * 0.7) * 0.002 : 0;
    }
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={bladeMap}
          vertexColors
          transparent
          alphaTest={0.28}
          depthWrite={false}
          side={THREE.DoubleSide}
          roughness={0.9}
          color={theme === "dark" ? "#78936d" : "#ffffff"}
          emissive={theme === "dark" ? "#1b3426" : "#000000"}
          emissiveIntensity={theme === "dark" ? 0.08 : 0}
        />
      </instancedMesh>
    </group>
  );
}
