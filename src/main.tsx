import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// For the curious who open the console
console.log(
  '%cPerraz%c  Designed and built by hand: Vite, React, GSAP and raw WebGL.\nLooking under the hood? Let’s talk: pbadhniwalla@gmail.com',
  'font: 800 28px system-ui; color: #f6440e',
  'font: 14px system-ui; color: inherit',
)

// The loading screen always opens onto the top of the page
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
