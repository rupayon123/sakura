import { useMemo } from "react";
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
            emissiveIntensity={0.04}
          />
        </mesh>
      ))}
      <mesh position={[0, -0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.92, 0.16, depth + 0.7]} />
        <meshStandardMaterial color={wood} roughness={0.82} />
      </mesh>
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
  const paper = light ? "#f6ead7" : "#aa8b91";
  const wood = light ? "#744331" : "#4b2d39";
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.08]} />
        <meshStandardMaterial color={paper} roughness={0.92} emissive={light ? "#f0b878" : "#382332"} emissiveIntensity={light ? 0.12 : 0.06} />
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

  const plaster = light ? "#f2ddce" : "#7a6571";
  const timber = light ? "#74402f" : "#4d2d3a";
  const darkTimber = light ? "#4a2e24" : "#2c202a";
  const roof = light ? "#5a6670" : "#2f3443";
  const stone = light ? "#b7afa1" : "#635f6b";

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
      {/* low foundation, clearly touching the ground */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.8, 0.44, 4.65]} />
        <meshStandardMaterial color={stone} map={stoneMap} roughness={1} />
      </mesh>

      {/* single-story house body */}
      <mesh position={[0, 1.22, -0.18]} castShadow receiveShadow>
        <boxGeometry args={[8.9, 1.9, 3.65]} />
        <meshStandardMaterial color={plaster} map={plasterMap} roughness={0.9} />
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
      <mesh position={[4.03, 0.98, 1.82]} castShadow>
        <boxGeometry args={[0.82, 1.34, 0.12]} />
        <meshStandardMaterial color={darkTimber} roughness={0.76} />
      </mesh>
      <group position={[3.55, 1.86, 1.925]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.92, 0.66, 0.06]} />
          <meshStandardMaterial color={light ? "#7d4e34" : "#5c3940"} roughness={0.82} />
        </mesh>
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[1.76, 0.58]} />
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
      {[-4.0, -2.0, 0, 2.0, 4.0].map((x) => (
        <mesh key={x} position={[x, 0.34, 2.82]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.55, 8]} />
          <meshStandardMaterial color={timber} roughness={0.86} />
        </mesh>
      ))}

      <GabledRoof position={[0, 2.62, -0.2]} width={10.8} depth={5.45} color={roof} wood={timber} roofMap={roofMap} />

      {/* small genkan steps into the garden */}
      <StoneStep position={[3.9, 0.19, 2.95]} width={1.6} depth={0.62} stoneMap={stoneMap} />
      <StoneStep position={[3.9, 0.08, 3.55]} width={2.0} depth={0.58} stoneMap={stoneMap} />

      {/* warm, house-scale lights */}
      {[
        [-4.0, 1.25, 1.86],
        [4.72, 1.18, 1.86],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[0.28, 0.36, 0.08]} />
            <meshStandardMaterial color="#fff0c8" emissive="#ffbd68" emissiveIntensity={light ? 1.35 : 2.2} toneMapped={false} />
          </mesh>
          <pointLight intensity={light ? 0.32 : 0.8} distance={4.6} color="#ffbd76" />
        </group>
      ))}
    </group>
  );
}
