import * as THREE from "three";

/**
 * A stylized Japanese stone lantern (ishidōrō): stacked stone pieces with a
 * warm glowing light box. The glow lifts at night (bloom picks it up).
 */
export default function Lantern({
  position = [0, 0, 0],
  scale = 1,
  rotation = 0,
  glow = 1,
}: {
  position?: [number, number, number];
  scale?: number;
  rotation?: number;
  glow?: number;
}) {
  const stone = (
    <meshStandardMaterial color="#c4bdae" roughness={0.95} metalness={0} />
  );
  const darkStone = (
    <meshStandardMaterial color="#8d8576" roughness={0.95} metalness={0} />
  );

  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* buried base + pedestal */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.24, 6]} />
        {stone}
      </mesh>
      {/* post */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 1.05, 8]} />
        {stone}
      </mesh>
      {/* platform under the light box */}
      <mesh position={[0, 1.36, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.28, 0.16, 6]} />
        {stone}
      </mesh>
      {/* bottom slab of the fire box */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.52, 0.1, 0.52]} />
        {darkStone}
      </mesh>
      {/* glowing core */}
      <mesh position={[0, 1.74, 0]}>
        <boxGeometry args={[0.32, 0.36, 0.32]} />
        <meshStandardMaterial
          color="#ffe6b0"
          emissive="#ffb347"
          emissiveIntensity={2.6 * glow}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 1.74, 0]} intensity={2.2 * glow} distance={6} color="#ffcc7a" />
      {/* 4 corner posts of the fire box */}
      {[
        [0.21, 0.21],
        [-0.21, 0.21],
        [0.21, -0.21],
        [-0.21, -0.21],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.74, z]} castShadow>
          <boxGeometry args={[0.07, 0.42, 0.07]} />
          {darkStone}
        </mesh>
      ))}
      {/* top slab */}
      <mesh position={[0, 1.99, 0]} castShadow>
        <boxGeometry args={[0.56, 0.1, 0.56]} />
        {darkStone}
      </mesh>
      {/* hip roof (4-sided pyramid, eaves slightly flared) */}
      <mesh position={[0, 2.18, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.52, 0.36, 4]} />
        {stone}
      </mesh>
      {/* finial */}
      <mesh position={[0, 2.46, 0]} castShadow>
        <sphereGeometry args={[0.09, 12, 12]} />
        {darkStone}
      </mesh>
    </group>
  );
}
