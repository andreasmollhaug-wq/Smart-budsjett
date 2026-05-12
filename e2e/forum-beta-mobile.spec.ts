import { test, expect } from '@playwright/test'

async function assertNoWideBodyScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(2)
}

test.describe('Forum mobil (meny + beskyttede ruter)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('beskyttet rute sender anonym bruker til innlogging med next-param', async ({ page }) => {
    await page.goto('/forum')
    await expect(page).toHaveURL(/\/logg-inn/)
    const url = new URL(page.url())
    const nextRaw = url.searchParams.get('next')
    expect(nextRaw).toBeTruthy()
    expect(decodeURIComponent(nextRaw ?? '')).toContain('/forum')
    await assertNoWideBodyScroll(page)
  })

  test('forum-søk med query sender til innlogging og bevarer sti og spørring i next', async ({ page }) => {
    await page.goto('/forum/sok?q=test')
    await expect(page).toHaveURL(/\/logg-inn/)
    const url = new URL(page.url())
    const nextDecoded = decodeURIComponent(url.searchParams.get('next') ?? '')
    expect(nextDecoded).toContain('/forum/sok')
    expect(nextDecoded).toContain('q=test')
  })

  test('forum-tråd sender anonym bruker til innlogging med next til tråd-sti', async ({ page }) => {
    await page.goto('/forum/trad/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    await expect(page).toHaveURL(/\/logg-inn/)
    const url = new URL(page.url())
    const nextDecoded = decodeURIComponent(url.searchParams.get('next') ?? '')
    expect(nextDecoded).toContain('/forum/trad/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
  })

  test('innlogget: forum har tittel, søk og uten bred overflow (skip uten økt)', async ({ page }) => {
    await page.goto('/forum')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    await assertNoWideBodyScroll(page)
    await expect(page.getByRole('heading', { name: /^Forum$/ })).toBeVisible()
    await expect(page.getByRole('search', { name: 'Søk i forum' })).toBeVisible()
  })

  test('innlogget: forum forsidesidebar har statistikk, populære emner og nyeste medlemmer (skip uten økt)', async ({
    page,
  }) => {
    await page.goto('/forum')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    await assertNoWideBodyScroll(page)
    await expect(page.getByRole('heading', { name: 'Forumstatistikk', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Populære emner', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Nyeste medlemmer', level: 2 })).toBeVisible()
  })

  test('innlogget: tom søkeside viser veiledning (skip uten økt)', async ({ page }) => {
    await page.goto('/forum/sok')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    await assertNoWideBodyScroll(page)
    await expect(page.getByRole('heading', { name: /Søk i forum/i })).toBeVisible()
    await expect(page.getByText(/Skriv minst to tegn/)).toBeVisible()
  })

  test('innlogget: kategoriside har sortering og visning=lest i URL (skip uten økt)', async ({ page }) => {
    await page.goto('/forum/kategori/generelt')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    await assertNoWideBodyScroll(page)
    const sortSelect = page.getByLabel('Sorter tråder i kategorien')
    await expect(sortSelect).toBeVisible()
    await sortSelect.selectOption('views')
    await expect(page).toHaveURL(/visning=lest/)
    await expect(sortSelect).toHaveValue('views')
  })

  test('innlogget: forumprofil viser offentlig navn og bidragsnivå (skip uten økt)', async ({ page }) => {
    await page.goto('/forum/profil')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    await assertNoWideBodyScroll(page)
    await expect(page.getByRole('heading', { name: /^Forumprofil$/ })).toBeVisible()
    await expect(page.getByText(/Slik vises du i forumet/)).toBeVisible()
    await expect(page.getByText(/Bidragsnivå/i)).toBeVisible()
    await expect(page.getByLabel(/Visningsnavn/)).toBeVisible()
  })

  test('legacy /intern/forum-beta svarer med redirect til /forum', async ({ request }) => {
    const res = await request.get('/intern/forum-beta', { maxRedirects: 0 })
    expect([301, 302, 307, 308]).toContain(res.status())
    const loc = res.headers()['location'] ?? ''
    const path = /^https?:\/\//i.test(loc) ? new URL(loc).pathname : loc
    expect(path).toBe('/forum')
  })
})
