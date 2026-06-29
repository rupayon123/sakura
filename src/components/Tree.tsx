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

interface Seg {
  a: THREE.Vector3;
  b: THREE.Vector3;
  r: number;
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

const PALETTE = ["#ffd2e7", "#ffc0de", "#ffe6f2", "#ffcae1", "#fff2f8", "#ffb9d9"];
const CORE_TINT = ["#ffb0d2", "#ffc2dd", "#ffa6cc"];

function buildTree(seed: number, density: number) {
  const rng = mulberry32(seed);
  const segs: Seg[] = [];
  const cards: Card[] = [];
  const cores: Core[] = [];

  const addCluster = (pos: THREE.Vector3, size: number, n: number) => {
    cores.push({
      pos: pos.clone(),
      radius: size * 0.6,
      tint: CORE_TINT[Math.floor(rng() * CORE_TINT.length)],
    });
    for (let i = 0; i < n; i++) {
      const u = rng() * Math.PI * 2;
      const v = Math.acos(2 * rng() - 1);
      const rad = Math.pow(rng(), 0.38) * size * 1.05;
      cards.push({
        pos: pos
          .clone()
          .add(
            new THREE.Vector3(
              Math.sin(v) * Math.cos(u),
              Math.cos(v),
              Math.sin(v) * Math.sin(u)
            ).multiplyScalar(rad)
          ),
        scale: 0.34 + rng() * 0.36,
        rot: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
        tint: PALETTE[Math.floor(rng() * PALETTE.length)],
      });
    }
  };

  // a branch that rises then arcs downward (weeping), spawning children + blossoms
  function grow(
    start: THREE.Vector3,
    dir: THREE.Vector3,
    length: number,
    radius: number,
    depth: number
  ) {
    const steps = depth >= 2 ? 7 : 6;
    const droop = depth >= 2 ? 0.1 : depth === 1 ? 0.28 : 0.5;
    let pos = start.clone();
    let d = dir.clone().normalize();
    for (let i = 0; i < steps; i++) {
      const seg = length / steps;
      const r = radius * (1 - (i / steps) * 0.3);
      const next = pos.clone().add(d.clone().multiplyScalar(seg));
      segs.push({ a: pos.clone(), b: next.clone(), r });

      // bend toward the ground (weeping) + a little noise
      d.add(new THREE.Vector3(0, -droop, 0));
      d.add(
        new THREE.Vector3(rng() - 0.5, (rng() - 0.5) * 0.3, rng() - 0.5).multiplyScalar(0.16)
      );
      d.normalize();
      pos = next;

      // blossom clusters along the fine, drooping branches
      if (depth <= 1 && i >= 1) {
        addCluster(pos, 0.6 + rng() * 0.4, Math.round((26 + rng() * 18) * density));
      }
      // spawn sub-branches from the middle of a branch
      if (depth >= 1 && i > 0 && i < steps - 1 && rng() > 0.32) {
        const cd = d.clone();
        const axis = new THREE.Vector3(rng() - 0.5, rng(), rng() - 0.5).normalize();
        cd.applyAxisAngle(axis, 0.5 + rng() * 0.7);
        cd.y += 0.35; // head up before drooping
        cd.normalize();
        grow(pos.clone(), cd, length * (0.58 + rng() * 0.16), radius * 0.52, depth - 1);
      }
    }
    if (depth === 0) addCluster(pos, 0.6, Math.round((30 + rng() * 14) * density));
  }

  // ---- bendy S-curved trunk ----
  let tpos = new THREE.Vector3(0, 0, 0);
  let td = new THREE.Vector3(0.14, 1, 0.06).normalize();
  const trad = 0.56;
  const trunkSteps = 7;
  const trunkH = 4.0;
  for (let i = 0; i < trunkSteps; i++) {
    const seg = trunkH / trunkSteps;
    const next = tpos.clone().add(td.clone().multiplyScalar(seg));
    segs.push({ a: tpos.clone(), b: next.clone(), r: trad * (1 - (i / trunkSteps) * 0.5) });
    td.add(new THREE.Vector3(Math.sin(i * 1.4) * 0.18, 0.04, Math.cos(i * 0.9) * 0.13));
    td.normalize();
    tpos = next;
  }
  const crown = tpos.clone();

  // ---- main limbs fanning out from the crown ----
  const nMain = 12;
  for (let i = 0; i < nMain; i++) {
    const a = (i / nMain) * Math.PI * 2 + rng() * 0.45;
    const tilt = 0.7 + rng() * 0.45;
    const dir = new THREE.Vector3(
      Math.cos(a) * Math.sin(tilt),
      Math.cos(tilt) + 0.7,
      Math.sin(a) * Math.sin(tilt)
    ).normalize();
    grow(
      crown.clone().add(new THREE.Vector3((rng() - 0.5) * 0.4, (rng() - 0.4) * 0.5, (rng() - 0.5) * 0.4)),
      dir,
      2.8 + rng() * 1.2,
      trad * 0.52,
      2
    );
  }

  return { segs, cards, cores };
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
  const density = detail >= 1 ? 1 : 0.45;
  const { segs, cards, cores } = useMemo(() => buildTree(seed, density), [seed, density]);

  useLayoutEffect(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();

    segs.forEach((s, i) => {
      const d = s.b.clone().sub(s.a);
      const len = d.length();
      const mid = s.a.clone().add(s.b).multiplyScalar(0.5);
      q.setFromUnitVectors(up, d.clone().normalize());
      m.compose(mid, q, new THREE.Vector3(s.r, len, s.r));
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
  }, [segs, cards, cores]);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = motion
        ? Math.sin(state.clock.elapsedTime * 0.45 + seed) * 0.005
        : 0;
    }
    if (cardMat.current) {
      cardMat.current.emissiveIntensity = motion
        ? 0.32 + Math.sin(state.clock.elapsedTime * 0.7) * 0.06
        : 0.32;
    }
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <instancedMesh ref={barkRef} args={[undefined, undefined, segs.length]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 30, 2]} />
        <meshStandardMaterial color="#6a4633" roughness={0.98} metalness={0.02} />
      </instancedMesh>

      <instancedMesh ref={coreRef} args={[undefined, undefined, cores.length]} castShadow>
        <icosahedronGeometry args={[1, 3]} />
        <meshStandardMaterial vertexColors roughness={0.85} emissive="#ff9ec9" emissiveIntensity={0.42} />
      </instancedMesh>

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
