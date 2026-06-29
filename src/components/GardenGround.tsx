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
  const stone = useMemo(makeStoneTexture, []);
  const petalTex = useMemo(makePetalTexture, []);
  const fallen = useRef<THREE.InstancedMesh>(null);
  const plazaRef = useRef<THREE.InstancedMesh>(null);

  const petals = useMemo(() => {
    const r = rng(4242);
    return Array.from({ length: petalCount }, () => {
      const a = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * 22;
      return {
        x: Math.cos(a) * rad,
        z: Math.sin(a) * rad,
        rot: r() * Math.PI * 2,
        s: 0.12 + r() * 0.12,
      };
    });
  }, [petalCount]);

  // smaller side stepping stones; the main path to the house stays open.
  const path = useMemo(() => {
    const r = rng(88);
    const N = 12;
    return Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      const x = 6.6 + Math.sin(t * Math.PI * 1.2) * 1.35;
      const z = 7.8 - t * 11.8;
      return {
        x: x + (r() - 0.5) * 0.28,
        z: z + (r() - 0.5) * 0.28,
        rot: r() * Math.PI,
        s: 0.34 + r() * 0.18,
      };
    });
  }, []);
  const pathRef = useRef<THREE.InstancedMesh>(null);

  const plaza = useMemo(() => {
    const r = rng(1288);
    const colors = light
      ? ["#d8d0c2", "#eee4d4", "#cbc3b7", "#e4d9c9", "#bfb8ae"]
      : ["#98939d", "#a8a1aa", "#898491", "#b0a6a9", "#96909d"];
    const tiles: { x: number; z: number; rot: number; sx: number; sz: number; color: string }[] = [];
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      const centerX = -1.1 + Math.sin(t * Math.PI * 1.08) * 1.25;
      const z = 8.7 - t * 15.7;
      const halfWidth = 0.78 + Math.sin(t * Math.PI) * 0.42;
      const lanes = r() > 0.68 ? [0, r() > 0.5 ? -1 : 1] : [0];
      for (const lane of lanes) {
        tiles.push({
          x: centerX + lane * halfWidth + (r() - 0.5) * 0.16,
          z: z + (r() - 0.5) * 0.18,
          rot: (r() - 0.5) * 0.34,
          sx: 0.38 + r() * 0.16,
          sz: 0.3 + r() * 0.12,
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
    return tiles;
  }, [light]);

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
      m.compose(new THREE.Vector3(p.x, 0.05, p.z), q, new THREE.Vector3(p.s, 0.08, p.s * 0.82));
      pathRef.current!.setMatrixAt(i, m);
    });
    pathRef.current!.instanceMatrix.needsUpdate = true;

    const c = new THREE.Color();
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
  }, [petals, path, plaza]);

  return (
    <group>
      {/* grass field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[42, 72]} />
        <meshStandardMaterial
          map={grass}
          color={light ? "#cfe7a0" : "#67705d"}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* irregular garden path to the house */}
      <instancedMesh ref={plazaRef} args={[undefined, undefined, plaza.length]}>
        <cylinderGeometry args={[1, 1, 1, 7]} />
        <meshStandardMaterial
          vertexColors
          map={stone}
          color={light ? "#fff7e7" : "#d0c6ce"}
          roughness={0.94}
          metalness={0.02}
          emissive={light ? "#e9d7bf" : "#5f5668"}
          emissiveIntensity={light ? 0.44 : 0.34}
        />
      </instancedMesh>

      {/* soft earth ring under the single sakura so the trunk feels planted */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.7, 0.005, 0.2]} receiveShadow>
        <ringGeometry args={[0, 2.4, 40]} />
        <meshStandardMaterial color={light ? "#6f5a44" : "#3a3026"} roughness={1} />
      </mesh>

      {/* stone stepping path */}
      <instancedMesh ref={pathRef} args={[undefined, undefined, path.length]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 9]} />
        <meshStandardMaterial color={light ? "#b8b1a2" : "#5a5550"} roughness={1} />
      </instancedMesh>

      {/* fallen petals */}
      <instancedMesh ref={fallen} args={[undefined, undefined, petalCount]}>
        <planeGeometry args={[0.8, 1]} />
        <meshStandardMaterial
          map={petalTex}
          color={light ? "#ff8fc0" : "#c76b95"}
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
