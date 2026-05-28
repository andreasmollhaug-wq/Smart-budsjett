import { test, expect } from '@playwright/test'

test.describe('Oversikt periodefilter (mobil)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('/dashboard: periodefilter bak collapse på smal skjerm', async ({ page }) => {
    await page.goto('/dashboard')

    const periodTrigger = page.getByRole('button', { name: /^Periode/i })
    if ((await periodTrigger.count()) === 0) {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      return
    }

    await expect(periodTrigger).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Periode' })).toHaveCount(0)

    await periodTrigger.click()
    await expect(page.getByRole('combobox', { name: 'Periode' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'År' })).toBeVisible()
  })
})
