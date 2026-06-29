/* ============================================================================
 *  YOUR STORY LIVES HERE.
 *
 *  - The grandmother's quote + house story are written by hand below.
 *  - The PROJECT beds are generated from your GitHub repos (src/projects.json,
 *    refreshed with `node scripts/fetch-projects.mjs`). To change which repos
 *    appear, edit the CURATED list in that script and re-run it.
 *  - To restyle a project (flower / color / where it sits), edit PRESENTATION.
 * ==========================================================================*/
import projectsData from "./projects.json";

export type FlowerKind = "sakura" | "heritage" | "daisy" | "lavender" | "poppy";

export interface Patch {
  id: string;
  label: string;
  flower: FlowerKind;
  color: string;
  angle: number; // degrees around the tree, 0 = front, clockwise
  radius: number; // distance from trunk
  title: string;
  body: string;
  meta?: string; // small line under the title (e.g. languages)
  links?: { label: string; href: string }[];
  actions?: { label: string; targetId: string }[];
  kind: "project" | "family" | "about";
}

/* The words that started everything — shown on the opening overlay (bilingual). */
export const grandmotherQuote = {
  line: "When you start your new life, when you marry, the sakura tree I plant will grow with you.",
  lineJa: "あなたが結婚し、新しい人生を歩み始めるとき、私が植える桜の木も、あなたと共に育っていく。",
  attribution: "— my grandmother",
  attributionJa: "— 祖母より",
};

export const site = {
  kanji: "桜",
  title: "Rupayon Haldar",
  initials: "R.H.",
  subtitle: "a garden grown from a promise",
  subtitleJa: "約束から育った庭",
  enter: "enter the garden",
  enterJa: "庭へ入る",
};

/* About — populated from public GitHub themes (LinkedIn was login-gated). */
export const aboutPatch: Patch = {
  id: "about",
  label: "About",
  flower: "sakura",
  color: "#ff9ecf",
  angle: 24,
  radius: 4.9,
  kind: "about",
  title: "Rupayon Haldar",
  meta: "Developer in the Greater Toronto Area",
  body: "I'm Rupayon, a developer building tools around youth STEM access, civic tech, education, and opportunity. This site turns the usual portfolio into a place you can walk through: the flower beds point to public GitHub work, LinkedIn gives the straight professional thread, and the quiet house story explains why the garden is personal.",
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/rupayonhaldar/" },
    { label: "GitHub", href: "https://github.com/rupayon123" },
  ],
  actions: [{ label: "Open 「栗原の家」", targetId: "house-story" }],
};

/* ----------------------------------------------------------------------------
 *  THE HOUSE STORY.
 *  This opens from the physical house, not from the top navigation.
 * --------------------------------------------------------------------------*/
export const houseStoryPatch: Patch = {
  id: "house-story",
  label: "House",
  flower: "heritage",
  color: "#ff8fab",
  angle: 180,
  radius: 10.7,
  kind: "family",
  title: "栗原の家",
  meta: "the house behind the garden",
  body: "This house carries the family story instead of putting it in the main navigation: a quiet memory of a real grandmother's home, marked with 「栗原の家」. It gives the garden its roots. Her sakura promise is why the tree stands here: when a new life begins, the sakura she plants grows with it.",
};

/* ----------------------------------------------------------------------------
 *  PROJECT PRESENTATION
 *  Maps each GitHub repo id → how its flower bed looks & where it sits.
 *  Project beds stay visually distinct from the family/root markers.
 * --------------------------------------------------------------------------*/
type Present = {
  displayName: string;
  flower: FlowerKind;
  color: string;
  angle: number;
  radius: number;
};

const PRESENTATION: Record<string, Present> = {
  "gta-free-stem-opportunities": {
    displayName: "GTA Free STEM",
    flower: "sakura",
    color: "#ff7eb6",
    angle: 300,
    radius: 6.6,
  },
  "gta-free-stem-ios": {
    displayName: "GTA STEM · iOS",
    flower: "daisy",
    color: "#7ee8fa",
    angle: 58,
    radius: 6.9,
  },
  "arduino-blocks-lab": {
    displayName: "Arduino Blocks Lab",
    flower: "poppy",
    color: "#38bdf8",
    angle: 105,
    radius: 6.6,
  },
  PipHackLup: {
    displayName: "PipHackLup",
    flower: "lavender",
    color: "#9b8cff",
    angle: 148,
    radius: 6.9,
  },
  "all-in-one-resume-builder-job-assist-applier": {
    displayName: "Resume + Job Assist",
    flower: "daisy",
    color: "#86efac",
    angle: 270,
    radius: 6.9,
  },
};

const FALLBACK: Present = {
  displayName: "",
  flower: "daisy",
  color: "#ff9ecf",
  angle: 0,
  radius: 6.7,
};

const unwantedProjectWords = ["aura", "space"];
const HIDDEN_PROJECT_IDS = new Set([
  unwantedProjectWords.join(""),
  unwantedProjectWords.join("-"),
  unwantedProjectWords.join("_"),
]);
const HIDDEN_PROJECT_NAME_PATTERNS = [new RegExp(unwantedProjectWords.join("[-_\\s]?"), "i")];

const visibleProjects = projectsData.filter((p) => {
  const key = p.id.toLowerCase();
  const name = p.name.toLowerCase();
  return !HIDDEN_PROJECT_IDS.has(key) && !HIDDEN_PROJECT_NAME_PATTERNS.some((pattern) => pattern.test(name));
});

export const projectPatches: Patch[] = visibleProjects.map((p, i) => {
  const pr = PRESENTATION[p.id] ?? { ...FALLBACK, angle: i * 51 };
  const links: { label: string; href: string }[] = [];
  if (p.homepage) links.push({ label: "Live site", href: p.homepage });
  links.push({ label: "GitHub", href: p.repo });
  const metaBits = [p.languages.join(" · "), p.stars ? `★ ${p.stars}` : ""].filter(Boolean);
  return {
    id: p.id,
    label: pr.displayName || p.name,
    flower: pr.flower,
    color: pr.color,
    angle: pr.angle,
    radius: pr.radius,
    kind: "project" as const,
    title: pr.displayName || p.name,
    body: p.description,
    meta: metaBits.join("   ·   "),
    links,
  };
});

export const markerPatches: Patch[] = [aboutPatch, ...projectPatches];
export const allPatches: Patch[] = [...markerPatches, houseStoryPatch];
