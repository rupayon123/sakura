# Sakura Garden - Rupayon Haldar

Live site: https://rupayon123.github.io/sakura/

An interactive WebGL personal website built as a stylized sakura garden around a
family promise. The scene is centered on exactly one giant sakura tree, a small
grounded Japanese home with the sign 「栗原の家」, and garden beds that connect
Rupayon's projects, roots, and personal story.

The target feeling is cinematic, warm, and alive: an open Japanese garden with
fallen petals, stone paths, planted beds, lanterns, and a modest Kurihara family
home. It is not a static wallpaper, a palace, a fantasy shrine, or a toy diorama.

## Experience

- One giant interactive sakura tree with falling petals and subtle motion
- A grounded local Japanese house that opens the Kurihara family and grandmother story
- GitHub project beds placed as low garden markers around the scene
- About content that ties Rupayon, LinkedIn, GitHub, family, and roots together
- Light mode for warm daylight and dark mode for a moonlit garden
- Orbit controls, motion toggle, theme toggle, project panels, and house story

## Tech

Vite, React, TypeScript, Three.js, React Three Fiber, Drei, and postprocessing.
The garden is rendered in WebGL with procedural meshes, generated textures, and
local content data.

## Content

Personal story and project presentation live in `src/content.ts`.

Project data is baked from public GitHub repositories. To change which repos
appear, edit the `CURATED` list in `scripts/fetch-projects.mjs`, then run:

```bash
node scripts/fetch-projects.mjs
```

Only curated public repositories are included because the site is public.

## Verification

The production build runs a garden-brief verifier before compiling:

```bash
npm run verify:garden
npm run build
```

The verifier protects the current direction by checking that:

- exactly one sakura tree is rendered
- extra bush/tree components stay disabled
- old starter/demo project names do not return
- family content stays on the house instead of the top nav
- 「栗原の家」 remains in both story content and the house texture
- the house remains clickable
- runtime source stays free of console/debug leftovers

## Run Locally

```bash
npm install
npm run dev
```

Local development serves the site at http://localhost:5173/.

## Deploy

Pushing to `main` builds and publishes through GitHub Actions to GitHub Pages.
