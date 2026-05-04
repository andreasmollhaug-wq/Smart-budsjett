/**
 * Sletter `.next` med gjentakelser — nødvendig på Windows når sanntids-antivirus eller
 * en hengende Node-prosess holder filer (ENOTEMPTY / EBUSY).
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, '.next')

for (let attempt = 1; attempt <= 12; attempt++) {
  try {
    await fs.rm(dir, { recursive: true, force: true })
    console.log('Removed .next')
    process.exit(0)
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    if (attempt === 12) {
      console.error(err.message)
      process.exit(1)
    }
    await new Promise((r) => setTimeout(r, 120 * attempt))
  }
}
