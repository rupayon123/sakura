import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const fullPath = join(dir, name);
    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const scene = read("src/components/Scene.tsx");
const nav = read("src/components/Nav.tsx");
const app = read("src/App.tsx");
const intro = read("src/components/Intro.tsx");
const infoPanel = read("src/components/InfoPanel.tsx");
const cameraRig = read("src/components/CameraRig.tsx");
const flowerPatch = read("src/components/FlowerPatch.tsx");
const building = read("src/components/Building.tsx");
const gardenGround = read("src/components/GardenGround.tsx");
const plantingBeds = read("src/components/PlantingBeds.tsx");
const content = read("src/content.ts");
const textures = read("src/textures.ts");
const styles = read("src/styles.css");
const indexHtml = read("index.html");
const fetchProjects = read("scripts/fetch-projects.mjs");
const readme = read("README.md");
const sourceFiles = walk(join(root, "src")).filter((file) => /\.(ts|tsx|json|css|html)$/.test(file));
const allSource = sourceFiles
  .map((file) => `\n/* ${relative(root, file)} */\n${readFileSync(file, "utf8")}`)
  .join("\n");
const runtimeSourceFiles = sourceFiles.filter((file) => /\.(ts|tsx)$/.test(file));
const runtimeSource = runtimeSourceFiles
  .map((file) => `\n/* ${relative(root, file)} */\n${readFileSync(file, "utf8")}`)
  .join("\n");
const mainPathMesh = gardenGround.match(/<instancedMesh ref=\{plazaRef\}[\s\S]*?<\/instancedMesh>/)?.[0] ?? "";
const bannedProjectPattern = new RegExp(
  `\\b(?:${["Aura", "Space"].join("")}|${["my", "app"].join("-")})\\b`,
  "i"
);

const checks = [
  {
    pass: (scene.match(/<Tree(?:\s|>)/g) ?? []).length === 1,
    message: "Scene must render exactly one giant sakura tree.",
  },
  {
    pass: /<Bushes\b[^>]*count=\{0\}/s.test(scene),
    message: "Tree-like shrub/bush component must stay disabled.",
  },
  {
    pass: !bannedProjectPattern.test(allSource),
    message: "Old starter/demo project names must not appear in source content or project data.",
  },
  {
    pass: !bannedProjectPattern.test(fetchProjects),
    message: "Old starter/demo project names must not be reintroduced by the project fetch script.",
  },
  {
    pass: !/\bfamilyPatches\b/.test(allSource),
    message: "Family content should not return as separate flower/nav patches.",
  },
  {
    pass: !/\b(?:console\.(?:log|debug|info|warn|error)|debugger|alert\(|prompt\(|confirm\()\b/.test(
      runtimeSource
    ),
    message: "Runtime source must stay free of console/debug/browser-dialog leftovers.",
  },
  {
    pass: /export const markerPatches: Patch\[\] = \[aboutPatch, \.\.\.projectPatches\];/.test(content),
    message: "Visible flower markers should be About plus GitHub project beds only.",
  },
  {
    pass: /export const allPatches: Patch\[\] = \[\.\.\.markerPatches, houseStoryPatch\];/.test(content),
    message: "House story must remain available through the physical house.",
  },
  {
    pass:
      nav.includes("projectPatches") &&
      nav.includes("aboutPatch") &&
      !/\b(?:allPatches|houseStoryPatch)\b/.test(nav),
    message: "Top navigation should not list the house/family story as a separate nav item.",
  },
  {
    pass:
      content.includes('actions: [{ label: "Open 「栗原の家」", targetId: "house-story" }]') &&
      app.includes("onSelect={setFocused}") &&
      infoPanel.includes("onSelect: (id: string) => void") &&
      infoPanel.includes("patch.actions") &&
      infoPanel.includes("onClick={() => onSelect(action.targetId)}"),
    message: "About panel must provide a quiet internal path to the Kurihara house story.",
  },
  {
    pass: content.includes("栗原の家") && textures.includes("栗原の家"),
    message: "The Kurihara house sign text must exist in both story content and the house texture.",
  },
  {
    pass:
      readme.includes("栗原の家") &&
      !/\b(?:tulips?|neon|Sketchfab)\b/i.test(readme),
    message: "README must describe the current garden brief without stale tulip/neon/Sketchfab language.",
  },
  {
    pass:
      indexHtml.includes('<link rel="canonical" href="https://rupayon123.github.io/sakura/" />') &&
      indexHtml.includes('property="og:url" content="https://rupayon123.github.io/sakura/"') &&
      indexHtml.includes("interactive 3D sakura garden"),
    message: "HTML metadata must present the public site as Rupayon's interactive sakura garden.",
  },
  {
    pass:
      app.includes("prefers-reduced-motion: reduce") &&
      styles.includes("@media (prefers-reduced-motion: reduce)") &&
      styles.includes("button:focus-visible") &&
      styles.includes(".sr-only") &&
      intro.includes("aria-hidden={entered}") &&
      intro.includes("tabIndex={entered ? -1 : 0}") &&
      app.includes("aria-hidden={focused ? true : undefined}") &&
      app.includes("tabIndex={focused ? -1 : 0}"),
    message: "Keyboard focus, hidden intro/control safety, and reduced-motion support must remain in place.",
  },
  {
    pass:
      cameraRig.includes("c.autoRotate = !focused && entered && motion") &&
      scene.includes("<Petals count={petalCount} play={motion}") &&
      scene.includes("<Tree motion={motion}") &&
      scene.includes("speed={motion ? 0.08 : 0}") &&
      scene.includes("speed={motion ? 0.35 : 0}") &&
      scene.includes("<GrassTufts count={isMobile ? 72 : 160} theme={theme} play={motion}") &&
      scene.includes("<PlantingBeds count={plantingCount} play={motion} theme={theme}") &&
      app.includes("setMotion((m) => !m)"),
    message: "Motion toggle must continue to control orbit, petals, tree, clouds, grass, and planting beds.",
  },
  {
    pass:
      app.includes("function canUseWebGL()") &&
      app.includes("function WebGLFallback()") &&
      app.includes("class SceneErrorBoundary") &&
      app.includes("function SceneLoader()") &&
      app.includes("fallback={<WebGLFallback />}") &&
      styles.includes(".webgl-fallback a"),
    message: "WebGL fallback, scene error boundary, and loading state must remain wired in.",
  },
  {
    pass: /<Building\b[\s\S]*onClick=\{\(\) => setFocused/.test(scene),
    message: "The grounded house must remain clickable and open the family/root story.",
  },
  {
    pass:
      building.includes("function WoodSlat") &&
      building.includes("key={`plank-${i}`}") &&
      building.includes("key={`rafter-${x}`}") &&
      building.includes("StoneStep position={[3.9, 0.035, 4.72]}"),
    message: "The Japanese home must keep veranda craft, roof detail, and a grounded genkan apron.",
  },
  {
    pass:
      mainPathMesh.includes("<dodecahedronGeometry args={[1, 0]} />") &&
      !mainPathMesh.includes("<cylinderGeometry") &&
      gardenGround.includes("opacity={light ? 0.28 : 0.36}"),
    message: "The main garden path must stay irregular and subtle, not round token stones on a dark strip.",
  },
  {
    pass:
      plantingBeds.includes("const bedBase = useRef<THREE.InstancedMesh>(null)") &&
      plantingBeds.includes("opacity={theme === \"dark\" ? 0.28 : 0.24}") &&
      scene.includes("const plantingCount = isMobile ? 130 : 300"),
    message: "Low planted beds must keep grounded bed bases and enough flowers to avoid a flat toy field.",
  },
  {
    pass: flowerPatch.includes("const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])"),
    message: "Flower patch hover animation should avoid allocating a new Vector3 every frame.",
  },
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
  console.error("Garden brief verification failed:");
  failures.forEach((failure) => console.error(`- ${failure.message}`));
  process.exit(1);
}

console.log("Garden brief verification passed.");
