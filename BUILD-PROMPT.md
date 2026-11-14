# Build prompt: Perraz Badhniwalla's portfolio

Give everything below the line to the AI that will build the site.

---

Build a production-quality, award-level personal portfolio for **Perraz Badhniwalla**: MBA Tech student (computer engineering + finance, MPSTME NMIMS, Mumbai, class of 2027), product designer and front-end builder, open to product, front-end and fintech roles from 2027. First person, quiet, precise, spacious. The feeling is "this person is a craftsman."

## 1. Stack and architecture

- Vite + React 18 + TypeScript SPA. GSAP + ScrollTrigger + Lenis (Lenis driven from `gsap.ticker`, `gsap.ticker.lagSmoothing(0)`, `lenis.on('scroll', ScrollTrigger.update)`). On iPhone and iPad skip Lenis and use `ScrollTrigger.normalizeScroll({ allowNestedScroll: true, type: 'touch' })`; always `ScrollTrigger.config({ ignoreMobileResize: true })`.
- Raw WebGL2 for the ink simulation. No three.js.
- A tiny custom history router in `src/lib/router.ts`: `go(to, from?)`, `usePath`, `linkProps(to, expand?)`, `setTransition((swap, from?) => void)`.
- Deploy on Vercel (static). `vercel.json` rewrites only `/ink-story` to `/index.html` (project pages are prerendered files; every other address gets `dist/404.html`, a real 404 marked `noindex`) and sets `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` and `/fonts/*`, and `public, max-age=604800, stale-while-revalidate=86400` for `/media/*`.
- Pinned sections go inside `.pin-wrap` divs so GSAP pin-spacers never disturb React siblings.
- Routes: `/` (Hero, Work, About, Experience, Contact), `/work/:slug` (lazy `Case` + Contact), `/ink-story` (lazy lab preview, disallowed in robots.txt). Any other path renders the "Not here" page (title "Not here — Perraz Badhniwalla", `<meta name="robots" content="noindex">` added while it shows).
- All copy and project data live in one file, `src/content.ts` (`site`, `experience`, `education`, `alsoBuilt`, `recognition`, `projects`, plus the `Media`, `Story`, `Project` types and the `TODO()` / `isTodo()` helpers). Components read from it; no copy inside components. Facts not yet supplied by the owner are written as `TODO('question')`: shown as a "TODO for Perraz" note only in development (`import.meta.env.DEV`), never in production. Never invent facts or metrics.
- Keep a `DESIGN.md` at the repo root as the source of truth for the design language.

## 2. Design language

- **Editorial leads.** Type and space do the talking. The WebGL ink is the hero's opening statement only; after the hero everything is ink on paper, calm and typographic.
- **Colour tokens.** paper `#e9ecef`, ink `#212529`, ink-2 `#343a40`, ink-soft `#495057`, magma `#f6440e`, `--magma-text: #e23d0b` (magma used as text on paper, for contrast), ember `#ffb238`, deep `#b3261e`. Magma is a rare signal. Flat colour: no grain, no gradients, except the hero ink and the name gradient on the share image. Only one dark section: Contact (small ink cards inside a page, like the Aegis folder or a case study's After card, are fine).
- **Fonts** (self-hosted woff2 in `/public/fonts`, `font-display: swap`, preload the two variable fonts): **Panchang** variable 200–800 (display, statements), **Supreme** variable 100–800 (body, UI), **Courier Prime** 400/700 (typed or analog moments only).
- **Type scale vars:** `--fs-caption 16px`, `--fs-ui 17px`, `--fs-body 19px` (15/16/17 on mobile), `--fs-lead clamp(21px,1.7vw,26px)`, `--fs-h3 clamp(22px,2vw,30px)`, `--fs-h2 clamp(42px,6.4vw,124px)`. All display titles share `line-height: .94; letter-spacing: -.032em`. Body text must be readable: Supreme at weight 400–500, never a thin weight.
- **Square corners everywhere:** cards, buttons, fields, focus rings. Only phone and TV device frames keep hardware rounding. Shadows are two-layer and ink-tinted (`rgba(33,37,41,…)`), never pure black.
- **Motion is crisp:** 0.3–0.6s, `cubic-bezier(0.16,1,0.3,1)` ease-out. Respect `prefers-reduced-motion` everywhere (plain list for Work, a settled single ink frame, no reveals, no loops).
- **Reveals** via `data-reveal` and one `IntersectionObserver` (`rootMargin: 0 0 -8% 0`, `threshold .12`), each plays once, observer batched through a `MutationObserver` once per frame:
  - `rise`: headings come up from behind a mask
  - `line`: a hairline draws in from the left
  - `fade`: text settles up
  - `unveil`: clip-path on the child image (never on the observed element)
  - `count`: mechanical digit reels; each digit slot is sized by an invisible copy of its glyph so "2027" spaces like normal text; screen readers get an `sr-only` copy
  - `mark`: the highlighter
- **Highlighter:** small headings (About, Design/Build/Finance, Education/Recognition/Also built, case-study block titles) carry a solid magma mark that sweeps in from the left. Headings only; never body text.
- **Links and hover: the letter roll.** Link text is split into letters in a `Roll` component (`sr-only` plain text + `aria-hidden` letters). Each letter rises in turn (16ms stagger, 0.4s) and reveals an orange copy of itself (the letter's own `text-shadow` parked one line below). It stays orange while hovered or focused and rolls back when the pointer leaves. Used on header links, Contact links, "See what I've built", "All work", Work card names, Experience company names and "Next project". Orange is `--magma-text` on paper and `--magma` over dark. No underline and no colour inversion. On devices with no hover, tappable links keep a thin 1.5px orange underline instead. Core CSS:

```css
.roll__chars { display:inline-flex; overflow:hidden; vertical-align:bottom; line-height:1.25; padding-bottom:.05em; }
.roll__c { display:inline-block; white-space:pre; text-shadow:0 1.25em 0 var(--roll,var(--magma-text));
  transition:transform .4s var(--ease-out); transition-delay:calc(var(--i,0)*16ms); }
:is(a,button):is(:hover,:focus-visible) .roll__c { transform:translateY(-1.25em); }
.contact .roll, .header[data-dark] .roll { --roll:var(--magma); }
```

- **Buttons** invert ink/paper (hover: transparent with inset ink outline).
- **Header** is plain ink and switches to paper only while it sits over the dark Contact section. It hides while reading down and returns on scroll up (past the top it sits on its own bar). The menu has a **focus lens**: hovering sharpens the nearest link, softens the others, and one square lens glides between them. A thin magma progress line runs along the header; a square back-to-top button appears far down the page (not over Contact).
- **Command menu** (`Palette`): Ctrl/⌘ + K from anywhere, placeholder "Where to?"; typing narrows, arrows and Enter choose; every page, project and contact action is one line away.
- **Side index** (`SideNav`, home, wide screens only, not over the hero): thin lines down the left edge, one per section; the current one draws long in magma; pointing at the index shows the names.
- **Desktop only:** custom cursor (dot + ring, `data-cursor` labels) and magnetic links (power3.out 0.4s, off for reduced motion). Keep the I-beam over inputs; disable the custom cursor in forced-colors.
- **Phones** get the same story driven by touch: press feedback (`scale .97` active, spring back), haptic ticks via `navigator.vibrate` (Android only, only after first user activation, never for reduced-motion) on Work-card snaps, button presses, typewriter keys and opening an Experience row; every tap target at least 44px; inputs at least 16px.

## 3. Sections

### Loader (about 2s, once per session)
Gate on `sessionStorage 'pre-seen'`, read once at module level (so React dev double-effects don't mark it seen). A sheet of ink with the name "Perraz" set in paper on a canvas drawn with the **same word layout as the hero's ink mask** (shared `placeWord(ctx, text, box)` in `src/hero/wordmark.ts`, font `800 200px Panchang`). The name comes out of a blur, a 000–100 counter runs (1.1s, `power2.inOut`) and a thin magma line fills along the bottom. Then the sheet folds down into that line; underneath, the live ink is already showing the name in the same place (`window.__inkHandoff` / `__inkFlooded`: the hero ink starts with its letters flood-filled), ready to flow. Warm and decode the first project images (`new Image().decode()`) during the loader, at the size this screen will use. 7s bail-out. Skipped entirely for reduced-motion.

### Hero (pinned, `+=200%`, scrub, ease none)
Only the word "Perraz" in live ink at first. As you scroll, the stage glides up and scales to 0.6 and the pitch slides in beneath: "I design products, / build them myself, / and know their worth." (last line magma) plus the status "Open to product, front-end and fintech roles from 2027" with a pulsing dot (transform/opacity only) and the link "See what I've built". After 3.5 seconds on desktop a quiet hint fades in ("Write something, or scroll.") unless the visitor has already found the typewriter; on touch devices the typewriter's own "Write something" button fades in instead. Both disappear on scroll or on writing.

### The ink (WebGL2 stable-fluids)
- Dye stored as light absorbed so colours mix like ink. Programs: SPLAT, ADVECT, DIVERGENCE, CURL, VORTICITY, PRESSURE, GRADIENT, FADE, FLOOD, DISPLAY. Compile all programs, then link all, then check status.
- The letter mask is drawn on a 2D canvas (word typeset once at 200px and scaled, blur `0.5·scale` px, DPR up to 2 desktop / 1.5 phone), uploaded as a texture. Shaders take a `maskXf` uniform (scale + offset) so scrolling the word changes only three numbers: no redraw or upload per frame. A `follow` function on `gsap.ticker` computes `setMaskTransform(1/s, rest.x/W - b.x/(sW), 1 - rest.y/H - 1/s + b.y/(sH))`. Redraw the mask on ResizeObserver and whenever a font finishes loading (`document.fonts` `loadingdone`), then call `maskChanged()` so the texture re-uploads.
- Display shader: lit edge, subtle edge wobble from velocity, grain, soft fade to paper on all four sides (`edges` uniform). **Lava:** molten veins inside the letters (`lava`, `lavaZoom` uniforms; `lavaZoom = clamp(canvasH / wordH / 6, 1, 4)` so the veins keep their size against the letters on phone and desktop). **Cursor warp:** a trail of the last 12 pointer points (plus a `warpBurst` on press) spins the picture locally, so the letters twist like liquid glass.
- Tuning: half speed (`dt*0.5`), pressure iterations 18 (12 phone), sim 160px (128 phone), dye ≤720 (≤420 phone) and never more than ~0.9× screen pixels. Adaptive: keep an average frame time; if frames run long, drop pixel ratio first, then iterations; if the average still stays above ~45ms (60 frames once nothing is left to drop, 180 otherwise) **settle**: stop the loop and keep a still frame (`ink:settled` event). No per-frame allocations in the loop.
- **Back-off:** a software GPU (`WEBGL_debug_renderer_info` matching SwiftShader / llvmpipe / softpipe / "software" / Basic Render / Mesa offscreen) starts light (DPR 1, 6 iterations) and settled: it shows the molten letters with no smoke simulation. Reduced motion is the same settled still frame. A settled field repaints its display only when the mask transform, lava zoom, edges or size change (once per rAF, throttled to 90ms on software), so the still name still follows the scroll glide. Only simulate while on screen (IntersectionObserver), and pause after 45s without pointer, key, scroll, wheel, touch or `ink:drop` input; the ghost stir also waits.
- Input: pointer drag splats ink (press and drag pulls taffy-like); ambient drips every 0.2s from inside the letters; a ghost hand stirs the word on a slow 2.6s cubic S-curve when idle; phone tilt (`deviceorientation`) sloshes ink only while on screen; cap the splat queue at 48 and drain at most 10 per frame; debounce mask readback at 250ms.
- Fallback if WebGL2 or float render targets are unavailable: a Panchang "P" with a gradient. Do **not** call `WEBGL_lose_context` on dispose (it triggers the fallback); only free buffers and the VAO.

### Write in ink (typewriter under the name)
- Desktop: typing near the top (only when nothing interactive has focus; never steal Enter/Space from links and buttons) strikes Courier Prime letters, each with deterministic tiny rotation/offset/opacity jitter, onto the paper under the name. Max 3 lines × 34 characters, auto-wrap, Backspace lifts a letter in an ink puff, Enter starts a new line. Each strike drops ink into the fluid at the letter's position (`ink:drop` event). Typing "hire" opens the CV once.
- Phones: a hidden textarea is focused by the "Write something" button.
- Once there is text, show: three **card design thumbnails** as native radios in a fieldset (Bloom, Night, Proof; live mini previews of the user's own words and name, regenerated 450ms after typing stops), an optional "Your name" field, **Print it** (downloads `written-in-ink-NNNN.png`) and **Clear**. Actions are `inert` while hidden.
- If the writing area would run off a short screen, the name and its ink lift just enough (`--lift` var applied via `translate` to `.hero__mark` and `.tw > *`, not to elements GSAP also transforms).
- The postcard module is lazy-loaded. Three designs, 1600×1000, drawn on canvas with marbled domain-warped fbm ink grown fresh from a seeded RNG (seed = hash of words + name), crop marks, grain, grid. Night is dark with glowing ink; Proof has a margin column and drips. The footer credit sits on a small label for legibility: the portfolio link `perraz-badhniwalla.vercel.app` always, plus "Written by <name>" if given. **Never print the owner's name on the card.**

### Work (pinned deck)
Heading "Things I've built." Square-cornered cards with ink-tinted shadow start stacked in 3D on the right (centred on narrow screens), deal into a row, then slide (desktop: linear scrub). On narrow screens the row steps one card at a time with `snapTo: 'labelsDirectional'` (0.15–0.3s, a haptic tick on complete, a `start` label). Phones in portrait show tall covers (`portrait` media) in 4:5 cards; give `.w2__card` `min-width: 0`. Beside the heading on wide screens (hidden at ≤1100px) one lead line: "Five products. Designed, coded and shipped by one person." (`site.workLead`). Each card's picture resolves from halftone dots into the full image as it arrives and rises a little toward the pointer. Cards still in the stack are `inert` until the deal finishes; focusing the front card with the keyboard scrolls to the dealt point. Card images use `sizes="(max-width: 759px) min(66vw, 340px), (max-width: 959px) min(82vw, 640px), min(82vh, 924px)"`. The fifth card is the **Aegis teaser**, a sealed folder (the front lifts a little and a redacted page shows, but it never opens): "In the works", outlined Aegis title, "A research desk for Indian markets that I'm building on my own laptop. Careful with data, strict with risk, and patient before it ever trades." Teaser only, no screenshots. Tapping or clicking a project card expands its image to fill the screen via an animated `clip-path` on a fixed clone (videos replaced by their poster); the case page loads beneath and the clip settles onto the case header image (`.case__stage`).

### About
Large statement inking in word by word with scroll (scrubbed from a readable floor to 1: 0.52 for plain words, 0.85 for the magma-text words, so every word passes 3:1 as large text before it inks): "I study two things at once: computer engineering and finance. One taught me how to build a product, the other how to ask whether it is worth building." (the phrase after the colon in magma-text). Facts row: Studying — Computer engineering / Alongside — Finance (MBA Tech) / At — NMIMS, Mumbai / Class of — 2027 (count reel). Paragraph: "Outside class I ship my own apps. I design them, write the code and keep going until they feel right. Before all of this I represented India at the Karate World Championship, which is where I learned to practise the same move a thousand times." Skills columns: **Design** (UI and UX design, Design systems, Motion, Prototyping), **Build** (TypeScript and React, Next.js, Python, Java), **Finance** (MIS and reporting, Reconciliation, Forex operations, Excel). Column labels carry the highlighter and have no rules above or below.

### Experience
Compact expandable rows (date counter | company in Panchang | role | +/−), latest open by default. Accessible accordion: buttons with `aria-expanded`/`aria-controls`; collapsed bodies become `visibility:hidden` after the 0.45s grid-rows transition; haptic tick on open.
- **SOTC Travel**, May – Sep 2026, Management intern, corporate finance. Consolidated and checked data for budgeting, P&L, balance sheet and cash-flow reporting, flagging discrepancies before they reached management. Processed about 120 forex approvals a day in the SAP-based Canvas system and grouped spot purchases by currency.
- **Hitachi Systems India**, May – Jul 2025, Technical intern, application consulting. Designed JMeter load tests for a banking application and monitored the backend with Dynatrace. Built a synthetic monitoring system in Java, MySQL and Grafana that handles OTP steps and captures error screenshots, plus a multithreaded Selenium tool for URL and asset checks.

Below the rows, three small lists:
- **Education:** MBA Tech: BTech Computer Engineering with an MBA in Finance (minor in Marketing), MPSTME, NMIMS, Mumbai, 2022 – 2027.
- **Recognition:** Represented India, Karate World Championship (2018); Sub-Head, Logistics, 4C The Marketing Cell, NMIMS (2023–24); Best Executive, Logistics, 4C The Marketing Cell (2022–23); Bloomberg Market Concepts certificate (2026).
- **Also built:** Fashion recommender (hybrid content-based and collaborative filtering on H&M customer data); Blockchain voting (Solidity, React, Hardhat, IPFS); Attendly (the first version of CUBE: timetable, attendance, grades, notes and exam quizzes, offline).

### Contact (the one dark ink section)
Small question "Got an idea that should exist?" then the email **pbadhniwalla@gmail.com** set as large as the width allows (JS fits the font-size; two lines on phones: name over @gmail.com). Letters fill magma left to right on hover (on touch, as it arrives). A quiet link row: Copy email (announced through a `role="status"` region), Download CV (`/Perraz-Badhniwalla-CV.pdf`), LinkedIn (https://www.linkedin.com/in/perraz-badhniwalla-367ab324a), GitHub (https://github.com/Peru-107), Instagram (https://instagram.com/byperraz). At the foot, the **ink pad**: "Let's build." Tap it on, then press and drag to draw like a pen; each stroke goes down fiery yellow, warms through ember to magma and fades; the things I've made sit on top and shy away from the pointer on springs; after five quiet seconds it rests and invites again. **No phone number anywhere.** Footer: "© year Perraz Badhniwalla — Designed and built by me with WebGL, GSAP and Lenis — Back to top".

### Case studies (`/work/cube|nextup|folio|glass-home|byperraz`)
Big masked title; facts (Type, Role, Year as a count reel, live link); a summary line; the cover (video with WebM + MP4 sources, `preload="none"`, played only when near the viewport; or an image) waits small between two flank words (`flank`), then zooms to fill the screen with scroll (`+=110%`, scrubbed). Then a design story in parts, with a rail beside them listing the parts: **The problem**, **What it does** (lines answer the pointer with a magma tick), **How I decided** (`story.decisions`, numbered with magma counters, plus `story.media`), **Before and after** (`story.beforeAfter`: two cards, the After in ink with a magma label, optional `media`; hidden in production unless both sides are real), **Built with** (square tags), **Where it stands** (`result` plus `story.outcomes`, without repeating the result). A depth carousel (`Depth`) shows the screens. Then "Next project" (letter roll); on desktop the next cover follows the pointer, placed above-right of it so the name stays readable. Focus moves to the new page's `h1` after navigation. The page change is an ink-coloured wipe (0.45s in, 0.55s out), not magma.

Projects (all 2026, role "Design and build"):
1. **CUBE**, College companion app. "Your whole college day in one free app: timetable, attendance, grades, notes, maps and chat." Scan a timetable once and it becomes your schedule; mark classes with a swipe and see the hours you can still miss; a grades calculator that tells you the marks you need on any GPA scale; a study notebook that answers questions about your notes and PDFs; campus map, reminders, and a nearby chat that works with no internet. Next.js, TypeScript. Live and free at https://cu-be.vercel.app. Grew out of Attendly.
2. **Nextup**, Web app and Chrome extension. "Turn what you save into what you do: every saved post gets one next action." Save by link, screenshot or the Chrome extension; This week / Later / Done with Undo everywhere; Free and Pro plans with UPI payments approved from an admin panel; 7 styles, 12 contrast-checked palettes, 11 ambient backgrounds; planned through a debate between seven AI agents. Next.js, TypeScript, Manifest V3, SQLite and Postgres. Packaged for the Chrome Web Store.
3. **Folio**, Reading companion. "A calm reading app with a focus room, a sound mixer and a sprout that grows as you read." Today page in one editorial column; focus room (25, 45 or open timer); sound mixer with 9 generated channels and 6 presets; Sproutling, a live SVG character that grows from Seed to Grove; installable and offline. HTML, CSS, JavaScript, Web Audio, service worker. About 400 KB first load, no layout shift.
4. **Glass Home**, Android TV home screen. "A glass home screen for my Android TV, built for a remote and a slow chip." Rotating nature wallpapers, a frosted dock, a focus ring designed for arrow keys, a glass All apps sheet, cheap effects only. Java (about 4,200 lines), Android SDK, built with a script instead of Android Studio. Runs daily on the owner's TV.
5. **byperraz engine**, Content studio for Instagram. "A small studio on my laptop that plans, writes and renders design-tip carousels." A 30-day topic plan; renders 4:5 slides from an HTML template and writes captions and alt text; a dashboard where nothing posts until Approve; stages posts at 13:00 and 18:00 with a Windows notification. Python, Flask, Playwright, Gemini. Link: https://instagram.com/byperraz.

Case pages need real screenshots and video supplied by the owner (`/public/media`, WebP with `-400/-600/-800` variants, WebM + MP4 for video). Use placeholders until they arrive.

## 4. Performance and quality bar

- Lighthouse mobile ≥ 90 performance on real hardware, Accessibility 100, Best Practices 100, SEO 100. In headless Chrome (software GPU) the ink settles to its still frame, so lab TBT measures the page, not the simulation.
- Code-split lazy routes, vendor chunks (`motion`: gsap + lenis; `react`), and the postcard module. Inline the CSS at build (a small Vite plugin replaces the `<link rel="stylesheet">` with `<style>`). `build.target es2020`.
- WebP images with `srcset`/`sizes`; WebM (VP9) with MP4 fallback; preload the two variable fonts.
- Per-frame work on transform / opacity / clip-path only. No layout reads in scroll handlers (use `gsap.ticker`, cache measurements, use the mask-transform uniform). Refresh ScrollTrigger after fonts load (`document.fonts.ready.then(ScrollTrigger.refresh)`).
- Nothing about visual quality may be traded for optimisation.

## 5. Accessibility

Skip link; one `h1` per page; command menu (Ctrl/⌘ K, plus a 44px search key in the header on touch and ≤959px; both keys `aria-haspopup="dialog"`; "Copied" announced only on success, otherwise fall back to `mailto:`); stacked Work cards `inert` until dealt; native radios for card designs; `inert` on hidden typewriter actions; focus ring `2px --magma-text` (bright magma over dark); `aria-hidden` on decorative canvases, loader and cursor; reduced-motion stops animation loops; no unlabeled live regions; forced-colors support; counters expose plain text via `sr-only`.

## 6. SEO and sharing

- A Vite `closeBundle` plugin writes `dist/404.html` (noindex, no canonical) and `dist/work/<slug>/index.html` per project, each with its own `<title>` (`CUBE: College companion app — Perraz Badhniwalla`), description (the project summary), canonical, `og:*` and `twitter:*` tags, and image `/og/<slug>.png`; it also writes `sitemap.xml` with `lastmod`.
- `og.png` 1200×630: paper background, big gradient "Perraz", full name, pitch line, magma tag "Product design, front-end and finance", "MBA Tech, NMIMS Mumbai. Class of 2027". Per-project cards 1200×630: cover on the left 60%, title + kind on the right.
- Favicon (SVG, square, ink with a magma P), `favicon-32.png`, `apple-touch-icon.png` (180), `icon-192/512`, `site.webmanifest`, JSON-LD `Person`, `robots.txt` (`Disallow: /ink-story`), `theme-color #e9ecef`.

## 7. Process

- Commit and tag a restore point before every deploy: `git tag restore-YYYY-MM-DD-before-<change>`. Deploy with `npx vercel@latest deploy --prod --yes`.
- Verify desktop, tablet, and phone portrait/landscape at 320, 375, 430, 768, 1024 and 1920 widths: no horizontal overflow, 44px tap targets.
- Ask before publishing anything outward-facing. Never enter or ask for passwords or tokens.
