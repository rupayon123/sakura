import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

const URL = `${import.meta.env.BASE_URL}models/spring_tree.glb`;
useGLTF.preload(URL);

export default function TreeModel({
  motion,
  scale = 3,
  sink = 0,
}: {
  motion: boolean;
  scale?: number;
  sink?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(URL);
  const blossomMats = useRef<THREE.MeshStandardMaterial[]>([]);

  const cloned = useMemo(() => {
    const s = scene.clone(true);
    blossomMats.current = [];

    const reskin = (m: any) => {
      if (!m || !m.color) return m;
      const mat = m.clone();
      const c: THREE.Color = mat.color;
      const isBlossom = c.r > 0.55 && c.r - c.g > 0.25; // pink / red (not yellow, white, green)
      const isBark = c.r < 0.45 && c.g < 0.35 && c.b < 0.32; // brown / dark
      if (isBlossom) {
        mat.emissive = mat.color.clone();
        mat.emissiveIntensity = 1.1;
        mat.toneMapped = false;
        mat.roughness = 0.6;
        blossomMats.current.push(mat);
      } else if (isBark) {
        mat.color = new THREE.Color("#2a1c26");
        mat.roughness = 0.95;
      }
      return mat;
    };

    s.traverse((o: any) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.material = Array.isArray(o.material) ? o.material.map(reskin) : reskin(o.material);
    });

    // center horizontally + ground the base
    const box = new THREE.Box3().setFromObject(s);
    const center = box.getCenter(new THREE.Vector3());
    s.position.x -= center.x;
    s.position.z -= center.z;
    s.position.y -= box.min.y;
    return s;
  }, [scene]);

  useFrame((state) => {
    if (group.current) {
      group.current.position.y = motion ? Math.sin(state.clock.elapsedTime * 0.45) * 0.06 : 0;
    }
    const pulse = motion ? 1.1 + Math.sin(state.clock.elapsedTime * 0.9) * 0.3 : 1.1;
    for (const m of blossomMats.current) m.emissiveIntensity = pulse;
  });

  return (
    <group ref={group} scale={scale} position={[0, -sink * scale, 0]}>
      <primitive object={cloned} />
    </group>
  );
}
