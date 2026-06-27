import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { makeFloretTexture } from "../textures";
import type { Patch } from "../content";

// tulip-bud silhouette revolved into a lathe (for the family tulip beds)
const TULIP_PROFILE = [
  [0.0, 0.0],
  [0.09, 0.03],
  [0.18, 0.14],
  [0.24, 0.34],
  [0.24, 0.57],
  [0.18, 0.79],
  [0.1, 0.93],
  [0.0, 1.0],
].map(([x, y]) => new THREE.Vector2(x, y));

function seeded(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- a patch = a flowering bush (project) or a tulip clump (family) ---- */
export default function FlowerPatch({
  patch,
  active,
  dimmed,
  theme,
  onClick,
}: {
  patch: Patch;
  active: boolean;
  dimmed: boolean;
  theme: "dark" | "light";
  onClick: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const floretRef = useRef<THREE.InstancedMesh>(null);
  const floretMat = useRef<THREE.MeshStandardMaterial>(null);
  const cupRef = useRef<THREE.InstancedMesh>(null);
  const cupMat = useRef<THREE.MeshStandardMaterial>(null);
  const stemRef = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState(false);

  const neon = theme === "dark";
  const isTulip = patch.flower === "tulip";
  const tex = useMemo(makeFloretTexture, []);

  const rad = THREE.MathUtils.degToRad(patch.angle);
  const base: [number, number, number] = [
    Math.sin(rad) * patch.radius,
    0,
    Math.cos(rad) * patch.radius,
  ];

  // bush mound blobs (green foliage the flowers sit on)
  const mound = useMemo(() => {
    const r = seeded(Math.round(patch.angle * 13.7) + 5);
    return Array.from({ length: 6 }, () => ({
      x: (r() - 0.5) * 1.5,
      y: 0.18 + r() * 0.28,
      z: (r() - 0.5) * 1.5,
      s: 0.42 + r() * 0.34,
    }));
  }, [patch.angle]);

  // flower placements (florets for a bush, tulips for the family)
  const N = isTulip ? 26 : 78;
  const items = useMemo(() => {
    const r = seeded(Math.round(patch.angle * 91.3) + 11);
    return Array.from({ length: N }, () => {
      const ang = r() * Math.PI * 2;
      const rr = Math.sqrt(r()) * (isTulip ? 0.95 : 1.05);
      const dome = isTulip ? 0 : Math.cos(rr / 1.2) * 0.55; // mound height
      return {
        x: Math.cos(ang) * rr,
        z: Math.sin(ang) * rr,
        y: (isTulip ? 0 : 0.32 + dome) + r() * 0.12,
        rot: new THREE.Euler(r() * Math.PI, r() * Math.PI * 2, r() * Math.PI),
        yaw: r() * Math.PI * 2,
        s: isTulip ? 0.34 + r() * 0.16 : 0.2 + r() * 0.16,
        stemH: 0.3 + r() * 0.3,
        lean: (r() - 0.5) * 0.3,
      };
    });
  }, [patch.angle, N, isTulip]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();

    if (isTulip) {
      items.forEach((it, i) => {
        e.set(it.lean, it.yaw, it.lean * 0.5);
        q.setFromEuler(e);
        m.compose(new THREE.Vector3(it.x, it.stemH / 2, it.z), q, new THREE.Vector3(0.02, it.stemH, 0.02));
        stemRef.current!.setMatrixAt(i, m);
        m.compose(new THREE.Vector3(it.x, it.stemH, it.z), q, new THREE.Vector3(it.s, it.s, it.s));
        cupRef.current!.setMatrixAt(i, m);
      });
      stemRef.current!.instanceMatrix.needsUpdate = true;
      cupRef.current!.instanceMatrix.needsUpdate = true;
    } else {
      items.forEach((it, i) => {
        q.setFromEuler(it.rot);
        m.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(it.s, it.s, it.s));
        floretRef.current!.setMatrixAt(i, m);
      });
      floretRef.current!.instanceMatrix.needsUpdate = true;
    }
  }, [items, isTulip]);

  useFrame((state) => {
    if (group.current) {
      const target = active ? 1.18 : hovered ? 1.08 : 1;
      group.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
      group.current.position.y = active ? 0.1 + Math.sin(state.clock.elapsedTime * 2) * 0.03 : 0;
    }
    const glow = neon
      ? dimmed
        ? 0.25
        : active || hovered
        ? 1.5
        : 0.85
      : active || hovered
      ? 0.5
      : 0.04;
    if (floretMat.current) floretMat.current.emissiveIntensity = glow;
    if (cupMat.current) cupMat.current.emissiveIntensity = glow;
  });

  const greenLeaf = neon ? "#2f5238" : "#4f7a45";
  const discOpacity = neon
    ? dimmed
      ? 0.05
      : active || hovered
      ? 0.24
      : 0.12
    : active || hovered
    ? 0.18
    : 0;

  return (
    <group position={base}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <circleGeometry args={[1.7, 40]} />
        <meshBasicMaterial color={patch.color} transparent opacity={discOpacity} toneMapped={false} />
      </mesh>

      <group
        ref={group}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        {/* green foliage mound (the bush body) */}
        {!isTulip &&
          mound.map((b, i) => (
            <mesh key={i} position={[b.x, b.y, b.z]} scale={[b.s, b.s * 0.8, b.s]} castShadow receiveShadow>
              <icosahedronGeometry args={[1, 2]} />
              <meshStandardMaterial color={greenLeaf} roughness={0.9} flatShading />
            </mesh>
          ))}

        {/* a few leaves for the tulip clump */}
        {isTulip &&
          mound.slice(0, 4).map((b, i) => (
            <mesh
              key={i}
              position={[b.x * 0.5, 0.12, b.z * 0.5]}
              rotation={[0, i, 0.4]}
              scale={[0.18, 0.5, 0.5]}
              castShadow
            >
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color={greenLeaf} roughness={0.9} flatShading />
            </mesh>
          ))}

        {/* FLOWERS */}
        {isTulip ? (
          <>
            <instancedMesh ref={stemRef} args={[undefined, undefined, N]} castShadow>
              <cylinderGeometry args={[1, 1, 1, 6]} />
              <meshStandardMaterial color={greenLeaf} roughness={0.85} />
            </instancedMesh>
            <instancedMesh ref={cupRef} args={[undefined, undefined, N]} castShadow>
              <latheGeometry args={[TULIP_PROFILE, 16]} />
              <meshStandardMaterial
                ref={cupMat}
                color={patch.color}
                emissive={patch.color}
                emissiveIntensity={0.04}
                roughness={0.5}
                side={THREE.DoubleSide}
                toneMapped={!neon}
              />
            </instancedMesh>
          </>
        ) : (
          <instancedMesh ref={floretRef} args={[undefined, undefined, N]} castShadow>
            <planeGeometry args={[0.9, 0.9]} />
            <meshStandardMaterial
              ref={floretMat}
              map={tex}
              color={patch.color}
              emissive={patch.color}
              emissiveIntensity={0.04}
              side={THREE.DoubleSide}
              transparent
              alphaTest={0.38}
              roughness={0.7}
              toneMapped={!neon}
            />
          </instancedMesh>
        )}
      </group>
    </group>
  );
}
