import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { makeGrassTexture, makePetalTexture } from "../textures";

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
  const petalTex = useMemo(makePetalTexture, []);
  const fallen = useRef<THREE.InstancedMesh>(null);

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

  // a stone stepping path arcing across the foreground
  const path = useMemo(() => {
    const r = rng(88);
    const N = 16;
    return Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      const x = -9 + t * 18;
      const z = 9.5 - Math.sin(t * Math.PI) * 4.5; // arcs toward the camera
      return {
        x: x + (r() - 0.5) * 0.4,
        z: z + (r() - 0.5) * 0.4,
        rot: r() * Math.PI,
        s: 0.5 + r() * 0.22,
      };
    });
  }, []);
  const pathRef = useRef<THREE.InstancedMesh>(null);

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
  }, [petals, path]);

  return (
    <group>
      {/* grass field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[46, 72]} />
        <meshStandardMaterial
          map={grass}
          color={light ? "#ffffff" : "#5a6a52"}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* soft earth ring under the trees so the trunks feel planted */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <ringGeometry args={[0, 2.4, 40]} />
        <meshStandardMaterial color={light ? "#6f5a44" : "#3a3026"} roughness={1} />
      </mesh>

      {/* stone stepping path */}
      <instancedMesh ref={pathRef} args={[undefined, undefined, path.length]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 10]} />
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
