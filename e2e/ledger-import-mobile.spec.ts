import { test, expect } from '@playwright/test'

test.describe('Import fra regnskap (mobil)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('ruten laster uten horisontell body-overflow', async ({ page }) => {
    await page.goto('/konto/importer-fra-regnskap')
    const overflow = await page.evaluate(() => {
      const el = document.documentElement
      return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(2)
    await expect(page.locator('body')).toBeVisible()
  })
})
