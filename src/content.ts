/* ============================================================================
 *  YOUR STORY LIVES HERE.
 *
 *  - The grandmother's quote + family (tulip) beds are written by hand below.
 *  - The PROJECT beds are generated from your GitHub repos (src/projects.json,
 *    refreshed with `node scripts/fetch-projects.mjs`). To change which repos
 *    appear, edit the CURATED list in that script and re-run it.
 *  - To restyle a project (flower / color / where it sits), edit PRESENTATION.
 * ==========================================================================*/
import projectsData from "./projects.json";

export type FlowerKind = "sakura" | "tulip" | "daisy" | "lavender" | "poppy";

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
  angle: 0,
  radius: 0,
  kind: "about",
  title: "Rupayon Haldar",
  meta: "Builder of tools that open doors",
  body: "I'm a developer in the Greater Toronto Area who builds tools that open doors — in youth STEM access, civic tech, and education. I made GTA Free STEM (a website + iOS app for finding free STEM opportunities, volunteer hours, and co-op / SHSM pathways across the GTA) and Arduino Blocks Lab (Blockly block-coding for robotics). I love full-stack building and the energy of hackathons. From civic platforms to a B2B SaaS app and a resume + job-assist tool, I gravitate toward software that makes opportunity more accessible.",
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/rupayonhaldar/" },
    { label: "GitHub", href: "https://github.com/rupayon123" },
  ],
};

/* ----------------------------------------------------------------------------
 *  THE FAMILY — TULIPS.
 *  Tulips carpet the whole garden (see TulipField); these are the special,
 *  clickable tulip beds that hold the family stories. Tulips only — always.
 * --------------------------------------------------------------------------*/
export const familyPatches: Patch[] = [
  {
    id: "family",
    label: "Family",
    flower: "tulip",
    color: "#ff5d8f",
    angle: 215,
    radius: 4.2,
    kind: "family",
    title: "Family",
    body: "Tulips run all through this garden because they run all through us. This whole field is family — the people who planted me. Write here what family means to you, the names, the love that holds it together.",
  },
  {
    id: "grandmother",
    label: "Grandmother",
    flower: "tulip",
    color: "#ff8fab",
    angle: 245,
    radius: 3.5,
    kind: "family",
    title: "Grandmother",
    body: "Her promise is the root of this whole place: that one day I would get a cherry blossom tree. Everything here grows from those words. Tell her story.",
  },
  {
    id: "roots",
    label: "Roots",
    flower: "tulip",
    color: "#ffb3c6",
    angle: 185,
    radius: 4.4,
    kind: "family",
    title: "Roots",
    body: "Where we come from, the traditions we carry, and why tulips have always been ours. The soil the tree stands in.",
  },
];

/* ----------------------------------------------------------------------------
 *  PROJECT PRESENTATION
 *  Maps each GitHub repo id → how its flower bed looks & where it sits.
 *  Use any flower EXCEPT tulip (tulips belong to family).
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
    angle: 0,
    radius: 6.6,
  },
  "gta-free-stem-ios": {
    displayName: "GTA STEM · iOS",
    flower: "daisy",
    color: "#7ee8fa",
    angle: 45,
    radius: 6.9,
  },
  "arduino-blocks-lab": {
    displayName: "Arduino Blocks Lab",
    flower: "poppy",
    color: "#38bdf8",
    angle: 90,
    radius: 6.6,
  },
  PipHackLup: {
    displayName: "PipHackLup",
    flower: "lavender",
    color: "#9b8cff",
    angle: 128,
    radius: 6.9,
  },
  "my-app": {
    displayName: "AuraSpace",
    flower: "poppy",
    color: "#ff6b6b",
    angle: 315,
    radius: 6.6,
  },
  "all-in-one-resume-builder-job-assist-applier": {
    displayName: "Resume + Job Assist",
    flower: "daisy",
    color: "#86efac",
    angle: 340,
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

export const projectPatches: Patch[] = projectsData.map((p, i) => {
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

export const allPatches: Patch[] = [...projectPatches, ...familyPatches];
