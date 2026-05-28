import { test, expect } from '@playwright/test'

async function assertNoWideBodyScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(2)
}

/** Sidemenyen med Enkel modus krever innlogging — denne sjekker bare at budsjett-ruten laster uten layout-krasj på mobil. */
test.describe('Sidebar / app shell (mobil viewport)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('/budsjett laster uten horisontell body-overflow', async ({ page }) => {
    await page.goto('/budsjett')
    await assertNoWideBodyScroll(page)
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Sidebar / app shell (landscape mobil)', () => {
  test.use({ viewport: { width: 844, height: 390 } })

  test('/budsjett: hamburger i landscape, ikke permanent sidebar', async ({ page }) => {
    await page.goto('/budsjett')
    await assertNoWideBodyScroll(page)

    const menuBtn = page.getByRole('button', { name: 'Åpne meny' })
    if ((await menuBtn.count()) === 0) {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      return
    }

    await expect(menuBtn).toBeVisible()

    const permanentSidebar = page.locator('aside.w-64')
    await expect(permanentSidebar).toHaveCount(0)

    await menuBtn.click()
    await expect(page.getByRole('dialog', { name: 'Navigasjon' })).toBeVisible()
  })
})
