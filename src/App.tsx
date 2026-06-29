import { Component, Suspense, useEffect, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import Nav from "./components/Nav";
import InfoPanel from "./components/InfoPanel";
import Intro from "./components/Intro";
import { allPatches } from "./content";

function canUseWebGL() {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

function WebGLFallback() {
  return (
    <div className="webgl-fallback" role="status">
      <p>桜 Rupayon Haldar</p>
      <span>
        This interactive sakura garden needs WebGL. You can still visit{" "}
        <a href="https://github.com/rupayon123">GitHub</a> or{" "}
        <a href="https://www.linkedin.com/in/rupayonhaldar/">LinkedIn</a>.
      </span>
    </div>
  );
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function SceneLoader() {
  return (
    <div className="loader" role="status" aria-live="polite">
      loading garden
    </div>
  );
}

export default function App() {
  const [focused, setFocused] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [webglReady] = useState(canUseWebGL);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [motion, setMotion] = useState(
    () =>
      typeof window === "undefined" ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocused(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const focusedPatch = allPatches.find((p) => p.id === focused) ?? null;

  if (!webglReady) return <WebGLFallback />;

  return (
    <SceneErrorBoundary fallback={<WebGLFallback />}>
      <div className="stage">
        <h1 className="sr-only">Rupayon Haldar Sakura Garden</h1>
        <Suspense fallback={<SceneLoader />}>
          <Canvas
            aria-label="Interactive 3D sakura garden with one giant tree, a small Japanese house, and project flower beds"
            role="img"
            shadows
            dpr={[1, isMobile ? 1.5 : 2]}
            camera={{
              position: isMobile ? [-5.55, 1.58, 11.25] : [-6.25, 1.36, 6.75],
              fov: isMobile ? 69 : 52,
            }}
            gl={{ antialias: true }}
            fallback={<WebGLFallback />}
          >
            <Scene
              focused={focused}
              setFocused={setFocused}
              entered={entered}
              motion={motion}
              isMobile={isMobile}
              theme={theme}
            />
          </Canvas>
        </Suspense>

        <Nav focused={focused} setFocused={setFocused} />
        <InfoPanel patch={focusedPatch} onClose={() => setFocused(null)} onSelect={setFocused} />
        <Intro entered={entered} onEnter={() => setEntered(true)} />

        {entered && (
          <div
            className={`controls ${focused ? "controls--panel-open" : ""}`}
            aria-hidden={focused ? true : undefined}
          >
            <button
              type="button"
              className="ctl ctl--icon"
              onClick={() => setMotion((m) => !m)}
              title={motion ? "Pause motion" : "Resume motion"}
              aria-label={motion ? "Pause motion" : "Resume motion"}
              aria-pressed={motion}
              tabIndex={focused ? -1 : 0}
            >
              <span aria-hidden>{motion ? "II" : ">"}</span>
            </button>
            <button
              type="button"
              className="ctl ctl--icon"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={theme === "dark"}
              tabIndex={focused ? -1 : 0}
            >
              <span aria-hidden>{theme === "dark" ? "☼" : "☾"}</span>
            </button>
          </div>
        )}
      </div>
    </SceneErrorBoundary>
  );
}
