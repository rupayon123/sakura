import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Scattered low-poly mossy boulders around the courtyard. */
export default function Rocks({ count = 18, seed = 555 }: { count?: number; seed?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const rocks = useMemo(() => {
    const r = mulberry32(seed);
    const greys = ["#b4afa3", "#a39e92", "#c0bbac", "#989488"];
    return Array.from({ length: count }, () => {
      const a = r() * Math.PI * 2;
      const rad = 6 + r() * 8.5;
      const s = 0.32 + r() * 0.45;
      return {
        pos: new THREE.Vector3(Math.cos(a) * rad, s * 0.34, Math.sin(a) * rad),
        scl: new THREE.Vector3(s * (0.95 + r() * 0.3), s * (0.78 + r() * 0.28), s * (0.95 + r() * 0.3)),
        rot: new THREE.Euler(r() * 0.3, r() * Math.PI * 2, r() * 0.3),
        color: greys[Math.floor(r() * greys.length)],
      };
    });
  }, [count, seed]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    rocks.forEach((rk, i) => {
      q.setFromEuler(rk.rot);
      m.compose(rk.pos, q, rk.scl);
      ref.current!.setMatrixAt(i, m);
      c.set(rk.color);
      ref.current!.setColorAt(i, c);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [rocks]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#b4afa3" roughness={1} metalness={0} flatShading />
    </instancedMesh>
  );
}
