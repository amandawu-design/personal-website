# Amanda Wu — Personal Website

A one-page portfolio built with **Astro**, **Tailwind CSS v4** and **Three.js**.

The hero headline — *"I help ambitious team **strategize**, **design** and **build**."* — drives an interactive 3D scene: hovering each word morphs the object, and when idle it auto-cycles through all three.

| Word | 3D shape |
|---|---|
| strategize | Folded, holographic pearl blob |
| design | Twisted glass ribbon knot |
| build | Cube assembled from glass blocks, matte blocks and pearl spheres |

Other features: light / dark mode toggle (remembers the choice, follows the system on first visit), responsive nav with a hamburger menu on mobile, and a hero that fills the first screen on phones.

## Getting started

Requires **Node.js 22+** (built with Node 24).

```bash
npm install
npm run dev        # http://localhost:4321
```

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Type-check the project |

## Editing content

All text and links live in **`src/data/content.ts`**:

- `site` — name, year, nav links
- `social` — email, LinkedIn, Instagram (**replace the placeholders**)
- `about` — intro paragraphs and the four stats
- `caseStudies` — title, tags, image, lede, role and metrics for each project
- `posts` — the Writing list

**Images:** put files in `public/images/` and reference them as `/images/your-file.jpg` (e.g. the `image` field of a case study). Without an image, a gradient placeholder is shown.

## Editing the design

| What | Where |
|---|---|
| Colours (light + dark) | `src/styles/global.css` — the `@theme` block and `html.dark` block |
| Fonts | EB Garamond + Inter, loaded in `src/layouts/Base.astro` |
| Page sections | `src/components/` (`Nav`, `Hero`, `About`, `CaseStudy`, `Writing`, `Footer`, `SocialIcons`) |
| Favicon | `public/favicon.svg`, `public/apple-touch-icon.png` |

### Hero animation

- `src/scripts/hero-scene/index.ts` — hover / auto-cycle logic. `CYCLE_MS` = time between auto-cycle changes.
- `src/scripts/hero-scene/scene.ts` — the Three.js scene.
  - `SPEED` — overall animation speed
  - `holo()` palette and `buildEnvironment()` — animation colours
  - `createBlob()`, `createRibbon()`, `createBlocks()` — the three shapes
  - the `damp(... m === active ? 5 : 9 ...)` values — transition speed

The scene is lazy-loaded after first paint, pauses when off-screen or in a background tab, respects `prefers-reduced-motion`, and falls back to a static gradient circle if WebGL is unavailable.

## Project structure

```
public/                 favicon + static assets
src/
  components/           page sections
  data/content.ts       all editable content
  layouts/Base.astro    <head>, fonts, theme bootstrap
  pages/index.astro     the home page
  scripts/hero-scene/   Three.js hero animation
  styles/global.css     Tailwind theme, colours, dark mode
```

## Deploying

It's a static site — `npm run build` outputs plain HTML/CSS/JS in `dist/`.
The easiest option is to import this GitHub repo into **Vercel** or **Netlify** (both auto-detect Astro); every push to `main` then redeploys the site.
