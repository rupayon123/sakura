import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/* deterministic RNG so the field is the same every load */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// tulip-bud silhouette (radius, height) revolved into a lathe — tapers closed at top
const CUP_PROFILE = [
  [0.0, 0.0],
  [0.09, 0.03],
  [0.18, 0.14],
  [0.24, 0.34],
  [0.24, 0.57],
  [0.18, 0.79],
  [0.1, 0.93],
  [0.0, 1.0],
].map(([x, y]) => new THREE.Vector2(x, y));

/**
 * The family. Tulips carpet the whole garden — the foundation everything
 * (including the tree) grows from.
 */
export default function TulipField({
  count = 440,
  innerR = 2.0,
  outerR = 9.6,
  play = true,
}: {
  count?: number;
  innerR?: number;
  outerR?: number;
  play?: boolean;
}) {
  const cups = useRef<THREE.InstancedMesh>(null);
  const stems = useRef<THREE.InstancedMesh>(null);
  const cupMat = useRef<THREE.MeshStandardMaterial>(null);

  const tulips = useMemo(() => {
    const rng = mulberry32(77123);
    const palette = ["#ff5d8f", "#ff7eb6", "#ff9ecf", "#ffb3c6", "#e84d8a", "#ffd0e0"];
    return Array.from({ length: count }, () => {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng() * (outerR * outerR - innerR * innerR) + innerR * innerR);
      const stemH = 0.26 + rng() * 0.26;
      const cupS = 0.28 + rng() * 0.2;
      return {
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        stemH,
        cupS,
        rot: rng() * Math.PI * 2,
        lean: (rng() - 0.5) * 0.25,
        color: palette[Math.floor(rng() * palette.length)],
      };
    });
  }, [count, innerR, outerR]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const c = new THREE.Color();

    tulips.forEach((t, i) => {
      e.set(t.lean, t.rot, t.lean * 0.5);
      q.setFromEuler(e);
      // stem
      m.compose(
        new THREE.Vector3(t.x, t.stemH / 2, t.z),
        q,
        new THREE.Vector3(0.014, t.stemH, 0.014)
      );
      stems.current!.setMatrixAt(i, m);
      // cup sits on the stem top
      m.compose(new THREE.Vector3(t.x, t.stemH, t.z), q, new THREE.Vector3(t.cupS, t.cupS, t.cupS));
      cups.current!.setMatrixAt(i, m);
      c.set(t.color);
      cups.current!.setColorAt(i, c);
    });
    cups.current!.instanceMatrix.needsUpdate = true;
    stems.current!.instanceMatrix.needsUpdate = true;
    if (cups.current!.instanceColor) cups.current!.instanceColor.needsUpdate = true;
  }, [tulips]);

  useFrame((state) => {
    if (cupMat.current) {
      cupMat.current.emissiveIntensity = play
        ? 0.4 + Math.sin(state.clock.elapsedTime * 0.6) * 0.1
        : 0.4;
    }
  });

  return (
    <group>
      <instancedMesh ref={stems} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshStandardMaterial color="#4f6e47" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={cups} args={[undefined, undefined, count]} castShadow receiveShadow>
        <latheGeometry args={[CUP_PROFILE, 14]} />
        <meshStandardMaterial
          ref={cupMat}
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.45}
          metalness={0.0}
          emissive="#ff5d8f"
          emissiveIntensity={0.4}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
