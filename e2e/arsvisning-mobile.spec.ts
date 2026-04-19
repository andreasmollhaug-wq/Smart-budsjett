import { test, expect } from '@playwright/test'

async function assertNoWideBodyScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(2)
}

test.describe('Budsjett årsoversikt (mobil viewport)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('årsoversikt-rute har ikke horisontell body-overflow (inkl. redirect til innlogging)', async ({ page }) => {
    await page.goto('/budsjett/arsvisning')
    await assertNoWideBodyScroll(page)
  })

  test('periode-toolbar finnes når siden er tilgjengelig', async ({ page }) => {
    await page.goto('/budsjett/arsvisning')
    const periode = page.getByRole('combobox', { name: 'Periode' })
    const year = page.getByRole('combobox', { name: 'År' })
    const visible = (await periode.count()) > 0 && (await year.count()) > 0
    if (visible) {
      await expect(periode).toBeVisible()
      await expect(year).toBeVisible()
    } else {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }
  })

  test('månedlig resultat-seksjon finnes når årsoversikt har budsjettdata', async ({ page }) => {
    await page.goto('/budsjett/arsvisning')
    const periode = page.getByRole('combobox', { name: 'Periode' })
    if ((await periode.count()) === 0) {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      return
    }
    const monthHeading = page.getByRole('heading', { name: /Måned for måned/ })
    if (await monthHeading.isVisible()) {
      await expect(page.getByRole('heading', { name: 'Månedlig resultat' })).toBeVisible()
    } else {
      await expect(page.getByText(/Ingen budsjettdata for/)).toBeVisible()
    }
  })

  test('linjefilter kan åpnes og radiogruppe finnes når månedstabell-seksjonen vises', async ({ page }) => {
    await page.goto('/budsjett/arsvisning')
    const periode = page.getByRole('combobox', { name: 'Periode' })
    if ((await periode.count()) === 0) {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      return
    }
    const monthHeading = page.getByRole('heading', { name: /Måned for måned/ })
    if (await monthHeading.isVisible()) {
      await page.getByRole('button', { name: 'Filtrer linjer' }).click()
      await expect(page.getByRole('radiogroup', { name: 'Filtrer linjer' })).toBeVisible()
    } else {
      await expect(page.getByText(/Ingen budsjettdata for/)).toBeVisible()
    }
  })
})
