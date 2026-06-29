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
const projectsJson = JSON.parse(read("src/projects.json"));
const curatedProjectIds = [
  "gta-free-stem-opportunities",
  "gta-free-stem-ios",
  "arduino-blocks-lab",
  "PipHackLup",
  "all-in-one-resume-builder-job-assist-applier",
];
const sourceFiles = walk(join(root, "src")).filter((file) => /\.(ts|tsx|json|css|html)$/.test(file));
const allSource = sourceFiles
  .map((file) => `\n/* ${relative(root, file)} */\n${readFileSync(file, "utf8")}`)
  .join("\n");
const runtimeSourceFiles = sourceFiles.filter((file) => /\.(ts|tsx)$/.test(file));
const runtimeSource = runtimeSourceFiles
  .map((file) => `\n/* ${relative(root, file)} */\n${readFileSync(file, "utf8")}`)
  .join("\n");
const mainPathMesh = gardenGround.match(/<instancedMesh ref=\{plazaRef\}[\s\S]*?<\/instancedMesh>/)?.[0] ?? "";
const projectIds = projectsJson.map((project) => project.id);
const exactCuratedProjects =
  projectIds.length === curatedProjectIds.length &&
  curatedProjectIds.every((id, index) => projectIds[index] === id);
const exactGrandmotherQuote =
  "When you begin your new life after you marry, I will plant a sakura tree for your new life as it grows with you.";
const exactGrandmotherQuoteJa =
  "あなたが結婚して新しい人生を始めるとき、あなたの新しい人生のために桜の木を植えます。その桜はあなたと共に育っていきます。";

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
    pass: exactCuratedProjects && curatedProjectIds.every((id) => fetchProjects.includes(`"${id}"`)),
    message: "Project data should stay limited to the curated public portfolio.",
  },
  {
    pass:
      content.includes(`line: "${exactGrandmotherQuote}"`) &&
      content.includes(`lineJa: "${exactGrandmotherQuoteJa}"`) &&
      !content.includes("When you start your new life, when you marry"),
    message: "Grandmother quote and Japanese translation must match the latest approved wording.",
  },
  {
    pass: !/\bfamilyPatches\b/.test(allSource),
    message: "Family content should not return as separate flower/nav patches.",
  },
  {
    pass:
      content.includes("「栗原」 is my family name") &&
      content.includes("the Kurihara family house") &&
      indexHtml.includes("Kurihara family roots") &&
      readme.includes("modest Kurihara family") &&
      !/(?:real grandmother's home|grandmother-like|a grandmother's promise)/i.test(
        [content, indexHtml, readme].join("\n")
      ),
    message: "Kurihara must read as Rupayon's family name and personal family story, not a generic grandmother-home trope.",
  },
  {
    pass: !/\b(?:positioon|posiiton|postion)=/.test(runtimeSource),
    message: "Scene code must not contain misspelled position props that make objects vanish or float.",
  },
  {
    pass: !scene.includes("Sparkles"),
    message: "Dark mode should avoid square floating sparkle artifacts; use lanterns, moonlight, and petals instead.",
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
      indexHtml.includes('<body data-theme="dark">') &&
      app.includes('useState<"dark" | "light">("dark")'),
    message: "The garden must start in dark mode before and after React initializes.",
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
      cameraRig.includes("const canOrbit = !focused && entered") &&
      cameraRig.includes("c.autoRotate = canOrbit && motion && !userOrbiting.current") &&
      scene.includes("<Petals count={petalCount} play={motion}") &&
      scene.includes("<Tree motion={motion}") &&
      scene.includes("speed={motion ? 0.08 : 0}") &&
      scene.includes("<GrassTufts count={isMobile ? 72 : 160} theme={theme} play={motion}") &&
      scene.includes("<PlantingBeds count={plantingCount} play={motion} theme={theme}") &&
      app.includes("setMotion((m) => !m)"),
    message: "Motion toggle must continue to control orbit, petals, tree, clouds, grass, and planting beds.",
  },
  {
    pass:
      cameraRig.includes("userOrbiting: React.MutableRefObject<boolean>") &&
      cameraRig.includes("c.autoRotate = canOrbit && motion && !userOrbiting.current") &&
      cameraRig.includes("const returningToOverview = useRef(false)") &&
      cameraRig.includes("returningToOverview.current = !focused") &&
      cameraRig.includes("userOrbiting.current = false") &&
      cameraRig.includes("if (returning && userOrbiting.current)") &&
      cameraRig.includes("c.enabled = returning ? canOrbit : false") &&
      cameraRig.includes("c.update();") &&
      scene.includes("const userOrbiting = useRef(false)") &&
      scene.includes("onStart={() =>") &&
      scene.includes("userOrbiting.current = true") &&
      scene.includes("onEnd={() =>") &&
      scene.includes("userOrbiting.current = false") &&
      scene.includes("controls.current.update()"),
    message: "Orbit controls must resume cleanly after panel close and after the user drags the camera.",
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
      /<Building\s+[\s\S]*?position=\{\[-0\.8, 0, -10\.35\]\}/.test(scene) &&
      building.includes("<mesh position={[0, 0.22, 0]} castShadow receiveShadow>") &&
      building.includes("<boxGeometry args={[9.8, 0.44, 4.65]} />") &&
      building.includes("<mesh position={[-0.35, 0.5, 2.38]} castShadow receiveShadow>") &&
      building.includes("StoneStep position={[3.9, 0.035, 4.72]}") &&
      building.includes("StoneStep position={[3.9, 0.08, 3.55]}") &&
      building.includes("StoneStep position={[3.9, 0.045, 4.18]}"),
    message: "House placement must stay physically grounded with foundation, veranda, and low entry steps.",
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
      scene.includes("const plantingCount = isMobile ? 160 : 380"),
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
