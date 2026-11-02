import { useState } from 'react'
import { alsoBuilt, education, experience, recognition } from '../content'
import { tick } from '../lib/haptic'
import { Count } from './Count'
import { Roll } from './Roll'

// The CV, as a page section: where I’ve worked as compact rows that open for
// the detail, then what I study and the smaller projects
export function Experience() {
  // The latest role starts open, so the section never reads as empty
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="experience" className="xp" aria-labelledby="xp-title">
      <h2 id="xp-title" className="xp__title" data-reveal="rise"><span>Where I’ve <span className="accent">worked.</span></span></h2>
      <ol className="xp__jobs">
        {experience.map((j, i) => {
          const on = open === i
          return (
            <li key={j.org} className="xp__job" data-reveal="line" data-open={on ? '' : undefined}>
              <h3 className="xp__head">
                <button
                  type="button"
                  id={`xp-btn-${i}`}
                  className="xp__row"
                  aria-expanded={on}
                  aria-controls={`xp-${i}`}
                  onClick={() => {
                    tick()
                    setOpen(on ? null : i)
                  }}
                >
                  <span className="xp__when" data-reveal="count"><Count>{j.when}</Count></span>
                  <span className="xp__org"><Roll>{j.org}</Roll></span>
                  <span className="xp__role">{j.role}</span>
                  <span className="xp__plus" aria-hidden="true" />
                </button>
              </h3>
              <div id={`xp-${i}`} className="xp__body" role="region" aria-labelledby={`xp-btn-${i}`}>
                <div>
                  <ul>
                    {j.points.map((pt) => <li key={pt}>{pt}</li>)}
                  </ul>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="xp__cols" data-reveal="line">
        <div data-reveal="fade">
          <h3 className="xp__sub"><span className="mark" data-reveal="mark">Education</span></h3>
          {education.map((e) => (
            <div key={e.what} className="xp__edu">
              <p className="xp__strong">{e.what}</p>
              <p>{e.where}, {e.when}</p>
            </div>
          ))}
          <h3 className="xp__sub"><span className="mark" data-reveal="mark">Recognition</span></h3>
          <ul className="xp__list">
            {recognition.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
        <div data-reveal="fade">
          <h3 className="xp__sub"><span className="mark" data-reveal="mark">Also built</span></h3>
          <ul className="xp__also">
            {alsoBuilt.map((a) => (
              <li key={a.title}>
                <p className="xp__strong">{a.title}</p>
                <p>{a.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
