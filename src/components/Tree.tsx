import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { makeBlossomTexture } from "../textures";

/* tiny seeded RNG so the tree is the same every load */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Segment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  r1: number;
  r2: number;
}

function buildTree() {
  const rng = mulberry32(20240426);
  const segs: Segment[] = [];
  const tips: THREE.Vector3[] = [];

  function grow(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    length: number,
    radius: number,
    depth: number
  ) {
    const end = origin.clone().add(dir.clone().multiplyScalar(length));
    const childRadius = radius * 0.7;
    segs.push({ start: origin.clone(), end: end.clone(), r1: radius, r2: childRadius });

    if (depth === 0) {
      tips.push(end.clone());
      return;
    }

    let children = depth >= 4 ? 2 : 2 + (rng() > 0.45 ? 1 : 0);
    if (depth <= 2 && rng() > 0.7) children += 1; // extra fine twigs near the ends
    for (let i = 0; i < children; i++) {
      const newDir = dir.clone();
      const axis = new THREE.Vector3(rng() - 0.5, rng() * 0.25, rng() - 0.5).normalize();
      const angle = 0.4 + rng() * 0.6;
      newDir.applyAxisAngle(axis, angle);
      newDir.y += depth <= 2 ? -0.05 + rng() * 0.1 : 0.05; // slight weeping at the tips
      newDir.normalize();
      grow(end, newDir, length * (0.76 + rng() * 0.08), childRadius, depth - 1);
    }
  }

  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 2.0, 0.3, 6);

  // scatter blossom "cards" around every branch tip → a volumetric canopy
  const blossoms: { pos: THREE.Vector3; scale: number; rot: THREE.Euler; tint: string }[] = [];
  const palette = ["#ffd9ea", "#ffc2dd", "#ff9ecf", "#ffffff", "#ffe8f1"];
  for (const tip of tips) {
    const n = 22 + Math.floor(rng() * 12);
    for (let i = 0; i < n; i++) {
      const off = new THREE.Vector3(rng() - 0.5, rng() - 0.4, rng() - 0.5)
        .normalize()
        .multiplyScalar(Math.pow(rng(), 0.6) * 0.85);
      blossoms.push({
        pos: tip.clone().add(off),
        scale: 0.28 + rng() * 0.3,
        rot: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
        tint: palette[Math.floor(rng() * palette.length)],
      });
    }
  }

  return { segs, blossoms };
}

export default function Tree({
  motion,
  detail = 1,
}: {
  motion: boolean;
  detail?: number; // 1 = full, <1 = fewer blossoms (mobile)
}) {
  const group = useRef<THREE.Group>(null);
  const barkRef = useRef<THREE.InstancedMesh>(null);
  const blossomRef = useRef<THREE.InstancedMesh>(null);
  const blossomMat = useRef<THREE.MeshStandardMaterial>(null);

  const tex = useMemo(makeBlossomTexture, []);
  const { segs, blossoms } = useMemo(buildTree, []);
  const shown = useMemo(
    () => (detail >= 1 ? blossoms : blossoms.filter((_, i) => i % Math.round(1 / detail) === 0)),
    [blossoms, detail]
  );

  useLayoutEffect(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const m = new THREE.Matrix4();

    segs.forEach((s, i) => {
      const dir = s.end.clone().sub(s.start);
      const len = dir.length();
      const mid = s.start.clone().add(s.end).multiplyScalar(0.5);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
      const avg = (s.r1 + s.r2) * 0.5;
      m.compose(mid, quat, new THREE.Vector3(avg, len, avg));
      barkRef.current!.setMatrixAt(i, m);
    });
    barkRef.current!.instanceMatrix.needsUpdate = true;

    const c = new THREE.Color();
    const q = new THREE.Quaternion();
    shown.forEach((b, i) => {
      q.setFromEuler(b.rot);
      m.compose(b.pos, q, new THREE.Vector3(b.scale, b.scale, b.scale));
      blossomRef.current!.setMatrixAt(i, m);
      c.set(b.tint);
      blossomRef.current!.setColorAt(i, c);
    });
    blossomRef.current!.instanceMatrix.needsUpdate = true;
    if (blossomRef.current!.instanceColor) blossomRef.current!.instanceColor.needsUpdate = true;
  }, [segs, shown]);

  useFrame((state) => {
    if (group.current) {
      group.current.position.y = motion ? Math.sin(state.clock.elapsedTime * 0.5) * 0.05 : 0;
    }
    if (blossomMat.current) {
      blossomMat.current.emissiveIntensity = motion
        ? 0.7 + Math.sin(state.clock.elapsedTime * 0.9) * 0.25
        : 0.7;
    }
  });

  return (
    <group ref={group}>
      <instancedMesh
        ref={barkRef}
        args={[undefined, undefined, segs.length]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.5, 0.65, 1, 7]} />
        <meshStandardMaterial color="#2c1d2a" roughness={0.92} metalness={0.05} />
      </instancedMesh>

      <instancedMesh ref={blossomRef} args={[undefined, undefined, shown.length]} castShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          ref={blossomMat}
          map={tex}
          emissiveMap={tex}
          emissive="#ff5d8f"
          emissiveIntensity={0.7}
          vertexColors
          side={THREE.DoubleSide}
          transparent
          alphaTest={0.42}
          roughness={0.7}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
