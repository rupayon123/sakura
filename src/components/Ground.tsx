import { Grid } from "@react-three/drei";

export default function Ground({ theme }: { theme: "dark" | "light" }) {
  const light = theme === "light";
  return (
    <group>
      {/* solid floor that catches shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[42, 64]} />
        <meshStandardMaterial
          color={light ? "#e4d3dd" : "#0a0812"}
          roughness={light ? 0.9 : 0.6}
          metalness={light ? 0.0 : 0.3}
        />
      </mesh>

      {/* grid — neon at night, soft by day */}
      <Grid
        position={[0, 0, 0]}
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.6}
        cellColor={light ? "#cda9bd" : "#3a2440"}
        sectionSize={5}
        sectionThickness={1.2}
        sectionColor={light ? "#d98ab0" : "#ff5d8f"}
        fadeDistance={light ? 40 : 34}
        fadeStrength={1.5}
        infiniteGrid
      />
    </group>
  );
}
