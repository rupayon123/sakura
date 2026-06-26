import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { bakeMeshToVertexColors } from "../lib/bake";
import { projectPatches } from "../content";

const B = import.meta.env.BASE_URL;
const TULIP = B + "models/tulip.glb";
const FLOWER = B + "models/flower_single.glb";
useGLTF.preload(TULIP);
useGLTF.preload(FLOWER);

function rng32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* grassy ground the garden sits on */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <circleGeometry args={[34, 48]} />
      <meshStandardMaterial color="#3c5a2a" roughness={1} />
    </mesh>
  );
}

/* instanced grass blades */
function Grass({ count = 4000 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const r = rng32(7);
    return Array.from({ length: count }, () => {
      const ang = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * 15;
      return {
        x: Math.cos(ang) * rad,
        z: Math.sin(ang) * rad - 2,
        h: 0.2 + r() * 0.28,
        rot: r() * Math.PI,
        tilt: (r() - 0.5) * 0.3,
        shade: 0.9 + r() * 0.5,
      };
    });
  }, [count]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const c = new THREE.Color();
    data.forEach((g, i) => {
      e.set(g.tilt, g.rot, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(g.x, g.h / 2, g.z), q, new THREE.Vector3(0.06, g.h, 0.06));
      ref.current!.setMatrixAt(i, m);
      c.setRGB(0.34 * g.shade, 0.58 * g.shade, 0.22 * g.shade);
      ref.current!.setColorAt(i, c);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [data]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <coneGeometry args={[1, 1, 4]} />
      <meshStandardMaterial vertexColors roughness={1} />
    </instancedMesh>
  );
}

/* real tulip plant, baked to one geometry, instanced into the family field */
function Tulips({ count = 260 }: { count?: number }) {
  const { scene } = useGLTF(TULIP);
  const geo = useMemo(() => {
    // recolor the red tulip petals to family pink before baking
    const s = scene.clone(true);
    s.traverse((o: any) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      o.material = mats.map((m: any) => {
        const mat = m.clone();
        const c = mat.color;
        if (c && c.r > 0.45 && c.r > c.g + 0.08 && c.r > c.b + 0.05) c.set("#ff6fae");
        return mat;
      });
    });
    return bakeMeshToVertexColors(s, { groundY: true });
  }, [scene]);
  const baseH = useMemo(() => {
    const b = geo.boundingBox!;
    return b.max.y - b.min.y || 1;
  }, [geo]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const r = rng32(42);
    return Array.from({ length: count }, () => {
      const ang = r() * Math.PI * 2;
      const rad = 1.5 + Math.sqrt(r()) * 13;
      return {
        x: Math.cos(ang) * rad,
        z: Math.sin(ang) * rad - 2,
        rot: r() * Math.PI * 2,
        s: (0.5 / baseH) * (0.7 + r() * 0.7),
        lean: (r() - 0.5) * 0.18,
      };
    });
  }, [count, baseH]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    data.forEach((d, i) => {
      e.set(d.lean, d.rot, d.lean * 0.5);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(d.x, 0, d.z), q, new THREE.Vector3(d.s, d.s, d.s));
      ref.current!.setMatrixAt(i, m);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [data, geo]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} castShadow>
      <meshStandardMaterial vertexColors roughness={0.6} toneMapped={false} />
    </instancedMesh>
  );
}

/* one real flower, recolored to a project's color */
function RealFlower({
  color,
  position,
  scale,
  rot,
}: {
  color: string;
  position: [number, number, number];
  scale: number;
  rot: number;
}) {
  const { scene } = useGLTF(FLOWER);
  const clone = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o: any) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      o.material = mats.map((m: any) => {
        const mat = m.clone();
        if (/flower/i.test(m.name || "")) {
          mat.color = new THREE.Color(color);
          mat.emissive = new THREE.Color(color);
          mat.emissiveIntensity = 0.5;
          mat.toneMapped = false;
        }
        return mat;
      });
    });
    return s;
  }, [scene, color]);
  return <primitive object={clone} position={position} scale={scale} rotation={[0, rot, 0]} />;
}

/* clusters of real flowers, one cluster per project */
function ProjectFlowers() {
  return (
    <>
      {projectPatches.map((p, i) => {
        const ang = (i / projectPatches.length) * Math.PI * 1.4 - Math.PI * 0.7;
        const cx = Math.sin(ang) * 7.5;
        const cz = 3 - Math.cos(ang) * 2.5;
        const r = rng32(i + 1);
        return (
          <group key={p.id} position={[cx, 0, cz]}>
            {Array.from({ length: 4 }).map((_, j) => (
              <RealFlower
                key={j}
                color={p.color}
                position={[(r() - 0.5) * 1.6, 0, (r() - 0.5) * 1.6]}
                scale={0.45 + r() * 0.2}
                rot={r() * Math.PI * 2}
              />
            ))}
          </group>
        );
      })}
    </>
  );
}

export default function GardenLayer() {
  return (
    <Canvas
      className="garden"
      shadows={false}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 2.0, 12], fov: 42 }}
      onCreated={({ camera }) => camera.lookAt(0, 0.2, -5)}
    >
      <fog attach="fog" args={["#0a0710", 16, 34]} />
      <ambientLight intensity={0.9} color="#ffe6f1" />
      <directionalLight position={[5, 9, 6]} intensity={1.4} color="#fff0f6" />
      <pointLight position={[0, 3, 4]} intensity={9} color="#ff7eb6" distance={22} />
      <Ground />
      <Tulips />
      <ProjectFlowers />
    </Canvas>
  );
}
