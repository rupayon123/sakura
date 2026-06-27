import { useRef } from "react";
import { OrbitControls, Sparkles, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import Tree from "./Tree";
import Petals from "./Petals";
import Ground from "./Ground";
import TulipField from "./TulipField";
import FlowerPatch from "./FlowerPatch";
import CameraRig from "./CameraRig";
import { allPatches } from "../content";

interface Props {
  focused: string | null;
  setFocused: (id: string | null) => void;
  entered: boolean;
  motion: boolean;
  isMobile: boolean;
  theme: "dark" | "light";
}

export default function Scene({ focused, setFocused, entered, motion, isMobile, theme }: Props) {
  const controls = useRef<any>(null);
  const focusedPatch = allPatches.find((p) => p.id === focused) ?? null;
  const light = theme === "light";

  const bg = light ? "#f3e7ee" : "#07060d";
  const petalCount = isMobile ? 480 : 1300;
  const tulipCount = isMobile ? 300 : 540;

  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, light ? 24 : 18, light ? 90 : 78]} />

      {/* Lighting */}
      <ambientLight intensity={light ? 0.85 : 0.35} color={light ? "#fff4f8" : "#5a4b6e"} />
      <directionalLight
        position={[7, 14, 6]}
        intensity={light ? 1.7 : 1.1}
        color={light ? "#fff3e2" : "#cfe3ff"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={44}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0004}
      />
      <pointLight position={[0, 4.2, 0]} intensity={light ? 8 : 26} color="#ff7eb6" distance={24} />
      <pointLight position={[-8, 2.5, -6]} intensity={light ? 3 : 12} color="#7ee8fa" distance={26} />
      <pointLight position={[8, 2.5, 6]} intensity={light ? 2 : 9} color="#b794f6" distance={24} />

      <CameraRig controls={controls} focused={focusedPatch} entered={entered} motion={motion} />
      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={2.5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping
        dampingFactor={0.08}
        autoRotateSpeed={0.5}
      />

      <Tree motion={motion} detail={isMobile ? 0.5 : 1} />
      <Petals count={petalCount} play={motion} />
      <Ground theme={theme} />
      <TulipField count={tulipCount} play={motion} />

      {/* soft contact shadow grounding the whole garden */}
      <ContactShadows
        position={[0, 0.015, 0]}
        scale={28}
        resolution={isMobile ? 512 : 1024}
        far={7}
        blur={2.8}
        opacity={light ? 0.45 : 0.55}
        color={light ? "#5a3a4a" : "#000000"}
      />

      {/* glowing motes drifting around the canopy */}
      <Sparkles
        count={isMobile ? 40 : 90}
        scale={[10, 8, 10]}
        position={[0, 4, 0]}
        size={3.2}
        speed={motion ? 0.35 : 0}
        color={light ? "#ff9ecf" : "#ffd1e6"}
        opacity={light ? 0.5 : 0.75}
      />

      {allPatches.map((p) => (
        <FlowerPatch
          key={p.id}
          patch={p}
          active={focused === p.id}
          dimmed={focused !== null && focused !== p.id}
          onClick={() => setFocused(focused === p.id ? null : p.id)}
        />
      ))}

      <EffectComposer>
        <Bloom
          intensity={light ? 0.45 : 0.95}
          luminanceThreshold={light ? 0.6 : 0.32}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.25} darkness={light ? 0.5 : 0.85} />
      </EffectComposer>
    </>
  );
}
