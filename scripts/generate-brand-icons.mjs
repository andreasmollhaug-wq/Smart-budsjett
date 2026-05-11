/**
 * Genererer PWA- og Apple-ikoner fra favicon-motiv (skilt fra full logo i UI).
 * Kilde: `public/marketing/Favcon v02 _ BG.svg`
 * Kjør: node scripts/generate-brand-icons.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const srcPath = join(root, 'public', 'marketing', 'Favcon v02 _ BG.svg')
/** Matcher manifest / merke-SVG bakgrunn der favicon-SVG har transparent kant. */
const bg = '#fcf9f2'

const iconBuf = readFileSync(srcPath)

async function squareContain(size, innerMax) {
  const inner = await sharp(iconBuf, { density: 300 })
    .resize(innerMax, innerMax, { fit: 'inside', withoutEnlargement: true })
    .toBuffer()
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: inner, gravity: 'center' }])
    .png()
    .toBuffer()
}

const icon192 = await squareContain(192, 152)
const icon512 = await squareContain(512, 320)
const apple180 = await squareContain(180, 132)

writeFileSync(join(root, 'public', 'pwa-icon-192.png'), icon192)
writeFileSync(join(root, 'public', 'pwa-icon-512.png'), icon512)
writeFileSync(join(root, 'src', 'app', 'apple-icon.png'), apple180)

console.log('Wrote pwa-icon-192.png, pwa-icon-512.png, src/app/apple-icon.png (from Favcon v02 _ BG.svg)')
