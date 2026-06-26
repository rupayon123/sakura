# 桜 Sakura — a garden grown from a promise

### ▶ Live site: **https://rupayon123.github.io/sakura/**

A personal website built around a single memory: my grandmother told me that when
I get married, I would get a cherry blossom tree. This site _is_ that tree.

At the center is a glowing 3D sakura tree you can orbit and zoom. The whole garden
sits on a field of **tulips** — they run deep in our family — and nestled in that
field are **flower beds for my projects**, each one pulled live from my GitHub.
Click a bed and the camera flies in to tell its story.

- **Tree** — procedural, neon, always shedding petals
- **Tulip field** — the family foundation everything grows from
- **Project beds** — generated from my public GitHub repos
- **Aesthetic** — dark, techno-clean Japanese neon (bloom glow + neon grid)

## Tech

[Vite](https://vite.dev) · [React](https://react.dev) ·
[React Three Fiber](https://r3f.docs.pmnd.rs) · [drei](https://drei.docs.pmnd.rs) ·
[postprocessing](https://github.com/pmndrs/react-postprocessing)

## Editing the content

Everything personal lives in two places:

- **`src/content.ts`** — the grandmother's quote, the family (tulip) beds, and how
  each project is styled (flower type, color, position).
- **Project data is baked from GitHub.** To change which repos appear, edit the
  `CURATED` list in `scripts/fetch-projects.mjs` and re-run it:

  ```bash
  node scripts/fetch-projects.mjs   # rewrites src/projects.json
  ```

  Only the repos you list are included — private repos are intentionally excluded,
  since this site is public.

## Deploy

Pushing to `main` builds and publishes automatically via GitHub Actions
(`.github/workflows/deploy.yml`) to **GitHub Pages** — live at
**https://rupayon123.github.io/sakura/**.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```
