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
      <sphereGeometry args={[1, 18, 10]} />
      <meshStandardMaterial color={light ? "#b7b0a0" : "#5f5a66"} roughness={1} />
    </mesh>
  );
}

function EarthBerm({ position, scale, theme }: { position: Vec3; scale: Vec3; theme: "dark" | "light" }) {
  const light = theme === "light";
  return (
    <mesh position={position} scale={scale} receiveShadow>
      <sphereGeometry args={[1, 36, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial
        color={light ? "#a5b86d" : "#314637"}
        roughness={1}
        emissive={light ? "#50601f" : "#23392f"}
        emissiveIntensity={light ? 0.03 : 0.18}
      />
    </mesh>
  );
}

function HorizonHaze({ theme }: { theme: "dark" | "light" }) {
  const light = theme === "light";
  return (
    <group>
      <mesh position={[-7, 0.72, -23.8]} renderOrder={-2}>
        <planeGeometry args={[34, 1.55]} />
        <meshBasicMaterial
          color={light ? "#ffe0bf" : "#40304b"}
          transparent
          opacity={light ? 0.28 : 0.22}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[14, 0.58, -25.6]} renderOrder={-2}>
        <planeGeometry args={[28, 1.25]} />
        <meshBasicMaterial
          color={light ? "#fff0d7" : "#2f2f4c"}
          transparent
          opacity={light ? 0.18 : 0.14}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function BackGardenWall({ theme }: { theme: "dark" | "light" }) {
  const light = theme === "light";
  const plaster = light ? "#ead9c8" : "#6e5a67";
  const timber = light ? "#744331" : "#3f2a35";
  const cap = light ? "#687680" : "#343b4e";
  const stone = light ? "#b8ad9a" : "#5f5b65";
  const wallRuns = [
    { x: -8.4, z: -13.95, w: 9.2, r: 0.03 },
    { x: 6.2, z: -14.25, w: 10.6, r: -0.04 },
  ];

  return (
    <group>
      {wallRuns.map((run, i) => (
        <group key={i} position={[run.x, 0, run.z]} rotation={[0, run.r, 0]}>
          <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[run.w, 0.84, 0.18]} />
            <meshStandardMaterial
              color={plaster}
              roughness={0.95}
              emissive={light ? "#000000" : "#3d303b"}
              emissiveIntensity={light ? 0 : 0.12}
            />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[run.w + 0.28, 0.14, 0.36]} />
            <meshStandardMaterial color={cap} roughness={0.82} metalness={0.03} />
          </mesh>
          {Array.from({ length: Math.ceil(run.w / 1.8) + 1 }, (_, post) => {
            const x = -run.w / 2 + post * (run.w / Math.ceil(run.w / 1.8));
            return (
              <mesh key={post} position={[x, 0.48, 0.03]} castShadow receiveShadow>
                <boxGeometry args={[0.13, 0.92, 0.26]} />
                <meshStandardMaterial color={timber} roughness={0.86} />
              </mesh>
            );
          })}
          <mesh position={[0, 0.06, 0.04]} castShadow receiveShadow>
            <boxGeometry args={[run.w + 0.14, 0.12, 0.28]} />
            <meshStandardMaterial color={stone} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SideGardenWall({ theme }: { theme: "dark" | "light" }) {
  const light = theme === "light";
  const plaster = light ? "#e8d6c6" : "#675565";
  const timber = light ? "#70422f" : "#3d2934";
  const cap = light ? "#67747c" : "#343a4d";
  const runs = [
    { x: 10.1, z: -0.55, w: 8.8, r: Math.PI / 2 },
    { x: -10.25, z: -1.25, w: 7.6, r: Math.PI / 2 },
  ];

  return (
    <group>
      {runs.map((run, i) => (
        <group key={i} position={[run.x, 0, run.z]} rotation={[0, run.r, 0]}>
          <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
            <boxGeometry args={[run.w, 0.68, 0.16]} />
            <meshStandardMaterial
              color={plaster}
              roughness={0.95}
              emissive={light ? "#000000" : "#382e39"}
              emissiveIntensity={light ? 0 : 0.1}
            />
          </mesh>
          <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
            <boxGeometry args={[run.w + 0.22, 0.12, 0.3]} />
            <meshStandardMaterial color={cap} roughness={0.84} metalness={0.03} />
          </mesh>
          {Array.from({ length: Math.ceil(run.w / 2.2) + 1 }, (_, post) => {
            const x = -run.w / 2 + post * (run.w / Math.ceil(run.w / 2.2));
            return (
              <mesh key={post} position={[x, 0.36, 0.03]} castShadow receiveShadow>
                <boxGeometry args={[0.1, 0.7, 0.2]} />
                <meshStandardMaterial color={timber} roughness={0.86} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

export default function CourtyardFrame({ theme }: { theme: "dark" | "light" }) {
  const light = theme === "light";

  return (
    <group>
      <EarthBerm position={[-16, -0.5, -15.8]} scale={[12, 1.18, 3.4]} theme={theme} />
      <EarthBerm position={[14, -0.52, -16.8]} scale={[14, 1.12, 3.6]} theme={theme} />
      <EarthBerm position={[0, -0.62, -19.2]} scale={[24, 1.26, 3.8]} theme={theme} />
      <EarthBerm position={[-9.5, -0.48, -22]} scale={[15, 1.65, 5.2]} theme={theme} />
      <EarthBerm position={[8.5, -0.5, -23.5]} scale={[13, 1.45, 4.8]} theme={theme} />
      <EarthBerm position={[0, -0.55, -27]} scale={[22, 1.75, 4.8]} theme={theme} />
      <HorizonHaze theme={theme} />
      <BackGardenWall theme={theme} />
      <SideGardenWall theme={theme} />

      <BambooFence position={[-9.6, 0, 3.7]} rotation={0.58} length={5.2} theme={theme} />
      <BambooFence position={[8.9, 0, 4.0]} rotation={-0.48} length={5.1} theme={theme} />
      <BambooFence position={[-8.8, 0, -3.3]} rotation={Math.PI / 2} length={5.8} theme={theme} />
      <BambooFence position={[9.0, 0, -3.0]} rotation={Math.PI / 2} length={5.4} theme={theme} />

      <GardenStone position={[-7.15, 0.08, 1.2]} scale={[0.42, 0.08, 0.28]} theme={theme} />
      <GardenStone position={[7.25, 0.075, 0.65]} scale={[0.36, 0.075, 0.25]} theme={theme} />
      <GardenStone position={[5.8, 0.07, -4.45]} scale={[0.32, 0.07, 0.22]} theme={theme} />

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
