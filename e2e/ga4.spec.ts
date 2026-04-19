import { existsSync, readFileSync } from 'fs'
import { test, expect } from '@playwright/test'

/** Unngår at hele e2e feiler når GA ikke er satt lokalt/CI. */
function hasGaConfigured(): boolean {
  if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.startsWith('G-')) return true
  for (const p of ['.env.local', '.env']) {
    if (!existsSync(p)) continue
    try {
      if (/NEXT_PUBLIC_GA_MEASUREMENT_ID\s*=\s*G-[\w-]+/.test(readFileSync(p, 'utf8'))) return true
    } catch {
      /* ignore */
    }
  }
  return false
}

test.describe('GA4', () => {
  test('laster googletagmanager gtag.js (krever NEXT_PUBLIC_GA_MEASUREMENT_ID i Next-bygget)', async ({
    page,
  }) => {
    test.skip(!hasGaConfigured(), 'Sett NEXT_PUBLIC_GA_MEASUREMENT_ID=G-… i .env.local eller miljø for å kjøre denne testen')
    const gtagPromise = page.waitForRequest(
      (req) => {
        const u = req.url()
        return u.includes('www.googletagmanager.com/gtag/js') && u.includes('id=')
      },
      { timeout: 30_000 }
    )

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const req = await gtagPromise
    expect(req.url()).toMatch(/googletagmanager\.com\/gtag\/js\?[^#]*id=G-/)
  })
})
