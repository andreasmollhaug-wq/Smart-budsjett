import { test, expect } from '@playwright/test'

async function assertNoWideBodyScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(2)
}

/** Hjemflyt + mat/handleliste: ingen horisontell body-scroll på smal viewport (demoinnlogging eller innloggingsside OK). */
const routes = [
  '/hjemflyt',
  '/hjemflyt/start',
  '/intern/mat-handleliste/start',
  '/intern/mat-handleliste/maltider',
  '/intern/mat-handleliste/plan',
  '/intern/mat-handleliste/plan/maned',
  '/intern/mat-handleliste/handleliste',
] as const

test.describe('Hjemflyt og mat-handleliste (mobil viewport)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  for (const path of routes) {
    test(`${path} laster uten horisontell body-overflow`, async ({ page }) => {
      await page.goto(path)
      await assertNoWideBodyScroll(page)
      await expect(page.locator('body')).toBeVisible()
    })
  }
})
