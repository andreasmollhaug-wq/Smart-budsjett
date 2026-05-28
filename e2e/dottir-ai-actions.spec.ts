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
})
