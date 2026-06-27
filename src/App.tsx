import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import Nav from "./components/Nav";
import InfoPanel from "./components/InfoPanel";
import Intro from "./components/Intro";
import { allPatches, aboutPatch } from "./content";

export default function App() {
  const [focused, setFocused] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [motion, setMotion] = useState(true);

  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.innerWidth < 768,
    []
  );

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const focusedPatch =
    [...allPatches, aboutPatch].find((p) => p.id === focused) ?? null;

  return (
    <div className="stage">
      <Canvas
        shadows
        dpr={[1, isMobile ? 1.5 : 2]}
        camera={{ position: [0, 5.2, 18.5], fov: 45 }}
        gl={{ antialias: true }}
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
          <button className="ctl" onClick={() => setMotion((m) => !m)} title="Toggle motion">
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
        <div className="hint">drag to orbit · scroll to zoom · click a name above</div>
      )}
    </div>
  );
}
