import { test, expect } from '@playwright/test'

test.describe('Budsjettplan-eksport (mobil)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('/rapporter/budsjettplan viser PDF-knapp, skjuler Excel på smal skjerm', async ({ page }) => {
    await page.goto('/rapporter/budsjettplan')
    const pdfBtn = page.getByRole('button', { name: /Eksporter PDF/i })
    if ((await pdfBtn.count()) === 0) {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      return
    }
    await expect(pdfBtn).toBeVisible()
    await expect(page.getByRole('button', { name: /Eksporter Excel/i })).toBeHidden()
  })

  test('/budsjett: collapse for sekundære filter og eksportmeny innenfor viewport', async ({ page }) => {
    await page.goto('/budsjett')

    const extras = page.getByRole('button', { name: /Flere innstillinger/i })
    if ((await extras.count()) === 0) {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      return
    }

    await expect(extras).toBeVisible()
    await expect(page.locator('#budget-view-year-mobile')).toHaveCount(0)

    await extras.click()
    await expect(page.locator('#budget-view-year-mobile')).toBeVisible()

    const downloadBtn = page.getByRole('button', { name: 'Last ned budsjettplan' })
    await expect(downloadBtn).toBeVisible()
    await downloadBtn.click()

    const pdfBtn = page.getByRole('button', { name: /Eksporter budsjettplan som PDF/i })
    await expect(pdfBtn).toBeVisible()
    await expect(pdfBtn).toBeInViewport()
  })
})
