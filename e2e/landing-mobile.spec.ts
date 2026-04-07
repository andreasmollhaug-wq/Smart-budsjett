import { test, expect } from '@playwright/test'

test.describe('Landing (mobil viewport)', () => {
  test('viser hovedoverskrift uten horisontell body-overflow', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /Oversikt på økonomien/ })).toBeVisible()

    const overflow = await page.evaluate(() => {
      const el = document.documentElement
      return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(2)
  })

  test('primær CTA i header er synlig', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /Start gratis/ })
    await expect(cta.first()).toBeVisible()
  })
})
