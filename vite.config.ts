import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

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
  plugins: [react(), inlineCss()],
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
