import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Loader } from "@react-three/drei";
import Scene from "./components/Scene";
import Nav from "./components/Nav";
import InfoPanel from "./components/InfoPanel";
import Intro from "./components/Intro";
import { allPatches, aboutPatch } from "./content";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    setMobile(mq.matches);
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

export default function App() {
  const [focused, setFocused] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const [motion, setMotion] = useState(true);

  useEffect(() => setMotion(!reduced), [reduced]);
  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const focusedPatch =
    [...allPatches, aboutPatch].find((p) => p.id === focused) ?? null;

  return (
    <>
      <Canvas
        shadows={!isMobile}
        dpr={isMobile ? [1, 1.2] : [1, 1.5]}
        camera={{ position: [0, 7.6, 19.5], fov: 45 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        fallback={
          <div className="webgl-fallback">
            <p>{"桜"} Rupayon Haldar</p>
            <span>Your browser can’t show the 3D garden — try a modern browser.</span>
          </div>
        }
      >
        <Suspense fallback={null}>
          <Scene
            focused={focused}
            setFocused={setFocused}
            entered={entered}
            motion={motion}
            isMobile={isMobile}
            theme={theme}
          />
        </Suspense>
      </Canvas>

      <Nav focused={focused} setFocused={setFocused} />
      <InfoPanel patch={focusedPatch} onClose={() => setFocused(null)} />
      <Intro entered={entered} onEnter={() => setEntered(true)} />

      {entered && (
        <div className="controls">
          <button
            className="ctl"
            onClick={() => setMotion((m) => !m)}
            aria-pressed={!motion}
            title={motion ? "Pause motion" : "Resume motion"}
          >
            {motion ? "⏸ motion" : "▶ motion"}
          </button>
          <button
            className="ctl"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title="Toggle light / dark"
          >
            {theme === "dark" ? "☀ light" : "☾ dark"}
          </button>
        </div>
      )}

      {entered && !focused && (
        <div className="hint">drag to orbit · scroll to zoom · click a flower patch</div>
      )}

      <Loader
        containerStyles={{ background: "#07060d" }}
        barStyles={{ background: "#ff5d8f" }}
        dataStyles={{
          color: "#ffb3c6",
          fontFamily: "'Shippori Mincho', serif",
          letterSpacing: "0.2em",
        }}
      />
    </>
  );
}
