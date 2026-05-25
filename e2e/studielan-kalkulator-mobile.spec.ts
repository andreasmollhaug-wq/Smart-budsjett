import { test, expect } from '@playwright/test'

async function assertNoWideBodyScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(2)
}

test.describe('Studielånskalkulator (mobil viewport)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('/gjeld/studielan-kalkulator laster med nøkkeltall og eksport', async ({ page }) => {
    await page.goto('/gjeld/studielan-kalkulator')
    if (page.url().includes('logg-inn')) {
      test.skip()
    }

    await assertNoWideBodyScroll(page)
    await expect(page.getByRole('heading', { name: 'Studielånskalkulator' })).toBeVisible()
    await expect(page.getByText('Månedlig betaling')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Eksporter PDF' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Eksporter Excel' })).toBeVisible()
    await expect(page.getByText('Hva sparer du ved å betale raskere?')).toBeVisible()
  })
})
