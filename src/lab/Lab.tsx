import { useEffect } from 'react'
import { InkP } from '../hero/InkP'
import { site } from '../content'
import { linkProps } from '../lib/router'
import { MarketInk } from './MarketInk'
import { WorkStack } from '../components/WorkStack'

// A private preview page: hero concepts running live, and body fonts side by
// side. Not linked from the site; open /lab directly.

const HEROES = [
  {
    key: 'p',
    name: 'A. Ink P (current, slowed down)',
    pitch: 'The first letter of your name holds live ink. Calm on its own, it swirls when you move through it.',
    fit: 'Strong, simple mark. Reads instantly as “Perraz”.',
    demo: <InkP play text="P" layout="center" />,
  },
  {
    key: 'name',
    name: 'B. Ink wordmark',
    pitch: 'Your whole name becomes the vessel. The ink runs through every letter.',
    fit: 'More personal than a single letter; visitors learn your name in the first second.',
    demo: <InkP play text="Perraz" layout="center" />,
  },
  {
    key: 'market',
    name: 'C. Market line',
    pitch: 'A price line drawn like a brush stroke. It drifts slowly, and near the cursor it lifts and glows magma.',
    fit: 'Tells your finance + engineering story at a glance, and quietly sets up Aegis.',
    demo: <MarketInk />,
  },
  {
    key: 'stack',
    name: 'D. Work in depth',
    pitch: 'Your real product screens fanned in 3D. The whole stack turns toward the cursor; hover lifts a card out.',
    fit: 'Shows proof of work before a single word is read. Safest for recruiters.',
    demo: <WorkStack />,
  },
]

const FONTS = [
  { family: 'General Sans', css: 'general-sans@400,500,600', note: 'Current. Neutral, clean, slightly geometric.' },
  { family: 'Satoshi', css: 'satoshi@400,500,700', note: 'Friendlier and rounder. Modern product feel.' },
  { family: 'Switzer', css: 'switzer@400,500,600', note: 'Swiss and precise. Calm, very readable at length.' },
  { family: 'Supreme', css: 'supreme@400,500,700', note: 'Sharper, more character in the a, g and t.' },
  { family: 'Erode', css: 'erode@400,500,600', note: 'A warm serif. Editorial; big contrast with Panchang.' },
  { family: 'Gambetta', css: 'gambetta@400,500,600', note: 'A literary serif with sharp details. Feels crafted.' },
]

export function Lab() {
  useEffect(() => {
    document.title = 'Lab — hero and font previews'
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://api.fontshare.com/v2/css?${FONTS.map((f) => `f[]=${f.css}`).join('&')}&display=swap`
    document.head.appendChild(link)
    return () => link.remove()
  }, [])

  return (
    <main className="lab">
      <a className="case__back" {...linkProps('/')}>Back to the site</a>
      <h1 className="lab__title">Lab</h1>
      <p className="lab__lede">Live previews to choose from. Move your cursor over each one. Nothing here is on the real site yet.</p>

      <h2 className="lab__h2">Hero concepts</h2>
      <div className="lab__grid">
        {HEROES.map((h) => (
          <section key={h.key} className="lab__card">
            <div className="lab__stage">{h.demo}</div>
            <h3>{h.name}</h3>
            <p>{h.pitch}</p>
            <p className="lab__fit">{h.fit}</p>
          </section>
        ))}
      </div>

      <h2 className="lab__h2">Body fonts</h2>
      <p className="lab__lede">Each one is set with Panchang headings, exactly as the site uses them.</p>
      <div className="lab__fonts">
        {FONTS.map((f) => (
          <section key={f.family} className="lab__font" style={{ fontFamily: `'${f.family}', system-ui, sans-serif` }}>
            <p className="lab__fname">{f.family}</p>
            <p className="lab__fhead">Designs the interface. Then builds it.</p>
            <p className="lab__fbody">{site.intro}</p>
            <p className="lab__fsmall">{site.about[0]}</p>
            <p className="lab__fnote">{f.note}</p>
          </section>
        ))}
      </div>
    </main>
  )
}
