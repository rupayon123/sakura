import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { makeHouseSignTexture, makePlasterTexture, makeRoofTileTexture, makeStoneTexture } from "../textures";

type Vec3 = [number, number, number];

function GabledRoof({
  position,
  width,
  depth,
  color,
  wood,
  roofMap,
}: {
  position: Vec3;
  width: number;
  depth: number;
  color: string;
  wood: string;
  roofMap: THREE.Texture;
}) {
  const slope = 0.24;
  const roofEdge = color === "#3b4153" ? "#293143" : "#596770";
  return (
    <group position={position}>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * width * 0.24, 0.22, 0]}
          rotation={[0, 0, -s * slope]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width * 0.57, 0.14, depth + 0.72]} />
          <meshStandardMaterial
            color={color}
            map={roofMap}
            roughness={0.82}
            metalness={0.04}
            emissive={color}
            emissiveIntensity={color === "#3b4153" ? 0.08 : 0.13}
          />
        </mesh>
      ))}
      {/* dark underside makes the eaves read as real depth rather than a slab */}
      <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.92, 0.16, depth + 0.7]} />
        <meshStandardMaterial color={wood} roughness={0.82} />
      </mesh>

      {/* roof rows and caps: modest tiled detail for a local home */}
      {[-1, 1].flatMap((s) =>
        Array.from({ length: 8 }, (_, i) => {
          const z = -depth * 0.43 + i * ((depth * 0.86) / 7);
          return (
            <mesh key={`${s}-${i}`} position={[s * width * 0.24, 0.315, z]} rotation={[0, 0, -s * slope]} castShadow>
              <boxGeometry args={[width * 0.52, 0.026, 0.035]} />
              <meshStandardMaterial color={roofEdge} roughness={0.8} metalness={0.04} />
            </mesh>
          );
        })
      )}
      <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, depth + 0.96, 18]} />
        <meshStandardMaterial color={roofEdge} roughness={0.78} metalness={0.04} />
      </mesh>
      {[-1, 1].map((z) => (
        <mesh key={`eave-${z}`} position={[0, -0.08, z * (depth * 0.5 + 0.42)]} castShadow>
          <boxGeometry args={[width + 1.08, 0.13, 0.16]} />
          <meshStandardMaterial color={wood} roughness={0.78} />
        </mesh>
      ))}
      <mesh position={[0, 0.86, 0]} castShadow>
        <boxGeometry args={[0.22, 0.16, depth + 0.82]} />
        <meshStandardMaterial color={wood} roughness={0.76} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (width * 0.48), -0.02, 0]} castShadow>
          <boxGeometry args={[0.16, 0.18, depth + 0.82]} />
          <meshStandardMaterial color={wood} roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
}

function ShojiPanel({
  position,
  width,
  height,
  light,
}: {
  position: Vec3;
  width: number;
  height: number;
  light: boolean;
}) {
  const paper = light ? "#f6ead7" : "#c1a4ab";
  const wood = light ? "#744331" : "#4b2d39";
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.08]} />
        <meshStandardMaterial color={paper} roughness={0.92} emissive={light ? "#f0b878" : "#6d4651"} emissiveIntensity={light ? 0.12 : 0.14} />
      </mesh>
      {[-0.45, 0, 0.45].map((x) => (
        <mesh key={x} position={[x * width, 0, 0.055]} castShadow>
          <boxGeometry args={[0.045, height, 0.08]} />
          <meshStandardMaterial color={wood} roughness={0.84} />
        </mesh>
      ))}
      {[-0.26, 0.26].map((y) => (
        <mesh key={y} position={[0, y * height, 0.06]} castShadow>
          <boxGeometry args={[width, 0.045, 0.08]} />
          <meshStandardMaterial color={wood} roughness={0.84} />
        </mesh>
      ))}
    </group>
  );
}

function StoneStep({ position, width, depth, stoneMap }: { position: Vec3; width: number; depth: number; stoneMap: THREE.Texture }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[width, 0.14, depth]} />
      <meshStandardMaterial color="#b7aea0" map={stoneMap} roughness={1} />
    </mesh>
  );
}

function WoodSlat({
  position,
  size,
  color,
}: {
  position: Vec3;
  size: Vec3;
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.86} />
    </mesh>
  );
}

function PorchPot({ position, light, accent }: { position: Vec3; light: boolean; accent: string }) {
  const clay = light ? "#8c5a42" : "#51313a";
  const leaf = light ? "#5f7f4c" : "#3f6548";
  return (
    <group position={position}>
      <mesh position={[0, 0.13, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.16, 0.26, 12]} />
        <meshStandardMaterial color={clay} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.28, 0]} receiveShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.045, 12]} />
        <meshStandardMaterial color={light ? "#493526" : "#281e25"} roughness={1} />
      </mesh>
      {[-0.09, 0.08, 0.0].map((x, i) => (
        <mesh key={`leaf-${i}`} position={[x, 0.34 + i * 0.018, i % 2 ? 0.04 : -0.035]} rotation={[0.65, 0.25 * i, 0.5 - i * 0.42]} castShadow>
          <sphereGeometry args={[0.075, 8, 6]} />
          <meshStandardMaterial color={leaf} roughness={0.8} />
        </mesh>
      ))}
      {[[-0.035, 0.42, 0.02], [0.055, 0.39, -0.025]].map(([x, y, z], i) => (
        <mesh key={`flower-${i}`} position={[x, y, z]} rotation={[0, 0.35 * i, 0]} castShadow>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={light ? 0.05 : 0.14} roughness={0.72} />
        </mesh>
      ))}
    </group>
  );
}

function RainChain({ position, light }: { position: Vec3; light: boolean }) {
  const metal = light ? "#756b60" : "#8d8790";
  return (
    <group position={position}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, -i * 0.16, 0]} rotation={[Math.PI / 2, i % 2 ? Math.PI / 2 : 0, 0]} castShadow>
          <torusGeometry args={[0.065, 0.011, 8, 14]} />
          <meshStandardMaterial color={metal} roughness={0.55} metalness={0.12} />
        </mesh>
      ))}
      <mesh position={[0, -1.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.11, 14]} />
        <meshStandardMaterial color={light ? "#a79e92" : "#5b5762"} roughness={1} />
      </mesh>
    </group>
  );
}

/**
 * A modest local Japanese home: low stone foundation, warm timber, shoji
 * panels, engawa veranda, and one deep tiled roof grounded into the garden.
 */
export default function Building({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  theme = "light",
  onClick,
}: {
  position?: Vec3;
  rotation?: number;
  scale?: number;
  theme?: "dark" | "light";
  onClick?: () => void;
}) {
  const light = theme === "light";
  const plasterMap = useMemo(makePlasterTexture, []);
  const roofMap = useMemo(makeRoofTileTexture, []);
  const stoneMap = useMemo(makeStoneTexture, []);
  const signMap = useMemo(makeHouseSignTexture, []);

  const plaster = light ? "#f2ddce" : "#927785";
  const timber = light ? "#74402f" : "#4d2d3a";
  const darkTimber = light ? "#4a2e24" : "#2c202a";
  const roof = light ? "#6f7d84" : "#3b4153";
  const stone = light ? "#b7afa1" : "#635f6b";

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (onClick) document.body.style.cursor = "auto";
      }}
    >
      <group scale={[0.82, 1, 1]}>
        {/* low foundation, clearly touching the ground */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.8, 0.44, 4.65]} />
        <meshStandardMaterial color={stone} map={stoneMap} roughness={1} />
      </mesh>
      {[-3.9, -2.55, -1.2, 0.15, 1.5, 2.85, 4.2].map((x) => (
        <mesh key={x} position={[x, 0.46, 2.36]} castShadow receiveShadow>
          <boxGeometry args={[0.035, 0.22, 0.08]} />
          <meshStandardMaterial color={light ? "#8f887e" : "#4d4a54"} roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 0.49, 2.39]} castShadow receiveShadow>
        <boxGeometry args={[9.7, 0.035, 0.08]} />
        <meshStandardMaterial color={light ? "#8f887e" : "#4d4a54"} roughness={1} />
      </mesh>
      <mesh position={[0, 0.07, 2.92]} castShadow receiveShadow>
        <boxGeometry args={[9.2, 0.09, 0.5]} />
        <meshStandardMaterial color={light ? "#aca18f" : "#55515b"} map={stoneMap} roughness={1} />
      </mesh>

      {/* single-story house body */}
      <mesh position={[0, 1.22, -0.18]} castShadow receiveShadow>
        <boxGeometry args={[8.9, 1.9, 3.65]} />
        <meshStandardMaterial
          color={plaster}
          map={plasterMap}
          roughness={0.9}
          emissive={light ? "#000000" : "#4f3340"}
          emissiveIntensity={light ? 0 : 0.08}
        />
      </mesh>

      {/* timber frame */}
      {[-4.25, -2.1, 0, 2.1, 4.25].map((x) => (
        <mesh key={x} position={[x, 1.25, 1.7]} castShadow>
          <boxGeometry args={[0.16, 1.92, 0.14]} />
          <meshStandardMaterial color={timber} roughness={0.82} />
        </mesh>
      ))}
      {[0.42, 1.32, 2.15].map((y) => (
        <mesh key={y} position={[0, y, 1.72]} castShadow>
          <boxGeometry args={[9.1, 0.12, 0.14]} />
          <meshStandardMaterial color={timber} roughness={0.82} />
        </mesh>
      ))}

      {/* shoji and entry */}
      <ShojiPanel position={[-2.7, 1.16, 1.78]} width={1.55} height={1.18} light={light} />
      <ShojiPanel position={[0.0, 1.16, 1.78]} width={1.72} height={1.18} light={light} />
      <ShojiPanel position={[2.65, 1.16, 1.78]} width={1.55} height={1.18} light={light} />
      <mesh position={[4.03, 0.98, 1.76]} castShadow>
        <boxGeometry args={[1.06, 1.5, 0.12]} />
        <meshStandardMaterial color={light ? "#39241d" : "#211a20"} roughness={0.9} />
      </mesh>
      <mesh position={[4.03, 0.98, 1.82]} castShadow>
        <boxGeometry args={[0.82, 1.34, 0.12]} />
        <meshStandardMaterial color={darkTimber} roughness={0.76} />
      </mesh>
      <group position={[3.5, 1.9, 1.925]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.18, 0.74, 0.06]} />
          <meshStandardMaterial color={light ? "#7d4e34" : "#5c3940"} roughness={0.82} />
        </mesh>
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[2.02, 0.64]} />
          <meshStandardMaterial
            map={signMap}
            roughness={0.74}
            emissive={light ? "#000000" : "#6b3a35"}
            emissiveIntensity={light ? 0 : 0.16}
          />
        </mesh>
      </group>

      {/* engawa veranda */}
      <mesh position={[-0.35, 0.5, 2.38]} castShadow receiveShadow>
        <boxGeometry args={[8.9, 0.16, 0.9]} />
        <meshStandardMaterial color={light ? "#8a5940" : "#543240"} roughness={0.84} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const z = 2.0 + i * 0.13;
        return (
          <WoodSlat
            key={`plank-${i}`}
            position={[-0.35, 0.59, z]}
            size={[8.68, 0.018, 0.018]}
            color={light ? "#60402f" : "#382833"}
          />
        );
      })}
      <mesh position={[-0.35, 0.62, 2.86]} castShadow receiveShadow>
        <boxGeometry args={[8.72, 0.08, 0.12]} />
        <meshStandardMaterial color={darkTimber} roughness={0.82} />
      </mesh>
      {[-4.0, -2.0, 0, 2.0, 4.0].map((x) => (
        <mesh key={x} position={[x, 0.34, 2.82]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.55, 8]} />
          <meshStandardMaterial color={timber} roughness={0.86} />
        </mesh>
      ))}

      <mesh position={[3.9, 0.675, 2.83]} castShadow receiveShadow>
        <boxGeometry args={[1.12, 0.028, 0.4]} />
        <meshStandardMaterial color={light ? "#3c2b24" : "#211a20"} roughness={0.92} />
      </mesh>
      <RainChain position={[4.92, 1.72, 2.78]} light={light} />

      <GabledRoof position={[0, 2.62, -0.2]} width={10.8} depth={5.45} color={roof} wood={timber} roofMap={roofMap} />
      <mesh position={[0, 2.15, 2.78]} castShadow>
        <boxGeometry args={[9.72, 0.2, 0.16]} />
        <meshStandardMaterial color={darkTimber} roughness={0.82} />
      </mesh>
      <mesh position={[0, 2.08, 2.9]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 9.55, 14]} />
        <meshStandardMaterial color={light ? "#4f5960" : "#252a35"} roughness={0.76} metalness={0.04} />
      </mesh>
      {[-4.2, -3.36, -2.52, -1.68, -0.84, 0, 0.84, 1.68, 2.52, 3.36, 4.2].map((x) => (
        <mesh key={`rafter-${x}`} position={[x, 2.02, 2.77]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.36, 0.08]} />
          <meshStandardMaterial color={timber} roughness={0.84} />
        </mesh>
      ))}

      {/* small genkan steps into the garden */}
      <StoneStep position={[3.9, 0.035, 4.72]} width={2.85} depth={0.42} stoneMap={stoneMap} />
      <StoneStep position={[3.9, 0.19, 2.95]} width={1.6} depth={0.62} stoneMap={stoneMap} />
      <StoneStep position={[3.9, 0.08, 3.55]} width={2.0} depth={0.58} stoneMap={stoneMap} />
      <StoneStep position={[3.9, 0.045, 4.18]} width={2.28} depth={0.46} stoneMap={stoneMap} />
      <PorchPot position={[2.58, 0.11, 3.12]} light={light} accent={light ? "#f5a7bf" : "#ff9fcb"} />
      <PorchPot position={[5.08, 0.11, 3.18]} light={light} accent={light ? "#e9d77e" : "#ffe5a0"} />

      {/* warm, house-scale lights */}
      {[
        [-4.0, 1.25, 1.86],
        [4.72, 1.18, 1.86],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[0.28, 0.36, 0.08]} />
            <meshStandardMaterial color="#fff0c8" emissive="#ffbd68" emissiveIntensity={light ? 1.35 : 3.25} toneMapped={false} />
          </mesh>
          <pointLight intensity={light ? 0.32 : 1.9} distance={8.4} color="#ffbd76" />
        </group>
      ))}
      </group>
    </group>
  );
}
