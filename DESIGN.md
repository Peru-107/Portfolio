# Design language

Decided with Perraz, 2 November 2026. This is the reference for every change to the site.

## The feeling

"This person is a craftsman." Quiet precision: every detail considered, nothing loud.

## Direction

- **Editorial leads.** Typography and space do the talking. The WebGL ink is the
  hero's opening statement only; product-sleek precision shapes the interactions;
  the typewriter and postcards carry the analog side.
- **Ink stays in the hero.** After it, the page is ink on paper: calm and typographic.
- **Phones get the same story,** driven by scroll and touch instead of hover and cursor.

## Type

- Panchang for statements, Supreme for reading, Courier Prime only for typed moments.
- Big jumps: section titles near poster size, body small and airy.

## Colour

- Paper `#e9ecef`, ink `#212529`.
- Magma is a rare signal: one key word per section, the live dot, the typewriter
  caret. As text on paper it is `#e35208` (passes contrast); on ink it stays `#ff6a1a`.
- Clean flat colour, no paper grain.
- One dark section: Contact, the closing chapter.

## Motion

- Crisp and quick: 0.3 to 0.6s, ease-out (`power3.out` / `expo.out`). Nothing lingers.
- Reveals, each played once as it scrolls into view:
  - headings rise from behind a mask
  - hairline rules draw across
  - numbers roll into place like a mechanical counter
  - images unveil with a clean edge
- No section labels or numbering; titles alone.
- Loader unchanged (Design / Build / Ship).

## Interaction

- Links: a hairline underline draws in from the left. Buttons invert ink and paper.
- Desktop: custom cursor and magnetic links.
- Phones: press feedback (a slight compress and spring back), haptic ticks
  (work card snaps, button presses, typewriter keys, opening an Experience row),
  and a work deck that snaps card to card under the thumb.

## Sections

- **Work:** the deal-and-slide deck stays as the centrepiece, with square cards
  and tall covers on phones.
- **Opening a project:** the card expands into the case-study page.
- **Case studies:** long-form editorial, with a big title, a short intro, then
  large images alternating with short text.
- **About:** one big statement inking in, then facts and skills.
- **Experience:** compact rows that expand to show the details.
- **Contact:** big, quiet and typographic on ink. The email is the hero of the
  section, and its letters ink in on hover or tap. Minimal links below.
