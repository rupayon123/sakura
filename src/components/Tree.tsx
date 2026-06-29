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
interface Joint {
  pos: THREE.Vector3;
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
interface Root {
  a: THREE.Vector3;
  b: THREE.Vector3;
  r: number;
}

const PALETTE = ["#ffd2e7", "#ffc0de", "#ffe6f2", "#ffcae1", "#fff2f8", "#ffb9d9"];
const CORE_TINT = ["#ffb0d2", "#ffc2dd", "#ffa6cc"];

function makeTaperedTube(points: THREE.Vector3[], radii: number[], radial = 30) {
  const positions: number[] = [];
  const indices: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();

  points.forEach((p, i) => {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const tangent = next.clone().sub(prev).normalize();
    q.setFromUnitVectors(up, tangent);

    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const normal = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).applyQuaternion(q);
      const wobble = 1 + Math.sin(i * 1.7 + j * 1.9) * 0.028 + Math.sin(j * 3.1 + i * 0.8) * 0.018;
      const r = radii[i] * wobble;
      positions.push(p.x + normal.x * r, p.y + normal.y * r, p.z + normal.z * r);
    }
  });

  for (let i = 0; i < points.length - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + j;
      const d = (i + 1) * radial + ((j + 1) % radial);
      indices.push(a, c, b, b, c, d);
    }
  }

  const startCenter = positions.length / 3;
  positions.push(points[0].x, points[0].y, points[0].z);
  for (let j = 0; j < radial; j++) indices.push(startCenter, (j + 1) % radial, j);

  const endCenter = positions.length / 3;
  const lastRing = (points.length - 1) * radial;
  const last = points[points.length - 1];
  positions.push(last.x, last.y, last.z);
  for (let j = 0; j < radial; j++) indices.push(endCenter, lastRing + j, lastRing + ((j + 1) % radial));

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function makeBlossomCardPosition(rng: () => number, pos: THREE.Vector3, size: number) {
  const u = rng() * Math.PI * 2;
  const v = Math.acos(2 * rng() - 1);
  const rad = Math.pow(rng(), 0.38) * size * 1.14;
  const canopyShell = new THREE.Vector3(
    Math.sin(v) * Math.cos(u),
    Math.cos(v) * 0.52 - rng() * 0.16,
    Math.sin(v) * Math.sin(u)
  );
  return pos.clone().add(canopyShell.multiplyScalar(rad));
}

function buildTree(seed: number, density: number) {
  const rng = mulberry32(seed);
  const segs: Seg[] = [];
  const cards: Card[] = [];
  const veil: Card[] = [];
  const cores: Core[] = [];
  const roots: Root[] = [];
  const trunk: THREE.Vector3[] = [];
  const trunkRadii: number[] = [];

  const addCluster = (pos: THREE.Vector3, size: number, n: number) => {
    cores.push({
      pos: pos.clone(),
      radius: size * 0.42,
      tint: CORE_TINT[Math.floor(rng() * CORE_TINT.length)],
    });
    for (let i = 0; i < n; i++) {
      cards.push({
        pos: makeBlossomCardPosition(rng, pos, size),
        scale: 0.3 + rng() * 0.42,
        rot: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
        tint: PALETTE[Math.floor(rng() * PALETTE.length)],
      });
    }
  };

  const addHangingCanopy = (n: number) => {
    for (let i = 0; i < n; i++) {
      const sideBias = Math.pow(rng(), 0.72);
      const x = -3.25 + sideBias * 5.7 + Math.sin(i * 0.77) * 0.32;
      const z = -2.25 + rng() * 4.45 + Math.sin(i * 0.43) * 0.22;
      const edgeFalloff = Math.min(1, Math.abs(x + 0.25) / 3.2);
      const y = 2.06 + rng() * 1.18 - edgeFalloff * 0.16;
      const size = (0.48 + rng() * 0.5) * (density >= 1 ? 1 : 0.72);
      veil.push({
        pos: new THREE.Vector3(x, y, z),
        scale: size,
        rot: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
        tint: PALETTE[Math.floor(rng() * PALETTE.length)],
      });
    }
  };

  const addOverheadCanopy = (n: number) => {
    for (let i = 0; i < n; i++) {
      const x = -5.15 + rng() * 6.6 + Math.sin(i * 0.53) * 0.38;
      const z = -2.6 + rng() * 5.7 + Math.cos(i * 0.41) * 0.28;
      const openCenter = Math.max(0, Math.abs(x + 1.2) - 2.8);
      const y = 3.0 + rng() * 0.95 - openCenter * 0.05;
      const size = (0.5 + rng() * 0.55) * (density >= 1 ? 1 : 0.72);
      veil.push({
        pos: new THREE.Vector3(x, y, z),
        scale: size,
        rot: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
        tint: PALETTE[Math.floor(rng() * PALETTE.length)],
      });
    }
  };

  const addFeatureLimb = () => {
    const limb = [
      crown.clone().add(new THREE.Vector3(-0.18, 0.02, 0.05)),
      crown.clone().add(new THREE.Vector3(-1.25, 0.35, 0.22)),
      crown.clone().add(new THREE.Vector3(-2.55, 0.48, 0.58)),
      crown.clone().add(new THREE.Vector3(-3.9, 0.35, 1.06)),
      crown.clone().add(new THREE.Vector3(-5.2, 0.02, 1.58)),
    ];
    const radii = [0.2, 0.17, 0.135, 0.105];

    for (let i = 0; i < limb.length - 1; i++) {
      segs.push({ a: limb[i].clone(), b: limb[i + 1].clone(), r: radii[i] });
      if (i > 0) {
        addCluster(limb[i + 1], 0.78 + rng() * 0.28, Math.round((34 + rng() * 16) * density));
      }
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
  const trad = 0.48;
  const trunkSteps = 7;
  const trunkH = 3.35;
  for (let i = 0; i < trunkSteps; i++) {
    const seg = trunkH / trunkSteps;
    const next = tpos.clone().add(td.clone().multiplyScalar(seg));
    trunk.push(tpos.clone());
    trunkRadii.push(trad * (1 - (i / trunkSteps) * 0.5));
    td.add(new THREE.Vector3(Math.sin(i * 1.4) * 0.18, 0.04, Math.cos(i * 0.9) * 0.13));
    td.normalize();
    tpos = next;
  }
  trunk.push(tpos.clone());
  trunkRadii.push(trad * 0.48);
  const crown = tpos.clone();

  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rng() * 0.28;
    const len = 0.72 + rng() * 0.95;
    roots.push({
      a: new THREE.Vector3(Math.cos(a) * 0.2, 0.13, Math.sin(a) * 0.2),
      b: new THREE.Vector3(Math.cos(a) * len, 0.055 + rng() * 0.025, Math.sin(a) * len),
      r: 0.09 + rng() * 0.045,
    });
  }

  // ---- main limbs fanning out from the crown ----
  const nMain = 15;
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

  addFeatureLimb();
  addHangingCanopy(Math.round(164 * density));
  addOverheadCanopy(Math.round(74 * density));

  return { segs, trunk, trunkRadii, cards, veil, cores, roots };
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
  const rootRef = useRef<THREE.InstancedMesh>(null);
  const jointRef = useRef<THREE.InstancedMesh>(null);
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const cardRef = useRef<THREE.InstancedMesh>(null);
  const veilRef = useRef<THREE.InstancedMesh>(null);
  const cardMat = useRef<THREE.MeshStandardMaterial>(null);
  const veilMat = useRef<THREE.MeshStandardMaterial>(null);

  const tex = useMemo(makeBlossomTexture, []);
  const density = detail >= 1 ? 1 : 0.45;
  const { segs, trunk, trunkRadii, cards, veil, cores, roots } = useMemo(() => buildTree(seed, density), [seed, density]);
  const trunkGeometry = useMemo(() => makeTaperedTube(trunk, trunkRadii), [trunk, trunkRadii]);
  const joints = useMemo<Joint[]>(() => {
    const kept: Joint[] = [];
    segs.forEach((s, i) => {
      if (s.r > 0.2) kept.push({ pos: s.a.clone(), r: s.r * 0.92 });
    });
    return kept;
  }, [segs]);

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

    roots.forEach((s, i) => {
      const d = s.b.clone().sub(s.a);
      const len = d.length();
      const mid = s.a.clone().add(s.b).multiplyScalar(0.5);
      q.setFromUnitVectors(up, d.clone().normalize());
      m.compose(mid, q, new THREE.Vector3(s.r, len, s.r * 0.72));
      rootRef.current!.setMatrixAt(i, m);
    });
    rootRef.current!.instanceMatrix.needsUpdate = true;

    joints.forEach((j, i) => {
      m.compose(j.pos, new THREE.Quaternion(), new THREE.Vector3(j.r, j.r * 0.8, j.r));
      jointRef.current!.setMatrixAt(i, m);
    });
    jointRef.current!.instanceMatrix.needsUpdate = true;

    cores.forEach((b, i) => {
      m.compose(b.pos, new THREE.Quaternion(), new THREE.Vector3(b.radius, b.radius * 0.48, b.radius));
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

    veil.forEach((b, i) => {
      q.setFromEuler(b.rot);
      m.compose(b.pos, q, new THREE.Vector3(b.scale, b.scale, b.scale));
      veilRef.current!.setMatrixAt(i, m);
      c.set(b.tint);
      veilRef.current!.setColorAt(i, c);
    });
    veilRef.current!.instanceMatrix.needsUpdate = true;
    if (veilRef.current!.instanceColor) veilRef.current!.instanceColor.needsUpdate = true;
  }, [segs, joints, cards, veil, cores, roots]);

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
    if (veilMat.current) {
      veilMat.current.emissiveIntensity = motion
        ? 0.2 + Math.sin(state.clock.elapsedTime * 0.52 + 1.4) * 0.04
        : 0.2;
    }
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <primitive object={trunkGeometry} attach="geometry" />
        <meshStandardMaterial color="#69432f" roughness={0.98} metalness={0.02} />
      </mesh>

      <mesh position={[0.02, 0.16, 0.02]} scale={[0.72, 0.3, 0.58]} castShadow receiveShadow>
        <sphereGeometry args={[1, 24, 14]} />
        <meshStandardMaterial color="#5d392b" roughness={1} metalness={0.01} />
      </mesh>

      <instancedMesh ref={rootRef} args={[undefined, undefined, roots.length]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 18, 1]} />
        <meshStandardMaterial color="#5d392b" roughness={1} metalness={0.01} />
      </instancedMesh>

      <instancedMesh ref={barkRef} args={[undefined, undefined, segs.length]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 36, 2]} />
        <meshStandardMaterial color="#69432f" roughness={0.98} metalness={0.02} />
      </instancedMesh>

      <instancedMesh ref={jointRef} args={[undefined, undefined, joints.length]} castShadow receiveShadow>
        <sphereGeometry args={[1, 20, 12]} />
        <meshStandardMaterial color="#5d392b" roughness={1} metalness={0.01} />
      </instancedMesh>

      <instancedMesh ref={coreRef} args={[undefined, undefined, cores.length]} castShadow>
        <sphereGeometry args={[1, 20, 12]} />
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.34}
          depthWrite={false}
          roughness={0.9}
          emissive="#ff9ec9"
          emissiveIntensity={0.18}
        />
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

      <instancedMesh ref={veilRef} args={[undefined, undefined, veil.length]} castShadow>
        <planeGeometry args={[1.12, 1.12]} />
        <meshStandardMaterial
          ref={veilMat}
          map={tex}
          emissiveMap={tex}
          emissive="#ff7fb3"
          emissiveIntensity={0.16}
          vertexColors
          side={THREE.DoubleSide}
          transparent
          opacity={0.84}
          alphaTest={0.36}
          roughness={0.82}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
