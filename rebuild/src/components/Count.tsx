const DIGITS = [...'0123456789']

// Numbers that roll into place like a mechanical counter. Each digit is a reel
// of 0 to 9; when its section is revealed the reel turns to the right digit.
// An invisible copy of the final digit sizes each slot, so the finished number
// is spaced exactly like plain text. Screen readers get the plain text.
export function Count({ children }: { children: string }) {
  let n = 0
  return (
    <span className="count">
      <span className="sr-only">{children}</span>
      {[...children].map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="count__digit" aria-hidden="true" style={{ ['--d' as string]: ch, ['--i' as string]: n++ }}>
            <span className="count__size">{ch}</span>
            <span className="count__reel">
              {DIGITS.map((d) => <span key={d}>{d}</span>)}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden="true">{ch}</span>
        ),
      )}
    </span>
  )
}
