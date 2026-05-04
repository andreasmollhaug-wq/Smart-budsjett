/**
 * Stabiliserer `next build` på Windows (race / delvis .next / antivirus):
 * — strenge unhandled rejections (Next kan ellers avslutte med 0 ved PageNotFoundError)
 * — opptil 3 forsøk med slettet .next mellom hver feilet runde
 * Linux/Vercel: første forsøk lyktes nesten alltid.
 */
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const MAX_ATTEMPTS = 3

function build() {
  const env = { ...process.env }
  const extra = '--unhandled-rejections=strict'
  env.NODE_OPTIONS = env.NODE_OPTIONS ? `${env.NODE_OPTIONS} ${extra}` : extra

  execSync('next build', { stdio: 'inherit', cwd: root, env })
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    build()
    process.exit(0)
  } catch {
    if (attempt >= MAX_ATTEMPTS) {
      console.error(
        `\n[next build] Feilet etter ${MAX_ATTEMPTS} forsøk. Sjekk at ingen dev-server kjører, vurder å ekskludere prosjektmappa fra sanntidsskanning, eller bygg via WSL/CI.`,
      )
      process.exit(1)
    }
    console.error(
      `\n[next build] Forsøk ${attempt} feilet — sletter .next og prøver igjen (${attempt + 1}/${MAX_ATTEMPTS})…\n`,
    )
    try {
      execSync('node scripts/clean-next.mjs', { stdio: 'inherit', cwd: root })
    } catch {
      console.error(
        '\n[next build] Kunne ikke slette .next (låst av annen prosess?). Stopp `next dev` / IDE-preview og kjør `npm run clean:next`.\n',
      )
      process.exit(1)
    }
  }
}
