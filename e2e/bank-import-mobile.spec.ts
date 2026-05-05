import path from 'path'
import { test, expect } from '@playwright/test'

test.describe('Bankimport DNB (mobil)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('DNB-modus: opplasting viser kartlegging', async ({ page }) => {
    await page.route('**/api/bank-import-suggest', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ suggestions: [] }),
      })
    })

    await page.goto('/konto/importer-transaksjoner')
    if (page.url().includes('logg-inn')) {
      test.skip()
    }

    await page.locator('#import-transaksjon-kilde').selectOption('bank_dnb')

    const fixturePath = path.join(__dirname, 'fixtures', 'dnb-minimal.xlsx')
    await page.getByRole('button', { name: 'Velg fil' }).click()
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(fixturePath)

    await expect(page.getByText('E2E Testkjøp')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/kartlegg hver forklaring/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Foreslå kategorier med KI/i })).toBeVisible()

    const overflow = await page.evaluate(() => {
      const el = document.documentElement
      return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(2)
  })
})
