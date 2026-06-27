import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { makeBlossomTexture } from "../textures";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Branch {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
}
interface Card {
  pos: THREE.Vector3;
  scale: number;
  rot: THREE.Euler;
  tint: string;
}
interface Core {
  pos: THREE.Vector3;
  radius: number;
  tint: string;
}

const PALETTE = ["#ffbcdb", "#ffa8cf", "#ffd0e4", "#ff9ec9", "#ffe0ee", "#ffb3d6"];
const CORE_TINT = ["#ff9ec6", "#ffb0d2", "#f78fb8"];

function buildTree(seed: number, cardTotal: number) {
  const rng = mulberry32(seed);
  const branches: Branch[] = [];
  const puffs: { pos: THREE.Vector3; radius: number }[] = [];

  // ---- trunk: curving, tapering up to a split ----
  const splitY = 2.3 + rng() * 0.5;
  let p = new THREE.Vector3(0, 0, 0);
  let dir = new THREE.Vector3((rng() - 0.5) * 0.18, 1, (rng() - 0.5) * 0.18).normalize();
  let r = 0.38;
  const segs = 5;
  for (let i = 0; i < segs; i++) {
    const len = splitY / segs;
    const end = p.clone().add(dir.clone().multiplyScalar(len));
    branches.push({ start: p.clone(), end: end.clone(), radius: r });
    dir = dir
      .clone()
      .add(new THREE.Vector3((rng() - 0.5) * 0.22, 0.12, (rng() - 0.5) * 0.22))
      .normalize();
    r *= 0.9;
    p = end;
  }
  const top = p.clone();

  // ---- main limbs fanning into a dome, each ending in a blossom puff ----
  const nMain = 6;
  for (let i = 0; i < nMain; i++) {
    const a = (i / nMain) * Math.PI * 2 + rng() * 0.6;
    const tilt = 0.55 + rng() * 0.5;
    const outDir = new THREE.Vector3(
      Math.cos(a) * Math.sin(tilt),
      Math.cos(tilt) + 0.55,
      Math.sin(a) * Math.sin(tilt)
    ).normalize();
    const len = 1.3 + rng() * 0.9;
    const bEnd = top.clone().add(outDir.clone().multiplyScalar(len));
    branches.push({ start: top.clone(), end: bEnd.clone(), radius: r * (0.6 + rng() * 0.2) });
    puffs.push({ pos: bEnd.clone(), radius: 1.05 + rng() * 0.55 });
    // a short forking twig for irregularity
    if (rng() > 0.4) {
      const t2 = bEnd
        .clone()
        .add(new THREE.Vector3((rng() - 0.5) * 0.8, 0.5 + rng() * 0.4, (rng() - 0.5) * 0.8));
      branches.push({ start: bEnd.clone(), end: t2.clone(), radius: r * 0.35 });
      puffs.push({ pos: t2.clone(), radius: 0.85 + rng() * 0.4 });
    }
  }
  // crown puff filling the centre top
  puffs.push({ pos: top.clone().add(new THREE.Vector3(0, 1.5, 0)), radius: 1.45 });

  // ---- blossoms: opaque cores + textured shell cards per puff ----
  const cards: Card[] = [];
  const cores: Core[] = [];
  const perPuff = Math.max(40, Math.floor(cardTotal / puffs.length));
  for (const puff of puffs) {
    cores.push({
      pos: puff.pos.clone(),
      radius: puff.radius * 0.8,
      tint: CORE_TINT[Math.floor(rng() * CORE_TINT.length)],
    });
    for (let i = 0; i < perPuff; i++) {
      const u = rng() * Math.PI * 2;
      const v = Math.acos(2 * rng() - 1);
      const rad = Math.pow(rng(), 0.4); // shell-biased
      const pos = puff.pos
        .clone()
        .add(
          new THREE.Vector3(
            Math.sin(v) * Math.cos(u),
            Math.cos(v),
            Math.sin(v) * Math.sin(u)
          ).multiplyScalar(puff.radius * rad)
        );
      cards.push({
        pos,
        scale: 0.34 + rng() * 0.4,
        rot: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
        tint: PALETTE[Math.floor(rng() * PALETTE.length)],
      });
    }
  }

  return { branches, cards, cores };
}

export default function Tree({
  motion,
  detail = 1,
  position = [0, 0, 0],
  scale = 1,
  seed = 20240426,
}: {
  motion: boolean;
  detail?: number;
  position?: [number, number, number];
  scale?: number;
  seed?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const barkRef = useRef<THREE.InstancedMesh>(null);
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const cardRef = useRef<THREE.InstancedMesh>(null);
  const cardMat = useRef<THREE.MeshStandardMaterial>(null);

  const tex = useMemo(makeBlossomTexture, []);
  const cardTotal = Math.round((detail >= 1 ? 2400 : 1100));
  const { branches, cards, cores } = useMemo(
    () => buildTree(seed, cardTotal),
    [seed, cardTotal]
  );

  useLayoutEffect(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();

    branches.forEach((s, i) => {
      const d = s.end.clone().sub(s.start);
      const len = d.length();
      const mid = s.start.clone().add(s.end).multiplyScalar(0.5);
      q.setFromUnitVectors(up, d.clone().normalize());
      m.compose(mid, q, new THREE.Vector3(s.radius, len, s.radius));
      barkRef.current!.setMatrixAt(i, m);
    });
    barkRef.current!.instanceMatrix.needsUpdate = true;

    cores.forEach((b, i) => {
      m.compose(b.pos, new THREE.Quaternion(), new THREE.Vector3(b.radius, b.radius * 0.9, b.radius));
      coreRef.current!.setMatrixAt(i, m);
      c.set(b.tint);
      coreRef.current!.setColorAt(i, c);
    });
    coreRef.current!.instanceMatrix.needsUpdate = true;
    if (coreRef.current!.instanceColor) coreRef.current!.instanceColor.needsUpdate = true;

    cards.forEach((b, i) => {
      q.setFromEuler(b.rot);
      m.compose(b.pos, q, new THREE.Vector3(b.scale, b.scale, b.scale));
      cardRef.current!.setMatrixAt(i, m);
      c.set(b.tint);
      cardRef.current!.setColorAt(i, c);
    });
    cardRef.current!.instanceMatrix.needsUpdate = true;
    if (cardRef.current!.instanceColor) cardRef.current!.instanceColor.needsUpdate = true;
  }, [branches, cards, cores]);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = motion
        ? Math.sin(state.clock.elapsedTime * 0.5 + seed) * 0.006
        : 0;
    }
    if (cardMat.current) {
      cardMat.current.emissiveIntensity = motion
        ? 0.12 + Math.sin(state.clock.elapsedTime * 0.8) * 0.06
        : 0.12;
    }
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <instancedMesh ref={barkRef} args={[undefined, undefined, branches.length]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#6b4a34" roughness={0.92} metalness={0.04} />
      </instancedMesh>

      {/* opaque blossom cores so the canopy is full, not see-through */}
      <instancedMesh ref={coreRef} args={[undefined, undefined, cores.length]} castShadow>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          vertexColors
          roughness={0.85}
          emissive="#ff9ec6"
          emissiveIntensity={0.22}
        />
      </instancedMesh>

      {/* textured blossom shell */}
      <instancedMesh ref={cardRef} args={[undefined, undefined, cards.length]} castShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          ref={cardMat}
          map={tex}
          emissiveMap={tex}
          emissive="#ff5d8f"
          emissiveIntensity={0.12}
          vertexColors
          side={THREE.DoubleSide}
          transparent
          alphaTest={0.42}
          roughness={0.8}
        />
      </instancedMesh>
    </group>
  );
}
