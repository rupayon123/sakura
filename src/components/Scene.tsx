import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Cloud, Clouds } from "@react-three/drei";
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
  const userOrbiting = useRef(false);
  const orbitReleaseTimer = useRef<number | null>(null);
  const focusedPatch = allPatches.find((p) => p.id === focused) ?? null;
  const light = theme === "light";
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = light ? 1.5 : 1.48;
  }, [gl, light]);

  useEffect(() => {
    return () => {
      if (orbitReleaseTimer.current !== null) window.clearTimeout(orbitReleaseTimer.current);
    };
  }, []);

  function markUserOrbiting() {
    userOrbiting.current = true;
    if (orbitReleaseTimer.current !== null) window.clearTimeout(orbitReleaseTimer.current);
    orbitReleaseTimer.current = null;
    if (controls.current) {
      controls.current.autoRotate = false;
      controls.current.update();
    }
  }

  function releaseUserOrbiting() {
    if (orbitReleaseTimer.current !== null) window.clearTimeout(orbitReleaseTimer.current);
    orbitReleaseTimer.current = window.setTimeout(() => {
      userOrbiting.current = false;
      orbitReleaseTimer.current = null;
      if (controls.current) {
        controls.current.autoRotate = !focusedPatch && entered && motion;
        controls.current.update();
      }
    }, 750);
  }

  const petalCount = isMobile ? 480 : 1300;
  const plantingCount = isMobile ? 160 : 380;
  const fogColor = light ? "#f9dcc8" : "#2a1c31";

  return (
    <>
      {!light && <color attach="background" args={["#11142a"]} />}
      <fog attach="fog" args={[fogColor, light ? 34 : 26, light ? 135 : 116]} />

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
      {!light && <SkyDome top="#10183a" bottom="#472844" />}

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
          <hemisphereLight args={["#d8e5ff", "#5a3947", 0.94]} />
          <ambientLight intensity={0.86} color="#ab96ba" />
          <directionalLight
            position={[-10, 17, 7]}
            intensity={3.15}
            color="#bed1ff"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={1}
            shadow-camera-far={60}
            shadow-camera-left={-22}
            shadow-camera-right={22}
            shadow-camera-top={22}
            shadow-camera-bottom={-22}
            shadow-bias={-0.0004}
          />
          <pointLight position={[0, 3.6, -3]} intensity={7.2} color="#f4a8c8" distance={20} />
          <pointLight position={[-7, 2.7, -7]} intensity={6.4} color="#9db8ff" distance={30} />
          <pointLight position={[4.5, 2.35, 3.5]} intensity={5.8} color="#ffce8a" distance={18} />
          <pointLight position={[-2.2, 3.1, -9.2]} intensity={6.8} color="#ffd09a" distance={16} />
          <pointLight position={[2.4, 4.8, -4.0]} intensity={3.2} color="#cab8ff" distance={22} />
        </>
      )}

      <CameraRig
        controls={controls}
        focused={focusedPatch}
        entered={entered}
        motion={motion}
        isMobile={isMobile}
        userOrbiting={userOrbiting}
      />
      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={2.5}
        maxDistance={52}
        maxPolarAngle={Math.PI / 2.08}
        enableDamping
        dampingFactor={0.08}
        autoRotateSpeed={0.08}
        onStart={markUserOrbiting}
        onEnd={releaseUserOrbiting}
      />

      {/* one huge weeping sakura — the centerpiece */}
      <Tree motion={motion} detail={isMobile ? 0.45 : 1} position={[4.35, 0, 0.1]} scale={1.47} seed={20240426} />
      <Petals count={petalCount} play={motion} theme={theme} />
      <GardenGround theme={theme} petalCount={isMobile ? 520 : 980} />
      <GrassTufts count={isMobile ? 72 : 160} theme={theme} play={motion} />
      <PlantingBeds count={plantingCount} play={motion} theme={theme} />
      <Rocks count={0} />
      <Bushes theme={theme} count={0} />
      <CourtyardFrame theme={theme} />

      {/* stone lanterns dotted around the courtyard */}
      <Lantern position={[6.15, 0, 3.25]} scale={0.58} rotation={0.3} glow={light ? 0.24 : 0.95} />
      <Lantern position={[-6.75, 0, -1.6]} scale={0.48} rotation={-0.6} glow={light ? 0.22 : 0.9} />
      <Lantern position={[1.7, 0, -6.35]} scale={0.52} rotation={2.2} glow={light ? 0.22 : 0.92} />

      {/* simple local Japanese house, grounded into the garden */}
      <Building
        position={[-0.8, 0, -10.35]}
        rotation={0}
        scale={0.76}
        theme={theme}
        onClick={() => setFocused(focused === houseStoryPatch.id ? null : houseStoryPatch.id)}
      />

      <ContactShadows
        position={[0, 0.02, 0]}
        scale={34}
        resolution={isMobile ? 512 : 1024}
        far={8}
        blur={3}
        opacity={light ? 0.28 : 0.26}
        color={light ? "#4a3a2a" : "#18101b"}
      />

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
        <Vignette eskil={false} offset={0.24} darkness={light ? 0.18 : 0.24} />
      </EffectComposer>
    </>
  );
}
