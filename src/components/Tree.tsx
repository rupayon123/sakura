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

// canopy ellipsoid (a full, rounded crown the branches reach up into)
const CANOPY = { cx: 0, cy: 3.8, cz: 0, rx: 3.5, ry: 2.3, rz: 3.5 };

function buildTree(cardCount: number) {
  const rng = mulberry32(20240426);
  const segs: Segment[] = [];

  function grow(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    length: number,
    radius: number,
    depth: number
  ) {
    const end = origin.clone().add(dir.clone().multiplyScalar(length));
    const childRadius = radius * 0.72;
    segs.push({ start: origin.clone(), end: end.clone(), r1: radius, r2: childRadius });
    if (depth === 0) return;
    let children = depth >= 4 ? 2 : 2 + (rng() > 0.4 ? 1 : 0);
    if (depth <= 2 && rng() > 0.65) children += 1;
    for (let i = 0; i < children; i++) {
      const newDir = dir.clone();
      const axis = new THREE.Vector3(rng() - 0.5, rng() * 0.3, rng() - 0.5).normalize();
      const angle = 0.38 + rng() * 0.55;
      newDir.applyAxisAngle(axis, angle);
      newDir.y += depth <= 2 ? -0.03 : 0.08; // reach up, then ends settle inside the crown
      newDir.normalize();
      grow(end, newDir, length * (0.76 + rng() * 0.06), childRadius, depth - 1);
    }
  }
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 1.75, 0.3, 6);

  // fill the canopy ellipsoid with blossom cards (shell-biased so it reads full)
  const palette = ["#ffd9ea", "#ffc2dd", "#ff9ecf", "#ffffff", "#ffe8f1", "#ff8ec4"];
  const blossoms = Array.from({ length: cardCount }, () => {
    const u = rng() * Math.PI * 2;
    const v = Math.acos(2 * rng() - 1);
    const rad = Math.pow(rng(), 0.45); // bias outward → dense shell
    const x = CANOPY.cx + Math.sin(v) * Math.cos(u) * CANOPY.rx * rad;
    const y = CANOPY.cy + Math.cos(v) * CANOPY.ry * rad;
    const z = CANOPY.cz + Math.sin(v) * Math.sin(u) * CANOPY.rz * rad;
    return {
      pos: new THREE.Vector3(x, y, z),
      scale: 0.34 + rng() * 0.42,
      rot: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
      tint: palette[Math.floor(rng() * palette.length)],
    };
  });

  // inner mass blobs so the canopy is opaque, not see-through (kept small + interior)
  const mass = Array.from({ length: Math.round(cardCount * 0.016) + 12 }, () => {
    const u = rng() * Math.PI * 2;
    const v = Math.acos(2 * rng() - 1);
    const rad = Math.pow(rng(), 0.8) * 0.66;
    return {
      pos: new THREE.Vector3(
        CANOPY.cx + Math.sin(v) * Math.cos(u) * CANOPY.rx * rad,
        CANOPY.cy + Math.cos(v) * CANOPY.ry * rad,
        CANOPY.cz + Math.sin(v) * Math.sin(u) * CANOPY.rz * rad
      ),
      scale: 0.5 + rng() * 0.6,
      tint: palette[Math.floor(rng() * palette.length)],
    };
  });

  return { segs, blossoms, mass };
}

export default function Tree({
  motion,
  detail = 1,
}: {
  motion: boolean;
  detail?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const barkRef = useRef<THREE.InstancedMesh>(null);
  const blossomRef = useRef<THREE.InstancedMesh>(null);
  const massRef = useRef<THREE.InstancedMesh>(null);
  const blossomMat = useRef<THREE.MeshStandardMaterial>(null);
  const massMat = useRef<THREE.MeshStandardMaterial>(null);

  const tex = useMemo(makeBlossomTexture, []);
  const cardCount = Math.round((detail >= 1 ? 3200 : 1300));
  const { segs, blossoms, mass } = useMemo(() => buildTree(cardCount), [cardCount]);

  useLayoutEffect(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();

    segs.forEach((s, i) => {
      const dir = s.end.clone().sub(s.start);
      const len = dir.length();
      const mid = s.start.clone().add(s.end).multiplyScalar(0.5);
      q.setFromUnitVectors(up, dir.clone().normalize());
      const avg = (s.r1 + s.r2) * 0.5;
      m.compose(mid, q, new THREE.Vector3(avg, len, avg));
      barkRef.current!.setMatrixAt(i, m);
    });
    barkRef.current!.instanceMatrix.needsUpdate = true;

    blossoms.forEach((b, i) => {
      q.setFromEuler(b.rot);
      m.compose(b.pos, q, new THREE.Vector3(b.scale, b.scale, b.scale));
      blossomRef.current!.setMatrixAt(i, m);
      c.set(b.tint);
      blossomRef.current!.setColorAt(i, c);
    });
    blossomRef.current!.instanceMatrix.needsUpdate = true;
    if (blossomRef.current!.instanceColor) blossomRef.current!.instanceColor.needsUpdate = true;

    mass.forEach((b, i) => {
      m.compose(b.pos, new THREE.Quaternion(), new THREE.Vector3(b.scale, b.scale, b.scale));
      massRef.current!.setMatrixAt(i, m);
      c.set(b.tint);
      massRef.current!.setColorAt(i, c);
    });
    massRef.current!.instanceMatrix.needsUpdate = true;
    if (massRef.current!.instanceColor) massRef.current!.instanceColor.needsUpdate = true;
  }, [segs, blossoms, mass]);

  useFrame((state) => {
    if (group.current) {
      group.current.position.y = motion ? Math.sin(state.clock.elapsedTime * 0.45) * 0.05 : 0;
    }
    const pulse = motion ? 0.25 + Math.sin(state.clock.elapsedTime * 0.9) * 0.12 : 0.25;
    if (blossomMat.current) blossomMat.current.emissiveIntensity = 0.55 + pulse;
    if (massMat.current) massMat.current.emissiveIntensity = 0.2 + pulse * 0.35;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={barkRef} args={[undefined, undefined, segs.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.65, 1, 7]} />
        <meshStandardMaterial color="#2c1d2a" roughness={0.92} metalness={0.05} />
      </instancedMesh>

      {/* opaque inner mass — gives the crown real volume */}
      <instancedMesh ref={massRef} args={[undefined, undefined, mass.length]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          ref={massMat}
          vertexColors
          roughness={0.85}
          emissive="#ff5d8f"
          emissiveIntensity={0.35}
          toneMapped={false}
        />
      </instancedMesh>

      {/* blossom cards — surface detail over the mass */}
      <instancedMesh ref={blossomRef} args={[undefined, undefined, blossoms.length]} castShadow>
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
          alphaTest={0.4}
          roughness={0.7}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
