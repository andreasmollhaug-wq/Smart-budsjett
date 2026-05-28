import { test, expect } from '@playwright/test'

test.describe('Budsjettplan-eksport (mobil)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('/rapporter/budsjettplan viser PDF-knapp, skjuler Excel på smal skjerm', async ({ page }) => {
    await page.goto('/rapporter/budsjettplan')
    await expect(page.getByRole('button', { name: /Eksporter PDF/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Eksporter Excel/i })).toBeHidden()
  })
})
