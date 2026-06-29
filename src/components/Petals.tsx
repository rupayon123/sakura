import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { makePetalTexture } from "../textures";

export default function Petals({
  count = 800,
  play = true,
  theme = "light",
}: {
  count?: number;
  play?: boolean;
  theme?: "dark" | "light";
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tex = useMemo(makePetalTexture, []);

  const petals = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 34,
      y: Math.random() * 18,
      z: (Math.random() - 0.5) * 34,
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      rz: Math.random() * Math.PI,
      speed: 0.35 + Math.random() * 0.75,
      sway: 0.4 + Math.random() * 1.4,
      spin: 0.3 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      scale: 0.14 + Math.random() * 0.16,
    }));
  }, [count]);

  useFrame((state, dt) => {
    if (!ref.current || !play) return;
    const t = state.clock.elapsedTime;
    petals.forEach((p, i) => {
      p.y -= p.speed * dt;
      if (p.y < -0.5) {
        p.y = 16 + Math.random() * 5;
        p.x = (Math.random() - 0.5) * 34;
        p.z = (Math.random() - 0.5) * 34;
      }
      const swayX = Math.sin(t * 0.6 + p.phase) * p.sway * 0.18;
      const swayZ = Math.cos(t * 0.5 + p.phase) * p.sway * 0.18;
      dummy.position.set(p.x + swayX, p.y, p.z + swayZ);
      // tumbling flutter
      dummy.rotation.set(
        p.rx + t * p.spin,
        p.ry + t * p.spin * 0.6,
        p.rz + Math.sin(t * 1.5 + p.phase) * 0.6
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.85, 1]} />
      <meshStandardMaterial
        map={tex}
        emissiveMap={tex}
        emissive="#ff86bd"
        emissiveIntensity={theme === "dark" ? 0.38 : 0.28}
        side={THREE.DoubleSide}
        transparent
        alphaTest={0.4}
        roughness={0.8}
        toneMapped={theme !== "dark"}
      />
    </instancedMesh>
  );
}
