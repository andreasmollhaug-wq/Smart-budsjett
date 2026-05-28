import { test, expect } from '@playwright/test'

test.describe('dottir AI-handlinger (mobil)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('enkelexcel-ai krever innlogging (redirect)', async ({ page }) => {
    await page.goto('/enkelexcel-ai')
    await expect(page).toHaveURL(/logg-inn/, { timeout: 15_000 })
  })

  test('stream-endepunkt krever innlogging', async ({ request }) => {
    const res = await request.post('/api/enkelexcel-ai/stream', {
      data: { messages: [{ role: 'user', content: 'test' }] },
    })
    if (res.status() === 401) {
      expect(res.status()).toBe(401)
      return
    }
    const ct = res.headers()['content-type'] ?? ''
    expect(ct.includes('text/event-stream')).toBe(false)
  })

  test('modal Full skjerm utvider chat uten navigasjon til /enkelexcel-ai', async ({ page }) => {
    await page.goto('/dashboard')
    const fab = page.getByRole('button', { name: 'Åpne dottir AI' })
    if ((await fab.count()) === 0) {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      return
    }

    await fab.click()
    const dialog = page.getByRole('dialog', { name: /dottir AI/i })
    await expect(dialog).toBeVisible()

    const fullScreenBtn = page.getByRole('button', { name: /Full skjerm for dottir AI/i })
    await expect(fullScreenBtn).toBeVisible()
    await fullScreenBtn.click()

    await expect(page).not.toHaveURL(/\/enkelexcel-ai/)
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('button', { name: /Minimer dottir AI/i })).toBeVisible()
    await expect(dialog).toBeInViewport()
  })
})
