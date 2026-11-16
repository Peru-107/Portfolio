# Portfolio rebuild (v2)

Sibling Vite app — **does not replace** the live site at the repo root.

Japanese-inspired Neo-Tokyo craftsman folio: new design system, scroll-story layout, case templates. Keeps the WebGL ink hero. Hard floor: site-wide ≥60fps.

## Run

```bash
cd rebuild
npm install
npm run dev
# → http://127.0.0.1:43128
```

Build / preview:

```bash
npm run build
npm run preview
```

## Live site (unchanged)

From the repo root:

```bash
npm install
npm run dev
# → http://127.0.0.1:43127
```

## Assets

`public/fonts`, `public/media`, and `public/og` are symlinks into the parent `public/` so media stays single-source. Do not delete parent media.

## Restore

Tag before this change set: `restore/pre-full-rebuild-v2-8ded`
