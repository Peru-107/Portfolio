// Link text whose letters roll up on hover, one after another, and come back
// in magma: each letter carries an orange copy of itself just below the line.
// Screen readers get the plain text.
export function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span className="sr-only">{children}</span>
      <span className="roll__chars" aria-hidden="true">
        {[...children].map((ch, i) => (
          <span key={i} className="roll__c" style={{ ['--i' as string]: i }}>
            {ch}
          </span>
        ))}
      </span>
    </span>
  )
}
