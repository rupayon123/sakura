import * as THREE from "three";

/**
 * A stylized Japanese hall — stone base, plaster wall with timber framing, a
 * dark gate, and a tiled hip roof with overhanging eaves. Original geometry
 * (no game assets), built to read as a courtyard backdrop.
 */
export default function Building({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  theme = "light",
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
  theme?: "dark" | "light";
}) {
  const W = 11;
  const H = 3;
  const D = 4.2;
  const light = theme === "light";

  const plaster = <meshStandardMaterial color={light ? "#f1e6cd" : "#5a5364"} roughness={0.95} />;
  const wood = <meshStandardMaterial color="#5b3d28" roughness={0.85} />;
  const stone = <meshStandardMaterial color={light ? "#b3ac9d" : "#544f5c"} roughness={1} />;
  const tile = <meshStandardMaterial color={light ? "#3c4654" : "#241f2c"} roughness={0.8} metalness={0.1} />;

  const posts: [number, number][] = [
    [-W / 2 + 0.3, D / 2 - 0.2],
    [0, D / 2 - 0.2],
    [W / 2 - 0.3, D / 2 - 0.2],
    [-W / 2 + 0.3, -D / 2 + 0.2],
    [W / 2 - 0.3, -D / 2 + 0.2],
  ];

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* stone base / platform */}
      <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
        <boxGeometry args={[W + 1, 0.7, D + 1]} />
        {stone}
      </mesh>

      {/* front steps */}
      <mesh position={[0, 0.18, D / 2 + 0.85]} receiveShadow castShadow>
        <boxGeometry args={[4, 0.36, 0.7]} />
        {stone}
      </mesh>
      <mesh position={[0, 0.32, D / 2 + 0.5]} receiveShadow castShadow>
        <boxGeometry args={[3.4, 0.3, 0.5]} />
        {stone}
      </mesh>

      {/* plaster wall body */}
      <mesh position={[0, 0.7 + H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        {plaster}
      </mesh>

      {/* timber corner / mid posts */}
      {posts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.7 + H / 2, z]} castShadow>
          <boxGeometry args={[0.28, H, 0.28]} />
          {wood}
        </mesh>
      ))}

      {/* timber beams (top + mid rail) */}
      <mesh position={[0, 0.7 + H - 0.15, D / 2 - 0.1]} castShadow>
        <boxGeometry args={[W + 0.1, 0.3, 0.18]} />
        {wood}
      </mesh>
      <mesh position={[0, 0.7 + H * 0.5, D / 2 - 0.1]} castShadow>
        <boxGeometry args={[W + 0.1, 0.16, 0.16]} />
        {wood}
      </mesh>

      {/* dark gateway doors, centre front */}
      <mesh position={[0, 0.7 + 1.05, D / 2 + 0.02]}>
        <boxGeometry args={[2.2, 2.1, 0.12]} />
        <meshStandardMaterial color="#2c2622" roughness={0.7} />
      </mesh>
      {/* door frame */}
      <mesh position={[0, 0.7 + 1.05, D / 2 + 0.05]}>
        <boxGeometry args={[2.5, 2.4, 0.1]} />
        {wood}
      </mesh>

      {/* eave beam the roof sits on (overhangs the walls) */}
      <mesh position={[0, 0.7 + H + 0.05, 0]} castShadow>
        <boxGeometry args={[W + 1.4, 0.2, D + 1.4]} />
        {wood}
      </mesh>

      {/* deep eave board the roof sits on (dark underside) */}
      <mesh position={[0, 0.7 + H + 0.16, 0]} castShadow>
        <boxGeometry args={[W + 2.6, 0.18, D + 2.6]} />
        <meshStandardMaterial color="#241f2c" roughness={0.8} />
      </mesh>

      {/* main hip roof — taller + big overhang for a temple silhouette */}
      <mesh
        position={[0, 0.7 + H + 1.25, 0]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[(W + 2.6) / 1.414, 2.2, (D + 2.6) / 1.414]}
        castShadow
      >
        <coneGeometry args={[1, 1, 4]} />
        {tile}
      </mesh>
      {/* ridge cap */}
      <mesh position={[0, 0.7 + H + 2.1, 0]} castShadow>
        <boxGeometry args={[W - 1.5, 0.3, 0.6]} />
        {tile}
      </mesh>
      {/* end ridge ornaments (shibi) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 - 0.7), 0.7 + H + 2.35, 0]} castShadow>
          <coneGeometry args={[0.22, 0.5, 4]} />
          {tile}
        </mesh>
      ))}

      {/* entry porch roof over the door */}
      <mesh
        position={[0, 0.7 + 2.5, D / 2 + 0.5]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[3.6 / 1.414, 0.9, 2.4 / 1.414]}
        castShadow
      >
        <coneGeometry args={[1, 1, 4]} />
        {tile}
      </mesh>
    </group>
  );
}
