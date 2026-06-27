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

/** A rounded, irregular boulder geometry (displaced icosphere). */
function makeBoulder(seed: number) {
  const g = new THREE.IcosahedronGeometry(1, 4);
  const r = mulberry32(seed);
  // a few random low-frequency lobes
  const lobes = Array.from({ length: 6 }, () => ({
    dir: new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize(),
    amp: 0.12 + r() * 0.22,
  }));
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    let d = 1;
    for (const l of lobes) d += l.amp * Math.max(0, n.dot(l.dir)) ** 2;
    // tiny high-freq bumpiness
    d += (Math.sin(n.x * 9 + seed) * Math.cos(n.y * 11) + Math.sin(n.z * 13)) * 0.02;
    v.copy(n).multiplyScalar(d);
    v.y *= 0.82; // flatten slightly
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Scattered weathered boulders around the courtyard. */
export default function Rocks({ count = 18, seed = 555 }: { count?: number; seed?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => makeBoulder(seed), [seed]);

  const rocks = useMemo(() => {
    const r = mulberry32(seed + 1);
    const greys = ["#cfc9bc", "#c2bcae", "#d8d2c4", "#bdb6a6", "#c8c2b3"];
    return Array.from({ length: count }, () => {
      const a = r() * Math.PI * 2;
      const rad = 5.5 + r() * 9;
      const s = 0.34 + r() * 0.55;
      return {
        pos: new THREE.Vector3(Math.cos(a) * rad, s * 0.42, Math.sin(a) * rad),
        scl: new THREE.Vector3(s * (1 + r() * 0.5), s * (0.7 + r() * 0.3), s * (1 + r() * 0.5)),
        rot: new THREE.Euler(r() * 0.4, r() * Math.PI * 2, r() * 0.4),
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
    <instancedMesh ref={ref} args={[geo, undefined, count]} castShadow receiveShadow>
      <meshStandardMaterial
        color="#c7c0b1"
        roughness={0.95}
        metalness={0}
        emissive="#3a352c"
        emissiveIntensity={0.25}
      />
    </instancedMesh>
  );
}
