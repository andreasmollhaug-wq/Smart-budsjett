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

  test('Utvidet gjennomgang starter driver.js-popover på start (innlogget økt)', async ({ page }) => {
    await page.goto('/intern/mat-handleliste/start')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    const extBtn = page.getByRole('button', { name: 'Utvidet gjennomgang', exact: true })
    if ((await extBtn.count()) === 0) {
      test.skip()
    }
    await extBtn.click()
    await expect(page.locator('#driver-popover-content')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Utvidet gjennomgang/i).first()).toBeVisible()
    await expect(page.locator('.driver-overlay')).toBeVisible()
  })

  test('Vis meg rundt starter driver.js-popover på start (innlogget økt)', async ({ page }) => {
    await page.goto('/intern/mat-handleliste/start')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    const tourBtn = page.getByRole('button', { name: 'Vis meg rundt', exact: true })
    if ((await tourBtn.count()) === 0) {
      test.skip()
    }
    await tourBtn.click()
    await expect(page.locator('#driver-popover-content')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.driver-overlay')).toBeVisible()
  })

  test('måned: dag åpner plan-modal (innlogget økt)', async ({ page }) => {
    await page.goto('/intern/mat-handleliste/plan/maned')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    /** Første synlig dagsknapp med label som starter med YYYY-MM-DD (år). */
    const dayBtn = page.getByRole('button', { name: /^\d{4}-\d{2}-\d{2}: vis planlagte måltider/ }).first()
    if ((await dayBtn.count()) === 0) {
      test.skip()
    }
    await dayBtn.click()
    await expect(page.getByText('Dagens plan')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Lukk' })).toBeVisible()
  })
})
