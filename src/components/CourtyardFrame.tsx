import * as THREE from "three";

type Vec3 = [number, number, number];

function BambooFence({
  position,
  rotation = 0,
  length,
  theme,
}: {
  position: Vec3;
  rotation?: number;
  length: number;
  theme: "dark" | "light";
}) {
  const light = theme === "light";
  const bamboo = light ? "#8d7548" : "#55483a";
  const cord = light ? "#443126" : "#2b2126";
  const posts = Math.ceil(length / 1.4) + 1;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: posts }, (_, i) => {
        const x = -length / 2 + i * (length / (posts - 1));
        return (
          <mesh key={i} position={[x, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, 0.6, 8]} />
            <meshStandardMaterial color={bamboo} roughness={0.86} />
          </mesh>
        );
      })}
      {[0.24, 0.45].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, length, 8]} />
          <meshStandardMaterial color={bamboo} roughness={0.86} />
        </mesh>
      ))}
      {Array.from({ length: Math.ceil(length / 2.8) }, (_, i) => {
        const x = -length / 2 + 1.4 + i * 2.8;
        return (
          <mesh key={i} position={[x, 0.35, 0.035]} castShadow>
            <boxGeometry args={[0.06, 0.22, 0.04]} />
            <meshStandardMaterial color={cord} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function GardenStone({ position, scale, theme }: { position: Vec3; scale: Vec3; theme: "dark" | "light" }) {
  const light = theme === "light";
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={light ? "#b7b0a0" : "#5f5a66"} roughness={1} />
    </mesh>
  );
}

function LowGardenWall({
  position,
  rotation = 0,
  length,
  theme,
}: {
  position: Vec3;
  rotation?: number;
  length: number;
  theme: "dark" | "light";
}) {
  const light = theme === "light";
  const plaster = light ? "#d9c9b8" : "#59505f";
  const stone = light ? "#aaa294" : "#57535e";
  const cap = light ? "#7b5139" : "#3b2d35";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.24, 0.36]} />
        <meshStandardMaterial color={stone} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.5, 0.28]} />
        <meshStandardMaterial color={plaster} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[length + 0.18, 0.11, 0.42]} />
        <meshStandardMaterial color={cap} roughness={0.84} />
      </mesh>
    </group>
  );
}

export default function CourtyardFrame({ theme }: { theme: "dark" | "light" }) {
  const light = theme === "light";

  return (
    <group>
      <BambooFence position={[-7.4, 0, 5.2]} rotation={0.34} length={6.4} theme={theme} />
      <BambooFence position={[7.5, 0, 4.9]} rotation={-0.38} length={5.8} theme={theme} />
      <BambooFence position={[-8.8, 0, -3.3]} rotation={Math.PI / 2} length={5.8} theme={theme} />
      <BambooFence position={[9.0, 0, -3.0]} rotation={Math.PI / 2} length={5.4} theme={theme} />

      <LowGardenWall position={[6.2, 0, -3.15]} rotation={-0.08} length={7.4} theme={theme} />
      <LowGardenWall position={[-6.2, 0, -3.6]} rotation={0.1} length={5.4} theme={theme} />

      <GardenStone position={[-6.5, 0.13, 1.8]} scale={[0.72, 0.18, 0.48]} theme={theme} />
      <GardenStone position={[6.9, 0.12, 1.0]} scale={[0.62, 0.16, 0.42]} theme={theme} />
      <GardenStone position={[5.6, 0.1, -4.2]} scale={[0.48, 0.12, 0.32]} theme={theme} />

      {!light && (
        <group>
          <mesh position={[-10.5, 13.5, -22]} renderOrder={-1}>
            <sphereGeometry args={[1.15, 32, 20]} />
            <meshBasicMaterial color="#eaf3ff" toneMapped={false} />
          </mesh>
          <pointLight position={[-10.5, 12.5, -17]} intensity={5.5} distance={44} color="#a9c9ff" />
        </group>
      )}
    </group>
  );
}
