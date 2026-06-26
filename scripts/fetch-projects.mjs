/* ============================================================================
 *  Bakes GitHub project data into src/projects.json at build time.
 *  Run:  node scripts/fetch-projects.mjs    (requires the `gh` CLI, logged in)
 *
 *  Only the repos in CURATED below are included — edit that list to control
 *  which projects appear on the site. Private repos are intentionally excluded;
 *  this site is public, so anything baked here becomes public too.
 * ==========================================================================*/
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const OWNER = "rupayon123";

const CURATED = [
  "gta-free-stem-opportunities",
  "gta-free-stem-ios",
  "arduino-blocks-lab",
  "PipHackLup",
  "my-app",
  "all-in-one-resume-builder-job-assist-applier",
];

const gh = (args) => execFileSync("gh", args, { encoding: "utf8" });

const projects = CURATED.map((repo) => {
  const meta = JSON.parse(gh(["api", `repos/${OWNER}/${repo}`]));
  let languages = {};
  try {
    languages = JSON.parse(gh(["api", `repos/${OWNER}/${repo}/languages`]));
  } catch {
    /* no languages reported */
  }
  const topLangs = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  return {
    id: repo,
    name: meta.name,
    description: meta.description || "",
    homepage: meta.homepage || "",
    repo: meta.html_url,
    stars: meta.stargazers_count || 0,
    topics: (meta.topics || []).slice(0, 6),
    languages: topLangs,
    pushedAt: meta.pushed_at,
  };
});

const outUrl = new URL("../src/projects.json", import.meta.url);
writeFileSync(outUrl, JSON.stringify(projects, null, 2) + "\n");
console.log(`Wrote ${projects.length} projects to src/projects.json`);
