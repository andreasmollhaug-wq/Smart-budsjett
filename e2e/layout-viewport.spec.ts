import { test, expect } from '@playwright/test'

async function assertNoWideBodyScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(2)
}

async function assertGuideModalPanelFitsViewport(page: import('@playwright/test').Page) {
  const viewport = page.viewportSize()
  expect(viewport).not.toBeNull()
  const box = await page.getByTestId('guide-modal-panel').boundingBox()
  expect(box).not.toBeNull()
  if (!box || !viewport) return
  expect(box.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box.x).toBeGreaterThanOrEqual(-1)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 2)
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

  test('registrer har ikke horisontell body-overflow', async ({ page }) => {
    await page.goto('/registrer')
    await assertNoWideBodyScroll(page)
  })

  test('tofaktor-siden har ikke horisontell body-overflow', async ({ page }) => {
    await page.goto('/logg-inn/tofaktor')
    await assertNoWideBodyScroll(page)
  })

  test('how-to-modal på sikkerhet uten horisontell overflow', async ({ page }) => {
    await page.goto('/konto/sikkerhet')
    if (page.url().includes('/logg-inn')) {
      test.skip()
      return
    }
    await page.getByTestId('mfa-how-to-trigger').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await assertGuideModalPanelFitsViewport(page)
    await assertNoWideBodyScroll(page)
    await page.getByLabel('Lukk').click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.getByTestId('mfa-faq-trigger').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await assertNoWideBodyScroll(page)
  })

  test('snøball-guide uten horisontell overflow', async ({ page }) => {
    await page.goto('/snoball')
    if (page.url().includes('/logg-inn')) {
      test.skip()
      return
    }
    await assertNoWideBodyScroll(page)
    await page.getByTestId('snowball-guide-trigger').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await assertGuideModalPanelFitsViewport(page)
    await assertNoWideBodyScroll(page)
    await page.getByRole('tab', { name: 'Metoden' }).click()
    await assertNoWideBodyScroll(page)
    await assertGuideModalPanelFitsViewport(page)
    const panel = page.getByTestId('guide-modal-panel')
    await panel.evaluate((el) => {
      const scrollable = el.querySelector(':scope > div:last-child')
      if (scrollable instanceof HTMLElement) {
        scrollable.scrollTop = scrollable.scrollHeight
      }
    })
    await assertNoWideBodyScroll(page)
    await expect(page.getByLabel('Lukk')).toBeVisible()
  })

  test('abonnement-guide uten horisontell overflow', async ({ page }) => {
    await page.goto('/abonnementer')
    if (page.url().includes('/logg-inn')) {
      test.skip()
      return
    }
    await assertNoWideBodyScroll(page)
    const trigger = page.getByTestId('subscription-guide-trigger')
    if ((await trigger.count()) === 0) {
      test.skip()
      return
    }
    await trigger.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await assertGuideModalPanelFitsViewport(page)
    await assertNoWideBodyScroll(page)
    await page.getByRole('tab', { name: 'Budsjett' }).click()
    await assertNoWideBodyScroll(page)
  })
})

test.describe('Viewport (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('logg inn har ikke horisontell body-overflow', async ({ page }) => {
    await page.goto('/logg-inn')
    await assertNoWideBodyScroll(page)
  })

  test('tofaktor-siden har ikke horisontell body-overflow', async ({ page }) => {
    await page.goto('/logg-inn/tofaktor')
    await assertNoWideBodyScroll(page)
  })
})
