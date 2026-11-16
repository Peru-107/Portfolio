import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

console.log(
  '%cPerraz%c  Rebuild v2 — Vite, React, GSAP, WebGL ink.\nTalk: pbadhniwalla@gmail.com',
  'font: 800 28px system-ui; color: #ff4d12',
  'font: 14px system-ui; color: inherit',
)

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
