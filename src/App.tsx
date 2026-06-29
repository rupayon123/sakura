import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import Nav from "./components/Nav";
import InfoPanel from "./components/InfoPanel";
import Intro from "./components/Intro";
import { allPatches } from "./content";

export default function App() {
  const [focused, setFocused] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [motion, setMotion] = useState(true);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const focusedPatch = allPatches.find((p) => p.id === focused) ?? null;

  return (
    <div className="stage">
      <Canvas
        shadows
        dpr={[1, isMobile ? 1.5 : 2]}
        camera={{
          position: isMobile ? [-6.25, 1.92, 12.8] : [-7.0, 1.86, 10.9],
          fov: isMobile ? 62 : 50,
        }}
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
        <div className={`controls ${focused ? "controls--panel-open" : ""}`}>
          <button
            className="ctl ctl--icon"
            onClick={() => setMotion((m) => !m)}
            title={motion ? "Pause motion" : "Resume motion"}
            aria-label={motion ? "Pause motion" : "Resume motion"}
            aria-pressed={motion}
          >
            <span aria-hidden>{motion ? "II" : ">"}</span>
          </button>
          <button
            className="ctl ctl--icon"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "dark"}
          >
            <span aria-hidden>{theme === "dark" ? "☼" : "☾"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
