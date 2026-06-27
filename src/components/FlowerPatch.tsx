import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Patch, FlowerKind } from "../content";

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

const PETAL_GEO = new THREE.SphereGeometry(1, 12, 8);
const CENTER_GEO = new THREE.SphereGeometry(0.06, 14, 14);
const LEAF_GEO = new THREE.SphereGeometry(1, 8, 6);

/* ---- a single flower head, shape depends on kind ---- */
function FlowerHead({
  kind,
  color,
  emissive,
  neon,
}: {
  kind: FlowerKind;
  color: string;
  emissive: number;
  neon: boolean;
}) {
  if (kind === "tulip") {
    return (
      <mesh scale={0.45} castShadow>
        <latheGeometry args={[TULIP_PROFILE, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissive}
          roughness={0.5}
          side={THREE.DoubleSide}
          toneMapped={!neon ? true : false}
        />
      </mesh>
    );
  }

  if (kind === "lavender") {
    return (
      <group>
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh
            key={i}
            position={[Math.sin(i * 1.3) * 0.025, 0.06 + i * 0.06, Math.cos(i * 1.3) * 0.025]}
          >
            <sphereGeometry args={[0.055 - i * 0.004, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissive}
              roughness={0.5}
              toneMapped={!neon ? true : false}
            />
          </mesh>
        ))}
      </group>
    );
  }

  // sakura / daisy / poppy → layered bowl of petals + a domed center
  const cfg =
    kind === "daisy"
      ? { count: 16, len: 0.2, wide: 0.045, tilt: 0.32, layers: 2 }
      : kind === "poppy"
      ? { count: 6, len: 0.21, wide: 0.18, tilt: 0.34, layers: 2 }
      : { count: 5, len: 0.18, wide: 0.14, tilt: 0.46, layers: 1 }; // sakura

  const rr = 0.09;
  const petals: JSX.Element[] = [];
  for (let l = 0; l < cfg.layers; l++) {
    const off = l * (Math.PI / cfg.count);
    const s = 1 - l * 0.28;
    for (let i = 0; i < cfg.count; i++) {
      const a = (i / cfg.count) * Math.PI * 2 + off;
      petals.push(
        <group key={`${l}-${i}`} rotation={[0, a, 0]}>
          <mesh
            geometry={PETAL_GEO}
            position={[rr, 0.02 + l * 0.03, 0]}
            rotation={[0, 0, -cfg.tilt]}
            scale={[cfg.len * s, 0.035, cfg.wide * s]}
            castShadow
          >
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissive}
              roughness={0.5}
              side={THREE.DoubleSide}
              toneMapped={!neon ? true : false}
            />
          </mesh>
        </group>
      );
    }
  }

  return (
    <group>
      {petals}
      <mesh geometry={CENTER_GEO} position={[0, 0.05, 0]}>
        <meshStandardMaterial
          color="#ffe9a8"
          emissive="#ffcf5d"
          emissiveIntensity={neon ? emissive * 0.8 : 0.15}
          toneMapped={!neon ? true : false}
        />
      </mesh>
    </group>
  );
}

/* ---- a patch = a flowering clump (foliage + flowers) at one spot ---- */
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
  const [hovered, setHovered] = useState(false);
  const neon = theme === "dark";

  const rad = THREE.MathUtils.degToRad(patch.angle);
  const base: [number, number, number] = [
    Math.sin(rad) * patch.radius,
    0,
    Math.cos(rad) * patch.radius,
  ];

  const flowers = useMemo(() => {
    const rng = (s: number) => {
      const x = Math.sin(s * 99.13 + patch.angle) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 10 }, (_, i) => ({
      x: (rng(i) - 0.5) * 1.7,
      z: (rng(i + 10) - 0.5) * 1.7,
      h: 0.42 + rng(i + 20) * 0.5,
      rot: rng(i + 30) * Math.PI * 2,
      lean: (rng(i + 50) - 0.5) * 0.3,
    }));
  }, [patch.angle]);

  const leaves = useMemo(() => {
    const rng = (s: number) => {
      const x = Math.sin(s * 71.7 + patch.angle * 3) * 24634.21;
      return x - Math.floor(x);
    };
    return Array.from({ length: 7 }, (_, i) => ({
      x: (rng(i) - 0.5) * 1.9,
      z: (rng(i + 5) - 0.5) * 1.9,
      s: 0.4 + rng(i + 9) * 0.4,
      rot: rng(i + 12) * Math.PI * 2,
    }));
  }, [patch.angle]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const target = active ? 1.2 : hovered ? 1.1 : 1;
    group.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
    group.current.position.y = active ? 0.12 + Math.sin(t * 2) * 0.03 : 0;
  });

  const emissive = neon
    ? dimmed
      ? 0.2
      : active || hovered
      ? 1.45
      : 0.95
    : active || hovered
    ? 0.4
    : 0.0;

  const discOpacity = neon
    ? dimmed
      ? 0.04
      : active || hovered
      ? 0.22
      : 0.1
    : active || hovered
    ? 0.18
    : 0;

  return (
    <group position={base}>
      {/* highlight disc (subtle by day, glow by night) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[1.6, 40]} />
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
        {/* leafy green foliage clump the flowers grow from */}
        {leaves.map((lf, i) => (
          <mesh
            key={`lf${i}`}
            geometry={LEAF_GEO}
            position={[lf.x, 0.12, lf.z]}
            rotation={[0, lf.rot, 0.3]}
            scale={[lf.s * 0.5, 0.12, lf.s]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={neon ? "#2f5238" : "#4d7a45"}
              emissive={neon ? "#173a22" : "#000000"}
              emissiveIntensity={neon ? 0.3 : 0}
              roughness={0.85}
            />
          </mesh>
        ))}

        {flowers.map((f, i) => (
          <group key={i} position={[f.x, 0, f.z]} rotation={[f.lean, f.rot, f.lean]}>
            {/* stem */}
            <mesh position={[0, f.h / 2, 0]} castShadow>
              <cylinderGeometry args={[0.018, 0.026, f.h, 6]} />
              <meshStandardMaterial color={neon ? "#3f5a3a" : "#5a7a4a"} roughness={0.8} />
            </mesh>
            <group position={[0, f.h, 0]} scale={1.15}>
              <FlowerHead kind={patch.flower} color={patch.color} emissive={emissive} neon={neon} />
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}
