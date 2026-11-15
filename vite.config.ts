import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { projects } from './src/content'

const SITE = 'https://perraz-badhniwalla.vercel.app'

// Each project page gets its own HTML with its own title, description and share
// image, so a link pasted into LinkedIn or WhatsApp previews that project, not
// the home page. The sitemap is written from the same list.
const pages = (): Plugin => ({
  name: 'project-pages',
  apply: 'build',
  closeBundle() {
    const dist = resolve(__dirname, 'dist')
    const home = readFileSync(resolve(dist, 'index.html'), 'utf8')
    const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    for (const p of projects) {
      const url = `${SITE}/work/${p.slug}`
      const title = `${p.title}: ${p.kind} — Perraz Badhniwalla`
      const html = home
        .replace(/<title>[^<]*<\/title>/, `<title>${attr(title)}</title>`)
        .replace(/(<meta name="description" content=")[^"]*/, `$1${attr(p.summary)}`)
        .replace(/(<meta property="og:title" content=")[^"]*/, `$1${attr(title)}`)
        .replace(/(<meta property="og:description" content=")[^"]*/, `$1${attr(p.summary)}`)
        .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`)
        .replace(/(<meta property="og:image" content=")[^"]*/, `$1${SITE}/og/${p.slug}.png`)
        .replace(/(<meta property="og:image:alt" content=")[^"]*/, `$1${attr(`${p.title}, ${p.kind}`)}`)
        .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`)
      mkdirSync(resolve(dist, 'work', p.slug), { recursive: true })
      writeFileSync(resolve(dist, 'work', p.slug, 'index.html'), html)
    }
    // Addresses that are not pages get a real 404 (Vercel serves this file with that status)
    writeFileSync(
      resolve(dist, '404.html'),
      home
        .replace(/<title>[^<]*<\/title>/, '<title>Not here — Perraz Badhniwalla</title>')
        .replace(/\s*<link rel="canonical"[^>]*>/, '')
        .replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex" />'),
    )
    const today = new Date().toISOString().slice(0, 10)
    const urls = [`${SITE}/`, ...projects.map((p) => `${SITE}/work/${p.slug}`)]
    writeFileSync(
      resolve(dist, 'sitemap.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`,
    )
  },
})

// The stylesheet is small (about 7 KB compressed), so it goes inside the HTML:
// one less request standing between the visitor and the first paint
const inlineCss = (): Plugin => ({
  name: 'inline-css',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const html = bundle['index.html']
    const css = Object.values(bundle).find((a) => a.type === 'asset' && a.fileName.endsWith('.css'))
    if (!html || html.type !== 'asset' || !css || css.type !== 'asset') return
    const tag = new RegExp(`<link rel="stylesheet"[^>]*href="/${css.fileName}"[^>]*>`)
    html.source = String(html.source).replace(tag, () => `<style>${css.source}</style>`)
    delete bundle[css.fileName]
  },
})

// Libraries in their own files: they change rarely, so returning visitors keep them cached
export default defineConfig({
  plugins: [react(), inlineCss(), pages()],
  preview: {
    host: '127.0.0.1',
    port: 43127,
    allowedHosts: ['.trycloudflare.com', 'localhost', '127.0.0.1'],
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['gsap', 'gsap/ScrollTrigger', 'lenis'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
