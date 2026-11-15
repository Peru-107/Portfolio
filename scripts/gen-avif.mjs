#!/usr/bin/env node
/** Convert public/media/*.webp → sibling .avif (quality ~50). Skips existing. */
import { readdirSync, existsSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import sharp from 'sharp'

const dir = join(process.cwd(), 'public', 'media')
const files = readdirSync(dir).filter((f) => extname(f) === '.webp')
let n = 0
for (const f of files) {
  const out = join(dir, `${basename(f, '.webp')}.avif`)
  if (existsSync(out)) continue
  await sharp(join(dir, f)).avif({ quality: 48, effort: 4 }).toFile(out)
  n++
  if (n % 10 === 0) console.log(`avif ${n}…`)
}
console.log(`AVIF done (+${n} new, ${files.length} webp sources)`)
