import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Sparkles, ContactShadows, Cloud, Clouds } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import Tree from "./Tree";
import Petals from "./Petals";
import GardenGround from "./GardenGround";
import TulipField from "./TulipField";
import FlowerPatch from "./FlowerPatch";
import CameraRig from "./CameraRig";
import SkyDome from "./SkyDome";
import Lantern from "./Lantern";
import Rocks from "./Rocks";
import Building from "./Building";
import Bushes from "./Bushes";
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
  const light = theme === "light"; // "light" = daytime courtyard, "dark" = neon night
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = light ? 1.25 : 1.0;
  }, [gl, light]);

  const petalCount = isMobile ? 480 : 1300;
  const tulipCount = isMobile ? 300 : 540;
  const fogColor = light ? "#dceaf2" : "#07060d";

  return (
    <>
      {!light && <color attach="background" args={["#07060d"]} />}
      <fog attach="fog" args={[fogColor, light ? 34 : 18, light ? 135 : 78]} />

      {/* ---- DAY: physical sky + clouds ---- */}
      {light && (
        <>
          <SkyDome top="#2c7fd0" bottom="#d8ecfb" />
          <Clouds material={THREE.MeshBasicMaterial} limit={400}>
            <Cloud seed={1} segments={40} bounds={[40, 6, 24]} volume={12} position={[-16, 19, -32]} opacity={0.85} color="#ffffff" speed={motion ? 0.16 : 0} growth={6} />
            <Cloud seed={7} segments={32} bounds={[32, 5, 20]} volume={9} position={[20, 22, -26]} opacity={0.8} color="#f5f8ff" speed={motion ? 0.13 : 0} growth={5} />
            <Cloud seed={12} segments={28} bounds={[28, 5, 18]} volume={8} position={[2, 25, 24]} opacity={0.7} color="#ffffff" speed={motion ? 0.11 : 0} growth={5} />
            <Cloud seed={19} segments={24} bounds={[22, 4, 14]} volume={6} position={[-28, 16, 6]} opacity={0.6} color="#eef3ff" speed={motion ? 0.1 : 0} growth={4} />
          </Clouds>
        </>
      )}

      {/* ---- Lighting ---- */}
      {light ? (
        <>
          <hemisphereLight args={["#cfe7ff", "#6a7a4a", 0.95]} />
          <ambientLight intensity={0.25} color="#fff3e0" />
          <directionalLight
            position={[-18, 19, -8]}
            intensity={2.6}
            color="#ffe3b3"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={1}
            shadow-camera-far={70}
            shadow-camera-left={-26}
            shadow-camera-right={26}
            shadow-camera-top={26}
            shadow-camera-bottom={-26}
            shadow-bias={-0.0004}
          />
          {/* warm bounce fill */}
          <directionalLight position={[12, 6, 14]} intensity={0.5} color="#ffe8c8" />
        </>
      ) : (
        <>
          <ambientLight intensity={0.35} color="#5a4b6e" />
          <directionalLight
            position={[7, 14, 6]}
            intensity={1.1}
            color="#cfe3ff"
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
          <pointLight position={[0, 4.2, 0]} intensity={26} color="#ff7eb6" distance={24} />
          <pointLight position={[-8, 2.5, -6]} intensity={12} color="#7ee8fa" distance={26} />
          <pointLight position={[8, 2.5, 6]} intensity={9} color="#b794f6" distance={24} />
        </>
      )}

      <CameraRig controls={controls} focused={focusedPatch} entered={entered} motion={motion} />
      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={2.5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.08}
        enableDamping
        dampingFactor={0.08}
        autoRotateSpeed={0.5}
      />

      <Tree motion={motion} detail={isMobile ? 0.5 : 1} position={[0, 0, 0]} scale={1.2} seed={20240426} />
      <Tree motion={motion} detail={isMobile ? 0.3 : 0.6} position={[-9.5, 0, -5]} scale={0.85} seed={7771} />
      <Tree motion={motion} detail={isMobile ? 0.3 : 0.6} position={[9, 0, -6.5]} scale={0.95} seed={1313} />
      <Petals count={petalCount} play={motion} />
      <GardenGround theme={theme} petalCount={isMobile ? 400 : 700} />
      <TulipField count={tulipCount} play={motion} />
      <Rocks count={isMobile ? 10 : 18} />
      <Bushes theme={theme} count={isMobile ? 4 : 8} />

      {/* stone lanterns dotted around the courtyard */}
      <Lantern position={[5, 0, 3.5]} scale={1.1} rotation={0.3} glow={light ? 0.5 : 1.8} />
      <Lantern position={[-5.5, 0, 2]} scale={1.0} rotation={-0.6} glow={light ? 0.5 : 1.8} />
      <Lantern position={[2.5, 0, -6]} scale={1.15} rotation={2.2} glow={light ? 0.5 : 1.8} />

      {/* temple hall backdrop */}
      <Building position={[0, 0, -16]} rotation={0} scale={1.2} theme={theme} />

      <ContactShadows
        position={[0, 0.02, 0]}
        scale={34}
        resolution={isMobile ? 512 : 1024}
        far={8}
        blur={3}
        opacity={light ? 0.4 : 0.55}
        color={light ? "#4a3a2a" : "#000000"}
      />

      {!light && (
        <Sparkles
          count={isMobile ? 40 : 90}
          scale={[10, 8, 10]}
          position={[0, 4, 0]}
          size={3.2}
          speed={motion ? 0.35 : 0}
          color="#ffd1e6"
          opacity={0.75}
        />
      )}

      {allPatches.map((p) => (
        <FlowerPatch
          key={p.id}
          patch={p}
          active={focused === p.id}
          dimmed={focused !== null && focused !== p.id}
          theme={theme}
          onClick={() => setFocused(focused === p.id ? null : p.id)}
        />
      ))}

      <EffectComposer>
        <Bloom
          intensity={light ? 0.32 : 0.95}
          luminanceThreshold={light ? 0.8 : 0.32}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.3} darkness={light ? 0.4 : 0.85} />
      </EffectComposer>
    </>
  );
}
