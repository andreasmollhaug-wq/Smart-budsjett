import { test, expect } from '@playwright/test'

async function assertNoWideBodyScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(2)
}

test.describe('Abonnementer (mobil viewport)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('abonnementer-rute har ikke horisontell body-overflow (inkl. redirect til innlogging)', async ({
    page,
  }) => {
    await page.goto('/abonnementer')
    await assertNoWideBodyScroll(page)
  })
})
