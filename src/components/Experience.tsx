import { alsoBuilt, education, experience, recognition } from '../content'

// The CV, as a page section: where I’ve worked, what I study, and the
// smaller projects that didn’t need a case study
export function Experience() {
  return (
    <section id="experience" className="xp" aria-labelledby="xp-title">
      <h2 id="xp-title" className="xp__title">Where I’ve <span className="accent">worked.</span></h2>
      <ol className="xp__jobs">
        {experience.map((j) => (
          <li key={j.org} className="xp__job">
            <p className="xp__when">{j.when}</p>
            <div>
              <h3>{j.org}</h3>
              <p className="xp__role">{j.role}</p>
              <ul>
                {j.points.map((pt) => <li key={pt}>{pt}</li>)}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      <div className="xp__cols">
        <div>
          <h3 className="xp__sub">Education</h3>
          {education.map((e) => (
            <div key={e.what} className="xp__edu">
              <p className="xp__strong">{e.what}</p>
              <p>{e.where}, {e.when}</p>
            </div>
          ))}
          <h3 className="xp__sub">Recognition</h3>
          <ul className="xp__list">
            {recognition.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="xp__sub">Also built</h3>
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
