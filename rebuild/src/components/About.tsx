import { site } from '../content'

export function About() {
  const statement = site.about.join(' ')
  const words = statement.split(/\s+/)

  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <p className="about__cue" data-reveal="fade">
        私 · About
      </p>
      <h2 id="about-title" className="sr-only">
        About
      </h2>
      <p className="about__statement" data-reveal="fade">
        {words.map((w, i) => (
          <span key={`${w}-${i}`} className="about__word" style={{ ['--i' as string]: i }}>
            {w}{' '}
          </span>
        ))}
      </p>

      <dl className="about__facts" data-reveal="line">
        {site.facts.map((f) => (
          <div key={f.k} className="about__fact">
            <dt>{f.k}</dt>
            <dd>{f.v}</dd>
          </div>
        ))}
      </dl>

      <div className="about__tools" data-reveal="fade">
        {site.tools.map((g) => (
          <div key={g.group} className="about__tool">
            <h3>{g.group}</h3>
            <ul>
              {g.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
