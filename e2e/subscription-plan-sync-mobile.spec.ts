import { test, expect } from '@playwright/test'

test.describe('Abonnement og familie (mobil)', () => {
  test('FAQ beskriver profiler under samme innlogging, ikke invitasjon', async ({ page }) => {
    await page.goto('/#faq')
    const faq = page.locator('#faq')
    await expect(faq).toContainText(/profiler under samme innlogging/i, { timeout: 15_000 })
    await expect(faq).not.toContainText(/invitere opptil fem brukere/i)
  })
})
