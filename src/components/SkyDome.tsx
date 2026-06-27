import { useMemo } from "react";
import * as THREE from "three";

/**
 * Art-directed gradient sky dome — clean blue at the zenith fading to a pale
 * haze at the horizon, like a bright afternoon. More controllable (and more
 * "stylized game" looking) than a physical sky model.
 */
export default function SkyDome({
  top = "#2c7fd0",
  bottom = "#d6ebfa",
}: {
  top?: string;
  bottom?: string;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          topColor: { value: new THREE.Color(top) },
          bottomColor: { value: new THREE.Color(bottom) },
          exponent: { value: 0.55 },
        },
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vDir;
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float exponent;
          void main() {
            float h = clamp(vDir.y, 0.0, 1.0);
            float t = pow(h, exponent);
            gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
          }
        `,
      }),
    [top, bottom]
  );

  return (
    <mesh scale={[420, 420, 420]} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
