import { test, expect } from '@playwright/test'

test.describe('Mat og handleliste (mobil)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('handleliste-ruten laster uten horisontell body-overflow', async ({ page }) => {
    await page.goto('/intern/mat-handleliste/handleliste')
    const overflow = await page.evaluate(() => {
      const el = document.documentElement
      return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(2)
    await expect(page.locator('body')).toBeVisible()
  })

  test('måned-ruten laster uten horisontell body-overflow', async ({ page }) => {
    await page.goto('/intern/mat-handleliste/plan/maned')
    const overflow = await page.evaluate(() => {
      const el = document.documentElement
      return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(2)
    await expect(page.locator('body')).toBeVisible()
  })
})
