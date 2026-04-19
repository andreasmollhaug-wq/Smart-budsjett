import { test, expect } from '@playwright/test'

test.describe('Landing (mobil viewport)', () => {
  test('viser hovedoverskrift uten horisontell body-overflow', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main h1')).toContainText('Oversikt på økonomien', { timeout: 15_000 })

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

  test('mobilmeny åpner fullskjerms-overlay', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Åpne meny' }).click()
    const nav = page.locator('#landing-mobile-nav')
    await expect(nav).toBeVisible()
    const box = await nav.boundingBox()
    const vp = page.viewportSize()
    expect(box).not.toBeNull()
    expect(vp).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(vp!.height - 8)
  })
})
