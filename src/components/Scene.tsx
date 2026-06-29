import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Sparkles, ContactShadows, Cloud, Clouds } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import Tree from "./Tree";
import Petals from "./Petals";
import GardenGround from "./GardenGround";
import PlantingBeds from "./PlantingBeds";
import FlowerPatch from "./FlowerPatch";
import CameraRig from "./CameraRig";
import SkyDome from "./SkyDome";
import Lantern from "./Lantern";
import Rocks from "./Rocks";
import Building from "./Building";
import Bushes from "./Bushes";
import CourtyardFrame from "./CourtyardFrame";
import GrassTufts from "./GrassTufts";
import { allPatches, houseStoryPatch, markerPatches } from "../content";

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
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = light ? 1.5 : 1.16;
  }, [gl, light]);

  const petalCount = isMobile ? 480 : 1300;
  const plantingCount = isMobile ? 80 : 150;
  const fogColor = light ? "#f9dcc8" : "#181120";

  return (
    <>
      {!light && <color attach="background" args={["#07060d"]} />}
      <fog attach="fog" args={[fogColor, light ? 34 : 18, light ? 135 : 92]} />

      {/* ---- DAY: art-directed clear sky ---- */}
      {light && (
        <>
          <SkyDome top="#70b4ff" bottom="#ffdec0" />
          <Clouds material={THREE.MeshBasicMaterial} limit={260}>
            <Cloud seed={4} segments={28} bounds={[24, 4, 12]} volume={7} position={[-12, 14, -24]} opacity={0.5} color="#ffffff" speed={motion ? 0.08 : 0} growth={3.5} />
            <Cloud seed={10} segments={24} bounds={[20, 3, 10]} volume={5} position={[14, 16, -20]} opacity={0.42} color="#fff7f2" speed={motion ? 0.07 : 0} growth={3} />
          </Clouds>
        </>
      )}
      {!light && <SkyDome top="#06091b" bottom="#2f1831" />}

      {/* ---- Lighting ---- */}
      {light ? (
        <>
          <hemisphereLight args={["#d3e8ff", "#9d7b54", 0.98]} />
          <ambientLight intensity={0.4} color="#ffe2c4" />
          <directionalLight
            position={[-16, 16, 9]}
            intensity={4.15}
            color="#ffc58a"
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
          <directionalLight position={[12, 6, 14]} intensity={0.92} color="#ffd6e6" />
        </>
      ) : (
        <>
          <hemisphereLight args={["#b8c8ff", "#321528", 0.52]} />
          <ambientLight intensity={0.56} color="#746086" />
          <directionalLight
            position={[-9, 14, 4]}
            intensity={1.8}
            color="#a9caff"
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
          <pointLight position={[0, 3.4, -3]} intensity={6} color="#f4a8c8" distance={18} />
          <pointLight position={[-7, 2.4, -7]} intensity={5.5} color="#9db8ff" distance={28} />
          <pointLight position={[4.5, 2.2, 3.5]} intensity={5} color="#ffce8a" distance={16} />
        </>
      )}

      <CameraRig controls={controls} focused={focusedPatch} entered={entered} motion={motion} isMobile={isMobile} />
      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={2.5}
        maxDistance={52}
        maxPolarAngle={Math.PI / 2.08}
        enableDamping
        dampingFactor={0.08}
        autoRotateSpeed={0.18}
      />

      {/* one huge weeping sakura — the centerpiece */}
      <Tree motion={motion} detail={isMobile ? 0.45 : 1} position={[4.7, 0, 0.2]} scale={1.42} seed={20240426} />
      <Petals count={petalCount} play={motion} theme={theme} />
      <GardenGround theme={theme} petalCount={isMobile ? 400 : 700} />
      <GrassTufts count={isMobile ? 72 : 160} theme={theme} play={motion} />
      <PlantingBeds count={plantingCount} play={motion} theme={theme} />
      <Rocks count={0} />
      <Bushes theme={theme} count={0} />
      <CourtyardFrame theme={theme} />

      {/* stone lanterns dotted around the courtyard */}
      <Lantern position={[5.2, 0, 3.55]} scale={0.72} rotation={0.3} glow={light ? 0.3 : 1.15} />
      <Lantern position={[-5.9, 0, -1.05]} scale={0.62} rotation={-0.6} glow={light ? 0.28 : 1.1} />
      <Lantern position={[2.35, 0, -6.1]} scale={0.82} rotation={2.2} glow={light ? 0.28 : 1.2} />

      {/* simple local Japanese house, grounded into the garden */}
      <Building
        position={[0, 0, -10.7]}
        rotation={0}
        scale={1.0}
        theme={theme}
        onClick={() => setFocused(focused === houseStoryPatch.id ? null : houseStoryPatch.id)}
      />

      <ContactShadows
        position={[0, 0.02, 0]}
        scale={34}
        resolution={isMobile ? 512 : 1024}
        far={8}
        blur={3}
        opacity={light ? 0.28 : 0.4}
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

      {markerPatches.map((p) => (
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
          intensity={light ? 0.34 : 0.62}
          luminanceThreshold={light ? 0.84 : 0.42}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.28} darkness={light ? 0.18 : 0.55} />
      </EffectComposer>
    </>
  );
}
