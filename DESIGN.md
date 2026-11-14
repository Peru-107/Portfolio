# Design language

Decided with Perraz, 2 November 2026; brought up to date with the code on 14 November 2026
(branch `grok-revamp`). This is the reference for every change to the site.

## The feeling

"This person is a craftsman." Quiet precision: every detail considered, nothing loud.

## Direction

- **Editorial leads.** Typography and space do the talking. The WebGL ink is the
  hero's opening statement; product-sleek precision shapes the interactions;
  the typewriter, postcards and the ink pad carry the analog side.
- **Ink stays in the hero** (and returns once, as the ink pad at the foot of Contact).
  Between them the page is ink on paper: calm and typographic.
- **Phones get the same story,** driven by scroll and touch instead of hover and cursor.
- **First person** in all copy ("I design…", "How I decided").

## Type

- Panchang for statements, Supreme for reading and interface, Courier Prime only for
  typed moments (the typewriter, dev-only TODO notes).
- Big jumps: section titles near poster size, body small and airy.

## Colour

- Paper `#e9ecef` (paper-2 `#dee2e6`), ink `#212529` (ink-2 `#343a40`, ink-soft `#495057`).
- Magma `#f6440e` is a rare signal: one key word per section, the live dot, the typewriter
  caret, the active side-index line, the progress line. As text on paper it is
  `--magma-text: #e23d0b`; on ink it stays `#f6440e`. Ember `#ffb238` and deep `#b3261e`
  appear only inside the ink and the ink pad's strokes.
- Clean flat colour, no paper grain.
- One dark section: Contact, the closing chapter. (Small ink-filled cards are allowed:
  the Aegis folder and the "After" card in a case study's Before and after.)

## Motion

- Crisp and quick: 0.3 to 0.6s, ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`, `power3.out` /
  `expo.out`). Nothing lingers.
- Reveals, each played once as it scrolls into view:
  - headings rise from behind a mask
  - hairline rules draw across
  - numbers roll into place like a mechanical counter
  - images unveil with a clean edge
  - small headings get the highlighter
- No section labels or numbering; titles alone.
- Loader, about two seconds, once per visit: a sheet of ink with the name in paper exactly
  where the live ink will draw it. The name comes out of a blur, a 000–100 counter runs and a
  thin magma line fills along the bottom; then the sheet folds down into that line and the
  live ink underneath is already showing the name, ready to flow.
- Reduced motion: no loader, no pins (Work is a plain list), no reveals, and the ink is a
  single settled frame.

## The ink

- The hero name is live WebGL2 ink with molten "lava" veins whose size stays constant
  against the letters on phone and desktop. The pointer's path twists the letters like
  liquid glass (cursor warp); drag to pour ink.
- It is a guest on the visitor's machine: it simulates only while on screen, pauses after
  45 seconds without input (any pointer, key, scroll or wheel wakes it), and on a software
  GPU or after sustained long frames it settles into a still frame that still follows the
  scroll glide. Without WebGL2 it falls back to a Panchang "P".
- Smoothness rules: the ink steps on GSAP's ticker (one clock, after Lenis has scrolled and
  ScrollTrigger has placed the word), its canvas has an alpha channel over paper so an undrawn
  frame is never black, pixel ratio is capped at 1.5, and a card's film is shown only once it
  has a real frame (its still sits underneath until then).

## Interaction

- Links: the letter roll. Each letter rises in turn and reveals an orange copy of itself; no
  underline, no colour inversion. Touch devices keep a thin orange underline on tappable links.
  Buttons invert ink and paper.
- Square corners everywhere: cards, buttons, fields, focus rings, tags. Only device frames
  (phone, TV) keep hardware rounding.
- Highlighter: small headings carry a solid magma mark swept in from the left.
- Header: a focus lens (hovering the menu sharpens the nearest link, softens the others, and one
  square lens glides between them). It hides while reading down and returns on scroll up. A thin
  progress line runs along it, and a square back-to-top button appears far down the page.
- Command menu: Ctrl/⌘ + K from anywhere ("Where to?"); every page, project and contact route
- Sound: three very quiet clicks made in Web Audio (no files): a soft key for buttons and links, a deeper clack for opening a project or case page, a light tick for toggles and the header/side-index hovers. On by default; the speaker key after Ctrl K in the header (and "Turn click sounds on or off" in the command menu) mutes them, remembered in localStorage (`pb-muted`). Nothing is created until the first click or key
  is one line away. On touch and narrow screens a square search key in the header opens it.
  "Copied" is announced only when the clipboard really took the email.
- Side index (wide screens, home only): thin lines down the left edge, one per section; the
  current one draws long in magma; pointing at it shows the names.
- Page changes: a sheet of ink (not magma); opening a project grows its card into the page.
- Desktop: custom cursor and magnetic links.
- Phones: press feedback (a slight compress and spring back), haptic ticks
  (work card snaps, button presses, typewriter keys, opening an Experience row),
  and a work deck that snaps card to card under the thumb.
- The hero hint ("Write something, or scroll.") fades in after 3.5 seconds if nobody has
  found the typewriter; on phones the "Write something" button does instead.

## Sections

- **Work:** "Things I've built." with one lead line beside it on wide screens
  ("Five products. Designed, coded and shipped by one person."). The deal-and-slide deck is the
  centrepiece: square cards that resolve from halftone dots into their picture and rise a little
  to meet the pointer; tall 4:5 covers on phones. Cards still in the stack are inert until dealt
  (keyboard focus on the front card deals the deck). The fifth card, Aegis, is a sealed folder:
  the front lifts and a redacted page shows, but it never opens.
- **Opening a project:** the card expands into the case-study page.
- **Case studies:** a design story, not a spec sheet. Big title and facts; the cover waits
  small between two flank words, then zooms to fill the screen with scroll; a rail beside the
  text lists the parts. Parts, in order: The problem, What it does, How I decided (numbered
  decisions, with a supporting screen), Before and after (two cards, the After in ink; hidden
  until both sides are known), Built with (square tags), Where it stands (result and outcomes).
  A depth carousel shows the screens (drag, swipe, arrows or keys; always settles on one).
  "Next project" ends the page, and on desktop the next cover follows the pointer, above it so
  the name stays readable.
- **About:** one big statement inking in word by word with scroll; every word is readable
  before it inks (never fainter than 0.52, key words 0.85), then facts and skills.
- **Experience:** compact rows that expand to show the details.
- **Contact:** big, quiet and typographic on ink. The email is the hero of the
  section, and its letters ink in on hover or tap. Minimal links below. At the foot, the ink
  pad: "Let's build." Tap it on, then press and drag to draw; strokes go down yellow, warm
  through ember to magma and fade; the things I've made sit on top and shy away from the pointer.
- **Not here:** any address that isn't a page gets a plain "Not here" page with a link back
  to the work (a real 404, marked noindex).

## Rules for facts

Case-study copy uses only facts Perraz has stated. Anything not yet known is written as a
`TODO('question')` in `src/content.ts`: it shows as a "TODO for Perraz" note in development
and is never rendered in production.
