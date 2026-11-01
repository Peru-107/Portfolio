// A tiny vibration under the thumb on phones that support it (Android; iPhones
// ignore it). Never on mouse devices, never for reduced motion, and only once
// the visitor has touched the page (browsers refuse it before that).
const able = typeof navigator !== 'undefined' && 'vibrate' in navigator && matchMedia('(pointer: coarse)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches

export function tick(ms = 8) {
  if (able && (navigator.userActivation?.hasBeenActive ?? true)) navigator.vibrate(ms)
}
