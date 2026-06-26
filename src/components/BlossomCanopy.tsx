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

/**
 * A dense, lush dome of textured blossom "cards" — layered over a real tree's
 * crown so the branches read as heavy with bloom (reference-style fullness).
 */
export default function BlossomCanopy({
  center = [0, 6.4, 0],
  radii = [3.1, 2.1, 3.1],
  count = 2600,
  motion = true,
}: {
  center?: [number, number, number];
  radii?: [number, number, number];
  count?: number;
  motion?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const massRef = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const massMat = useRef<THREE.MeshStandardMaterial>(null);
  const tex = useMemo(makeBlossomTexture, []);

  const { cards, mass } = useMemo(() => {
    const rng = mulberry32(9981);
    const [cx, cy, cz] = center;
    const [rx, ry, rz] = radii;
    const palette = ["#ffd9ea", "#ffc2dd", "#ff9ecf", "#ffffff", "#ffe8f1", "#ff8ec4"];
    const cards = Array.from({ length: count }, () => {
      const u = rng() * Math.PI * 2;
      const v = Math.acos(2 * rng() - 1);
      const rad = Math.pow(rng(), 0.42); // shell-biased → full surface
      return {
        pos: new THREE.Vector3(
          cx + Math.sin(v) * Math.cos(u) * rx * rad,
          cy + Math.cos(v) * ry * rad,
          cz + Math.sin(v) * Math.sin(u) * rz * rad
        ),
        scale: 0.32 + rng() * 0.4,
        rot: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
        tint: palette[Math.floor(rng() * palette.length)],
      };
    });
    const mass = Array.from({ length: Math.round(count * 0.018) + 14 }, () => {
      const u = rng() * Math.PI * 2;
      const v = Math.acos(2 * rng() - 1);
      const rad = Math.pow(rng(), 0.8) * 0.62;
      return {
        pos: new THREE.Vector3(
          cx + Math.sin(v) * Math.cos(u) * rx * rad,
          cy + Math.cos(v) * ry * rad,
          cz + Math.sin(v) * Math.sin(u) * rz * rad
        ),
        scale: 0.5 + rng() * 0.7,
        tint: palette[Math.floor(rng() * palette.length)],
      };
    });
    return { cards, mass };
  }, [center, radii, count]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    cards.forEach((b, i) => {
      q.setFromEuler(b.rot);
      m.compose(b.pos, q, new THREE.Vector3(b.scale, b.scale, b.scale));
      ref.current!.setMatrixAt(i, m);
      c.set(b.tint);
      ref.current!.setColorAt(i, c);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
    mass.forEach((b, i) => {
      m.compose(b.pos, new THREE.Quaternion(), new THREE.Vector3(b.scale, b.scale, b.scale));
      massRef.current!.setMatrixAt(i, m);
      c.set(b.tint);
      massRef.current!.setColorAt(i, c);
    });
    massRef.current!.instanceMatrix.needsUpdate = true;
    if (massRef.current!.instanceColor) massRef.current!.instanceColor.needsUpdate = true;
  }, [cards, mass]);

  useFrame((state) => {
    const pulse = motion ? 0.55 + Math.sin(state.clock.elapsedTime * 0.9) * 0.3 : 0.55;
    if (mat.current) mat.current.emissiveIntensity = pulse;
    if (massMat.current) massMat.current.emissiveIntensity = pulse * 0.4;
  });

  return (
    <group>
      <instancedMesh ref={massRef} args={[undefined, undefined, mass.length]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          ref={massMat}
          vertexColors
          roughness={0.85}
          emissive="#ff5d8f"
          emissiveIntensity={0.2}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh ref={ref} args={[undefined, undefined, cards.length]} castShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          ref={mat}
          map={tex}
          emissiveMap={tex}
          emissive="#ff5d8f"
          emissiveIntensity={0.55}
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
