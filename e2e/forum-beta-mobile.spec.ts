import { test, expect } from '@playwright/test'

async function assertNoWideBodyScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(2)
}

test.describe('Forum (beta) mobil', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('beskyttet rute sender anonym bruker til innlogging med next-param', async ({ page }) => {
    await page.goto('/intern/forum-beta')
    await expect(page).toHaveURL(/\/logg-inn/)
    const url = new URL(page.url())
    const nextRaw = url.searchParams.get('next')
    expect(nextRaw).toBeTruthy()
    expect(decodeURIComponent(nextRaw ?? '')).toContain('/intern/forum-beta')
    await assertNoWideBodyScroll(page)
  })

  test('forum-søk med query sender til innlogging og bevarer sti og spørring i next', async ({ page }) => {
    await page.goto('/intern/forum-beta/sok?q=test')
    await expect(page).toHaveURL(/\/logg-inn/)
    const url = new URL(page.url())
    const nextDecoded = decodeURIComponent(url.searchParams.get('next') ?? '')
    expect(nextDecoded).toContain('/intern/forum-beta/sok')
    expect(nextDecoded).toContain('q=test')
  })

  test('innlogget: forum-beta har tittel, søk og uten bred overflow (skip uten økt)', async ({ page }) => {
    await page.goto('/intern/forum-beta')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    await assertNoWideBodyScroll(page)
    await expect(page.getByRole('heading', { name: /Forum \(beta\)/ })).toBeVisible()
    await expect(page.getByRole('search', { name: 'Søk i forum' })).toBeVisible()
  })

  test('innlogget: tom søkeside viser veiledning (skip uten økt)', async ({ page }) => {
    await page.goto('/intern/forum-beta/sok')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    await assertNoWideBodyScroll(page)
    await expect(page.getByRole('heading', { name: /Søk i forum/i })).toBeVisible()
    await expect(page.getByText(/Skriv minst to tegn/)).toBeVisible()
  })
})
