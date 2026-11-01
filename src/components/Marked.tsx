// Text where ==a phrase== is a fact worth stopping on: it gets a magma
// highlighter mark, swept in from the left when it scrolls into view
export function Marked({ children }: { children: string }) {
  return (
    <>
      {children.split(/==(.+?)==/).map((part, i) =>
        i % 2 ? (
          <mark key={i} className="mark" data-reveal="mark">{part}</mark>
        ) : (
          part
        ),
      )}
    </>
  )
}
