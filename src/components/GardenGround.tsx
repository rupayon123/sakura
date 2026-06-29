import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { makeGrassTexture, makePetalTexture, makeStoneTexture } from "../textures";

/* deterministic RNG */
function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeTerrainGeometry(radius = 42, segments = 96) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const index = (x: number, z: number) => z * (segments + 1) + x;

  for (let iz = 0; iz <= segments; iz++) {
    const z = -radius + (iz / segments) * radius * 2;
    for (let ix = 0; ix <= segments; ix++) {
      const x = -radius + (ix / segments) * radius * 2;
      const dist = Math.hypot(x, z);
      const edgeRise = Math.pow(Math.max(0, (dist - 23) / 19), 2) * 0.22;
      const houseSettle = -Math.exp(-((x * x) / 38 + ((z + 8.6) * (z + 8.6)) / 13)) * 0.035;
      const pathSettle = -Math.exp(-(((x + 1.0) * (x + 1.0)) / 3.8 + ((z - 0.3) * (z - 0.3)) / 72)) * 0.025;
      const ripple = Math.sin(x * 0.23 + z * 0.16) * 0.035 + Math.sin(x * 0.51 - z * 0.21) * 0.018;
      const y = dist > radius ? -0.16 : ripple + edgeRise + houseSettle + pathSettle;
      positions.push(x, y, z);
      uvs.push((x / radius + 1) * 0.5, (z / radius + 1) * 0.5);
    }
  }

  for (let iz = 0; iz < segments; iz++) {
    for (let ix = 0; ix < segments; ix++) {
      const cx = -radius + ((ix + 0.5) / segments) * radius * 2;
      const cz = -radius + ((iz + 0.5) / segments) * radius * 2;
      if (Math.hypot(cx, cz) > radius) continue;
      const a = index(ix, iz);
      const b = index(ix + 1, iz);
      const c = index(ix, iz + 1);
      const d = index(ix + 1, iz + 1);
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function mainPathPoint(t: number) {
  return {
    x: -2.15 + t * 2.85 + Math.sin(t * Math.PI) * 0.82,
    z: 6.8 - t * 13.1,
  };
}

/**
 * The garden floor: a grass field with a stone path and a scatter of fallen
 * cherry-blossom petals — the courtyard ground.
 */
export default function GardenGround({
  theme,
  petalCount = 700,
}: {
  theme: "dark" | "light";
  petalCount?: number;
}) {
  const light = theme === "light";
  const grass = useMemo(makeGrassTexture, []);
  const terrain = useMemo(() => makeTerrainGeometry(), []);
  const stone = useMemo(makeStoneTexture, []);
  const petalTex = useMemo(makePetalTexture, []);
  const fallen = useRef<THREE.InstancedMesh>(null);
  const footpathRef = useRef<THREE.InstancedMesh>(null);
  const gravelRef = useRef<THREE.InstancedMesh>(null);
  const dappleRef = useRef<THREE.InstancedMesh>(null);
  const plazaRef = useRef<THREE.InstancedMesh>(null);
  const mossRef = useRef<THREE.InstancedMesh>(null);
  const dryStreamRef = useRef<THREE.InstancedMesh>(null);
  const edgingRef = useRef<THREE.InstancedMesh>(null);

  const petals = useMemo(() => {
    const r = rng(4242);
    return Array.from({ length: petalCount }, () => {
      const mode = r();
      let x = 0;
      let z = 0;
      if (mode < 0.42) {
        const a = r() * Math.PI * 2;
        const rad = Math.sqrt(r()) * 5.9;
        x = 4.35 + Math.cos(a) * rad;
        z = 0.1 + Math.sin(a) * rad * 0.68;
      } else if (mode < 0.68) {
        const t = r();
        const p = mainPathPoint(t);
        const side = r() > 0.5 ? 1 : -1;
        x = p.x + side * (0.25 + r() * 0.86);
        z = p.z + (r() - 0.5) * 0.55;
      } else if (mode < 0.8) {
        x = 2.6 + (r() - 0.5) * 3.5;
        z = -6.1 + (r() - 0.5) * 1.9;
      } else {
        const a = r() * Math.PI * 2;
        const rad = Math.sqrt(r()) * 22;
        x = Math.cos(a) * rad;
        z = Math.sin(a) * rad;
      }
      return {
        x,
        z,
        rot: r() * Math.PI * 2,
        s: 0.12 + r() * 0.12,
      };
    });
  }, [petalCount]);

  // smaller side stepping stones; the main path to the house stays open.
  const path = useMemo(() => {
    const r = rng(88);
    const N = 5;
    return Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      const x = 6.45 + Math.sin(t * Math.PI * 1.2) * 0.62;
      const z = 1.55 - t * 4.7;
      return {
        x: x + (r() - 0.5) * 0.28,
        z: z + (r() - 0.5) * 0.28,
        rot: r() * Math.PI,
        s: 0.16 + r() * 0.08,
      };
    });
  }, []);
  const pathRef = useRef<THREE.InstancedMesh>(null);

  const footpath = useMemo(() => {
    const r = rng(5097);
    const colors = light
      ? ["#d7c38e", "#e0cd9b", "#cdb985", "#ead7a5"]
      : ["#625648", "#756254", "#584e42", "#837061"];
    const segments: { x: number; z: number; rot: number; sx: number; sz: number; color: string }[] = [];
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      const p = mainPathPoint(t);
      segments.push({
        x: p.x + (r() - 0.5) * 0.18,
        z: p.z + (r() - 0.5) * 0.16,
        rot: (r() - 0.5) * 0.62,
        sx: 0.88 + Math.sin(t * Math.PI) * 0.42 + r() * 0.18,
        sz: 0.32 + r() * 0.12,
        color: colors[Math.floor(r() * colors.length)],
      });
    }
    return segments;
  }, [light]);

  const gravel = useMemo(() => {
    const r = rng(8831);
    const colors = light
      ? ["#d6c9ae", "#c6b89d", "#e0d3b8", "#b8ab92"]
      : ["#7a737b", "#8a8089", "#6b6871", "#968a91"];
    const pebbles: { x: number; z: number; rot: number; sx: number; sz: number; color: string }[] = [];

    for (let i = 0; i < 78; i++) {
      const t = r();
      const side = r() > 0.5 ? 1 : -1;
      const p = mainPathPoint(t);
      const x = p.x + side * (0.5 + r() * 0.82);
      const z = p.z + (r() - 0.5) * 0.54;
      pebbles.push({
        x,
        z,
        rot: r() * Math.PI,
        sx: 0.045 + r() * 0.095,
        sz: 0.035 + r() * 0.085,
        color: colors[Math.floor(r() * colors.length)],
      });
    }

    for (let i = 0; i < 18; i++) {
      pebbles.push({
        x: 3.9 + (r() - 0.5) * 3.0,
        z: -6.1 + (r() - 0.5) * 1.6,
        rot: r() * Math.PI,
        sx: 0.05 + r() * 0.12,
        sz: 0.04 + r() * 0.09,
        color: colors[Math.floor(r() * colors.length)],
      });
    }

    return pebbles;
  }, [light]);

  const dapple = useMemo(() => {
    const r = rng(26402);
    const tones = light
      ? ["#566d2f", "#6f833c", "#496028", "#7f944a"]
      : ["#1c2a24", "#22352c", "#2a2531", "#263b2f"];
    const patches: { x: number; z: number; rot: number; sx: number; sz: number; color: string }[] = [];

    for (let i = 0; i < 42; i++) {
      const a = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * 9.8;
      const x = 4.35 + Math.cos(a) * rad;
      const z = 0.1 + Math.sin(a) * rad * 0.72;
      const clearHouse = !(z < -6.4 && Math.abs(x) < 5.4);
      const clearEntry = !(z < -4.9 && z > -8.6 && x > 2.4 && x < 5.3);
      if (!clearHouse || !clearEntry) continue;
      patches.push({
        x,
        z,
        rot: r() * Math.PI,
        sx: 0.65 + r() * 1.9,
        sz: 0.18 + r() * 0.68,
        color: tones[Math.floor(r() * tones.length)],
      });
    }

    return patches;
  }, [light]);

  const plaza = useMemo(() => {
    const r = rng(1288);
    const colors = light
      ? ["#ded3bf", "#eadfca", "#d3c7af", "#e2d4bb", "#c8bba4"]
      : ["#9b939e", "#aaa1ab", "#8a8491", "#b3a8ad", "#96909d"];
    const tiles: { x: number; z: number; rot: number; sx: number; sz: number; color: string }[] = [];
    for (let i = 0; i < 21; i++) {
      const t = i / 20;
      const p = mainPathPoint(t);
      const halfWidth = 0.52 + Math.sin(t * Math.PI) * 0.22;
      const lanes = t > 0.78 && r() > 0.72 ? [0, r() > 0.5 ? -1 : 1] : [0];
      for (const lane of lanes) {
        tiles.push({
          x: p.x + lane * halfWidth + (r() - 0.5) * 0.16,
          z: p.z + (r() - 0.5) * 0.18,
          rot: (r() - 0.5) * 0.34,
          sx: 0.34 + r() * 0.14,
          sz: 0.26 + r() * 0.1,
          color: colors[Math.floor(r() * colors.length)],
        });
      }
    }
    for (let x = -3.2; x <= 3.2; x += 1.05) {
      tiles.push({
        x: x + (r() - 0.5) * 0.08,
        z: -7.35 + (r() - 0.5) * 0.12,
        rot: (r() - 0.5) * 0.1,
        sx: 0.86 + r() * 0.16,
        sz: 0.58 + r() * 0.16,
        color: colors[Math.floor(r() * colors.length)],
      });
    }
    [
      { x: 1.25, z: -6.24, sx: 0.48, sz: 0.34 },
      { x: 1.96, z: -6.18, sx: 0.54, sz: 0.36 },
      { x: 2.7, z: -6.12, sx: 0.5, sz: 0.34 },
      { x: 3.42, z: -6.04, sx: 0.58, sz: 0.36 },
    ].forEach((tile, i) => {
      tiles.push({
        x: tile.x + (r() - 0.5) * 0.06,
        z: tile.z + (r() - 0.5) * 0.08,
        rot: (r() - 0.5) * 0.24 + (i % 2 ? 0.08 : -0.06),
        sx: tile.sx + r() * 0.08,
        sz: tile.sz + r() * 0.08,
        color: colors[Math.floor(r() * colors.length)],
      });
    });
    return tiles;
  }, [light]);

  const mossIslands = useMemo(() => {
    const r = rng(1977);
    const islands: { x: number; z: number; rot: number; sx: number; sz: number; color: string }[] = [];
    const anchors = [
      { x: -5.1, z: 1.8, sx: 1.9, sz: 0.58 },
      { x: -4.0, z: -1.25, sx: 1.55, sz: 0.5 },
      { x: 5.95, z: 1.25, sx: 1.45, sz: 0.52 },
      { x: 6.3, z: -1.7, sx: 1.65, sz: 0.48 },
      { x: -2.7, z: 4.5, sx: 1.8, sz: 0.48 },
      { x: 2.65, z: -5.45, sx: 1.35, sz: 0.42 },
      { x: -4.2, z: -6.9, sx: 1.45, sz: 0.42 },
      { x: 7.45, z: 4.0, sx: 1.25, sz: 0.38 },
    ];
    const palette = light
      ? ["#7c9a4d", "#8fad58", "#6f8d46", "#9cb568"]
      : ["#415d43", "#4d6a4e", "#374f3d", "#596e51"];
    anchors.forEach((a) => {
      islands.push({
        x: a.x + (r() - 0.5) * 0.22,
        z: a.z + (r() - 0.5) * 0.18,
        rot: r() * Math.PI,
        sx: a.sx * (0.88 + r() * 0.26),
        sz: a.sz * (0.86 + r() * 0.28),
        color: palette[Math.floor(r() * palette.length)],
      });
    });
    return islands;
  }, [light]);

  const dryStream = useMemo(() => {
    const r = rng(62401);
    const colors = light
      ? ["#cfc3aa", "#d9ceb8", "#bfb39a", "#e3d7bf"]
      : ["#5d5a64", "#6c6670", "#55525c", "#77707a"];
    const segments: { x: number; z: number; rot: number; sx: number; sz: number; color: string }[] = [];

    for (let i = 0; i < 22; i++) {
      const t = i / 21;
      const bend = Math.sin(t * Math.PI * 1.18);
      segments.push({
        x: -5.9 + t * 3.55 + bend * 0.7 + (r() - 0.5) * 0.14,
        z: 5.5 - t * 10.15 + Math.sin(t * Math.PI * 2.1) * 0.28 + (r() - 0.5) * 0.12,
        rot: -0.5 + bend * 0.42 + (r() - 0.5) * 0.2,
        sx: 0.62 + Math.sin(t * Math.PI) * 0.42 + r() * 0.18,
        sz: 0.18 + r() * 0.09,
        color: colors[Math.floor(r() * colors.length)],
      });
    }

    return segments;
  }, [light]);

  const dryStreamEdging = useMemo(() => {
    const r = rng(62499);
    const colors = light
      ? ["#d7ccb8", "#cbbfae", "#e2d7c4", "#bfb6a5"]
      : ["#8f8794", "#9b929d", "#7e7984", "#a69ca5"];
    const stones: { x: number; z: number; rot: number; sx: number; sz: number; color: string }[] = [];

    dryStream.forEach((s, i) => {
      if (i % 2 === 0 && r() > 0.45) return;
      [-1, 1].forEach((side) => {
        const nx = -Math.sin(s.rot) * side;
        const nz = Math.cos(s.rot) * side;
        const spread = s.sx * (0.55 + r() * 0.2);
        stones.push({
          x: s.x + nx * spread + (r() - 0.5) * 0.12,
          z: s.z + nz * spread + (r() - 0.5) * 0.12,
          rot: r() * Math.PI,
          sx: 0.045 + r() * 0.052,
          sz: 0.035 + r() * 0.048,
          color: colors[Math.floor(r() * colors.length)],
        });
      });
    });

    return stones;
  }, [dryStream, light]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    petals.forEach((p, i) => {
      e.set(-Math.PI / 2, 0, p.rot); // lie flat on the ground
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x, 0.02, p.z), q, new THREE.Vector3(p.s, p.s, p.s));
      fallen.current!.setMatrixAt(i, m);
    });
    fallen.current!.instanceMatrix.needsUpdate = true;

    path.forEach((p, i) => {
      e.set(0, p.rot, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x, 0.06, p.z), q, new THREE.Vector3(p.s, 0.075, p.s * 0.82));
      pathRef.current!.setMatrixAt(i, m);
    });
    pathRef.current!.instanceMatrix.needsUpdate = true;

    const c = new THREE.Color();
    footpath.forEach((p, i) => {
      e.set(-Math.PI / 2, 0, p.rot);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x, 0.024, p.z), q, new THREE.Vector3(p.sx, p.sz, 1));
      footpathRef.current!.setMatrixAt(i, m);
      c.set(p.color);
      footpathRef.current!.setColorAt(i, c);
    });
    footpathRef.current!.instanceMatrix.needsUpdate = true;
    if (footpathRef.current!.instanceColor) footpathRef.current!.instanceColor.needsUpdate = true;

    gravel.forEach((p, i) => {
      e.set(-Math.PI / 2, 0, p.rot);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x, 0.034, p.z), q, new THREE.Vector3(p.sx, p.sz, 1));
      gravelRef.current!.setMatrixAt(i, m);
      c.set(p.color);
      gravelRef.current!.setColorAt(i, c);
    });
    gravelRef.current!.instanceMatrix.needsUpdate = true;
    if (gravelRef.current!.instanceColor) gravelRef.current!.instanceColor.needsUpdate = true;

    dapple.forEach((p, i) => {
      e.set(0, p.rot, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x, 0.016, p.z), q, new THREE.Vector3(p.sx, 0.01, p.sz));
      dappleRef.current!.setMatrixAt(i, m);
      c.set(p.color);
      dappleRef.current!.setColorAt(i, c);
    });
    dappleRef.current!.instanceMatrix.needsUpdate = true;
    if (dappleRef.current!.instanceColor) dappleRef.current!.instanceColor.needsUpdate = true;

    plaza.forEach((p, i) => {
      e.set(0, p.rot, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x, 0.045, p.z), q, new THREE.Vector3(p.sx, 0.05, p.sz));
      plazaRef.current!.setMatrixAt(i, m);
      c.set(p.color);
      plazaRef.current!.setColorAt(i, c);
    });
    plazaRef.current!.instanceMatrix.needsUpdate = true;
    if (plazaRef.current!.instanceColor) plazaRef.current!.instanceColor.needsUpdate = true;

    mossIslands.forEach((p, i) => {
      e.set(0, p.rot, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x, 0.028, p.z), q, new THREE.Vector3(p.sx, 0.025, p.sz));
      mossRef.current!.setMatrixAt(i, m);
      c.set(p.color);
      mossRef.current!.setColorAt(i, c);
    });
    mossRef.current!.instanceMatrix.needsUpdate = true;
    if (mossRef.current!.instanceColor) mossRef.current!.instanceColor.needsUpdate = true;

    dryStream.forEach((p, i) => {
      e.set(-Math.PI / 2, 0, p.rot);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x, 0.022, p.z), q, new THREE.Vector3(p.sx, p.sz, 1));
      dryStreamRef.current!.setMatrixAt(i, m);
      c.set(p.color);
      dryStreamRef.current!.setColorAt(i, c);
    });
    dryStreamRef.current!.instanceMatrix.needsUpdate = true;
    if (dryStreamRef.current!.instanceColor) dryStreamRef.current!.instanceColor.needsUpdate = true;

    dryStreamEdging.forEach((p, i) => {
      e.set(0, p.rot, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x, 0.046, p.z), q, new THREE.Vector3(p.sx, 0.024, p.sz));
      edgingRef.current!.setMatrixAt(i, m);
      c.set(p.color);
      edgingRef.current!.setColorAt(i, c);
    });
    edgingRef.current!.instanceMatrix.needsUpdate = true;
    if (edgingRef.current!.instanceColor) edgingRef.current!.instanceColor.needsUpdate = true;
  }, [petals, path, footpath, gravel, dapple, plaza, mossIslands, dryStream, dryStreamEdging]);

  return (
    <group>
      {/* grass field */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <primitive object={terrain} attach="geometry" />
        <meshStandardMaterial
          map={grass}
          color={light ? "#adc877" : "#74836f"}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* soft shade cast by the single sakura canopy, kept low and transparent */}
      <instancedMesh ref={dappleRef} args={[undefined, undefined, dapple.length]}>
        <circleGeometry args={[1, 18]} />
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={light ? 0.16 : 0.1}
          roughness={1}
          metalness={0}
          depthWrite={false}
        />
      </instancedMesh>

      {/* compacted soil below the walkway gives the stones a built-in garden bed */}
      <instancedMesh ref={footpathRef} args={[undefined, undefined, footpath.length]} receiveShadow>
        <circleGeometry args={[1, 28]} />
        <meshStandardMaterial
          vertexColors
          roughness={1}
          metalness={0}
          emissive={light ? "#8a6f3c" : "#3c332b"}
          emissiveIntensity={light ? 0.03 : 0.18}
          transparent
          opacity={light ? 0.28 : 0.36}
          depthWrite={false}
        />
      </instancedMesh>

      <instancedMesh ref={gravelRef} args={[undefined, undefined, gravel.length]}>
        <circleGeometry args={[1, 8]} />
        <meshStandardMaterial
          vertexColors
          roughness={1}
          metalness={0}
          transparent
          opacity={light ? 0.42 : 0.5}
          depthWrite={false}
        />
      </instancedMesh>

      {/* irregular garden path to the house */}
      <instancedMesh ref={plazaRef} args={[undefined, undefined, plaza.length]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          vertexColors
          map={stone}
          color={light ? "#f2e6d1" : "#c8bcc6"}
          roughness={0.94}
          metalness={0.02}
          emissive={light ? "#d6c2a3" : "#75697c"}
          emissiveIntensity={light ? 0.28 : 0.4}
        />
      </instancedMesh>

      {/* low moss and planting islands break up the lawn without adding shrub/tree silhouettes */}
      <instancedMesh ref={mossRef} args={[undefined, undefined, mossIslands.length]}>
        <cylinderGeometry args={[1, 1, 1, 28]} />
        <meshStandardMaterial
          map={grass}
          color={light ? "#91ad5c" : "#5f765c"}
          roughness={1}
          metalness={0}
          emissive={light ? "#5b7328" : "#4e6a55"}
          emissiveIntensity={light ? 0.12 : 0.24}
          transparent
          opacity={light ? 0.54 : 0.46}
          depthWrite={false}
        />
      </instancedMesh>

      {/* raked gravel ribbon: low, open garden texture rather than another path */}
      <instancedMesh ref={dryStreamRef} args={[undefined, undefined, dryStream.length]} receiveShadow>
        <circleGeometry args={[1, 36]} />
        <meshStandardMaterial
          vertexColors
          map={stone}
          color={light ? "#e0d4bd" : "#8d8490"}
          roughness={1}
          metalness={0}
          transparent
          opacity={light ? 0.48 : 0.38}
          emissive={light ? "#c7b690" : "#605766"}
          emissiveIntensity={light ? 0.12 : 0.24}
          depthWrite={false}
        />
      </instancedMesh>

      <instancedMesh ref={edgingRef} args={[undefined, undefined, dryStreamEdging.length]} receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          vertexColors
          color={light ? "#d8ccb8" : "#9a929f"}
          roughness={1}
          metalness={0}
          emissive={light ? "#c4b59f" : "#6f6674"}
          emissiveIntensity={light ? 0.18 : 0.22}
        />
      </instancedMesh>

      {/* soft earth ring under the single sakura so the trunk feels planted */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.35, 0.005, 0.1]} receiveShadow>
        <ringGeometry args={[0, 2.4, 40]} />
        <meshStandardMaterial color={light ? "#6f5a44" : "#4f4032"} roughness={1} />
      </mesh>

      {/* stone stepping path */}
      <instancedMesh ref={pathRef} args={[undefined, undefined, path.length]} receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={light ? "#b8ad99" : "#6b646c"} roughness={1} />
      </instancedMesh>

      {/* fallen petals */}
      <instancedMesh ref={fallen} args={[undefined, undefined, petalCount]}>
        <planeGeometry args={[0.8, 1]} />
        <meshStandardMaterial
          map={petalTex}
          color={light ? "#ff8fc0" : "#e084ad"}
          side={THREE.DoubleSide}
          transparent
          alphaTest={0.4}
          roughness={0.85}
          emissive={light ? "#000000" : "#ff6fae"}
          emissiveIntensity={light ? 0 : 0.4}
          toneMapped={!light ? false : true}
        />
      </instancedMesh>
    </group>
  );
}
