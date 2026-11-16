// Where the name sits inside a box, shared by everything that draws it (the
// ink's letter mask and the loading screen), so they line up to the pixel.
// The word is set once at a reference size and scaled, never re-typeset.

export type Box = { x: number; y: number; w: number; h: number }

const R = 200
export const FONT = `800 ${R}px Panchang, "Arial Black", sans-serif`

/** Put the context's transform where the word fills the box (in canvas pixels); draw at (0, 0) */
export function placeWord(ctx: CanvasRenderingContext2D, text: string, box: Box) {
  ctx.font = FONT
  ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(text)
  const gh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
  const k = Math.min(box.h / gh, box.w / m.width)
  const ox = box.x - k * m.actualBoundingBoxLeft
  const oy = box.y + (box.h - k * gh) / 2 + k * m.actualBoundingBoxAscent
  ctx.setTransform(k, 0, 0, k, ox, oy)
  return { k, left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, top: -m.actualBoundingBoxAscent, bottom: m.actualBoundingBoxDescent }
}
