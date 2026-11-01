import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Libraries in their own files: they change rarely, so returning visitors keep them cached
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          motion: ['gsap', 'gsap/ScrollTrigger', 'lenis'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
