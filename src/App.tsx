import { useEffect, useState } from "react";
import Nav from "./components/Nav";
import InfoPanel from "./components/InfoPanel";
import Intro from "./components/Intro";
import PetalsOverlay from "./components/PetalsOverlay";
import GardenLayer from "./components/GardenLayer";
import { allPatches, aboutPatch } from "./content";

// The real "Ancient Sakura / Cherry Blossom Tree" by v_petkov on Sketchfab.
// UI chrome (title/author bar, controls, help) hidden; watermark kept for attribution.
const SKETCHFAB =
  "https://sketchfab.com/models/2b75479fe75f4ac7837585e0ef3047a1/embed" +
  "?autospin=0.3&autostart=1&preload=1&transparent=1&ui_theme=dark" +
  "&ui_infos=0&ui_controls=0&ui_inspector=0&ui_help=0&ui_settings=0&ui_vr=0" +
  "&ui_ar=0&ui_annotations=0&ui_fullscreen=0&ui_hint=0&ui_stop=0&dnt=1";

export default function App() {
  const [focused, setFocused] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [petals, setPetals] = useState(true);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const focusedPatch = [...allPatches, aboutPatch].find((p) => p.id === focused) ?? null;

  return (
    <div className="stage">
      <iframe
        className="sketchfab"
        title="Ancient Sakura Cherry Blossom Tree"
        src={SKETCHFAB}
        frameBorder={0}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
      />

      <GardenLayer />
      <PetalsOverlay play={petals} />

      <Nav focused={focused} setFocused={setFocused} />
      <InfoPanel patch={focusedPatch} onClose={() => setFocused(null)} />
      <Intro entered={entered} onEnter={() => setEntered(true)} />

      {entered && (
        <div className="controls">
          <button className="ctl" onClick={() => setPetals((p) => !p)} title="Toggle petals">
            {petals ? "⏸ petals" : "▶ petals"}
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
        <div className="hint">drag the tree to look around · click a name above</div>
      )}
    </div>
  );
}
