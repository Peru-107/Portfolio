import { useState } from 'react'
import { alsoBuilt, education, experience, recognition } from '../content'
import { tick } from '../lib/haptic'

export function Experience() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="experience" className="experience" aria-labelledby="exp-title">
      <header className="experience__head">
        <p className="experience__cue" data-reveal="fade">
          路 · Path
        </p>
        <h2 id="exp-title" className="experience__title" data-reveal="rise">
          <span>Where I’ve practised.</span>
        </h2>
      </header>

      <ul className="experience__list">
        {experience.map((row, i) => {
          const on = open === i
          return (
            <li key={row.org} className="experience__row" data-reveal="line" data-open={on ? '' : undefined}>
              <button
                type="button"
                className="experience__toggle"
                aria-expanded={on}
                onClick={() => {
                  tick()
                  setOpen(on ? null : i)
                }}
              >
                <span className="experience__org">{row.org}</span>
                <span className="experience__role">{row.role}</span>
                <span className="experience__when">{row.when}</span>
              </button>
              {on && (
                <ul className="experience__points">
                  {row.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      <div className="experience__extra" data-reveal="fade">
        <div>
          <h3>Education</h3>
          {education.map((e) => (
            <p key={e.what}>
              <strong>{e.what}</strong>
              <br />
              {e.where} · {e.when}
            </p>
          ))}
        </div>
        <div>
          <h3>Also built</h3>
          <ul>
            {alsoBuilt.map((a) => (
              <li key={a.title}>
                <strong>{a.title}</strong> — {a.body}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Recognition</h3>
          <ul>
            {recognition.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
