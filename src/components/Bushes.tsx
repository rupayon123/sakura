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

/** Rounded leafy shrubs (clusters of green blobs) dotted around the courtyard. */
export default function Bushes({
  theme,
  count = 7,
  seed = 909,
}: {
  theme: "dark" | "light";
  count?: number;
  seed?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const light = theme === "light";
  const blobsPer = 5;
  const total = count * blobsPer;

  const blobs = useMemo(() => {
    const r = mulberry32(seed);
    const greens = light
      ? ["#4f7a43", "#5d8a4c", "#446b3a", "#618f50"]
      : ["#22402a", "#2c4d33", "#1c3624", "#2f5238"];
    const out: { pos: THREE.Vector3; scl: THREE.Vector3; color: string }[] = [];
    const anchors = [
      [-6.9, 3.2],
      [6.8, 2.8],
      [-7.4, -2.4],
      [7.2, -2.8],
      [-4.2, 7.1],
      [4.4, 6.7],
      [-8.5, 7.8],
      [8.6, 7.4],
    ];
    for (let b = 0; b < count; b++) {
      const [ax, az] = anchors[b % anchors.length];
      const cx = ax + (r() - 0.5) * 1.0;
      const cz = az + (r() - 0.5) * 0.9;
      const bs = 0.6 + r() * 0.7;
      for (let i = 0; i < blobsPer; i++) {
        const ox = (r() - 0.5) * bs * 1.3;
        const oz = (r() - 0.5) * bs * 1.3;
        const oy = 0.1 + r() * bs * 0.5;
        const s = bs * (0.5 + r() * 0.4);
        out.push({
          pos: new THREE.Vector3(cx + ox, oy + s * 0.4, cz + oz),
          scl: new THREE.Vector3(s, s * 0.8, s),
          color: greens[Math.floor(r() * greens.length)],
        });
      }
    }
    return out;
  }, [count, seed, light]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    blobs.forEach((bl, i) => {
      m.compose(bl.pos, new THREE.Quaternion(), bl.scl);
      ref.current!.setMatrixAt(i, m);
      c.set(bl.color);
      ref.current!.setColorAt(i, c);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [blobs]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial roughness={0.9} metalness={0} flatShading />
    </instancedMesh>
  );
}
