import { test, expect } from '@playwright/test'

async function assertNoWideBodyScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(2)
}

test.describe('Viewport (mobil)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('landing har ikke horisontell body-overflow', async ({ page }) => {
    await page.goto('/')
    await assertNoWideBodyScroll(page)
  })

  test('logg inn har ikke horisontell body-overflow', async ({ page }) => {
    await page.goto('/logg-inn')
    await assertNoWideBodyScroll(page)
  })
})
