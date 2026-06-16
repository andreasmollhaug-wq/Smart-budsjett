import { test, expect } from '@playwright/test'

test.describe('Landing (mobil viewport)', () => {
  test('viser hovedoverskrift uten horisontell body-overflow', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main h1')).toContainText(/Få kontroll på økonomien/i, { timeout: 15_000 })

    const overflow = await page.evaluate(() => {
      const el = document.documentElement
      return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(2)
  })

  test('primær CTA er synlig (hero)', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /Kom i gang/i })
    await expect(cta.first()).toBeVisible()
  })

  test('Logg inn er synlig i header uten å åpne meny', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const headerNav = page.getByRole('navigation', { name: 'Hovedmeny' })
    await expect(headerNav.getByRole('link', { name: 'Logg inn' })).toBeVisible()
  })

  test('mobilmeny åpner fullskjerms-overlay', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Åpne meny' }).click()
    const nav = page.locator('#dottir-landing-nav')
    await expect(nav).toBeVisible()
    const box = await nav.boundingBox()
    const vp = page.viewportSize()
    expect(box).not.toBeNull()
    expect(vp).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(vp!.height - 8)
  })

  test('prisseksjon viser planer og priser', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const pricing = page.locator('#priser')
    await pricing.scrollIntoViewIfNeeded()
    await expect(pricing.getByRole('heading', { name: 'Priser' })).toBeVisible()
    await expect(pricing).toContainText('89 kr')
    await expect(pricing).toContainText('139 kr')
  })

  test('mobilmeny Priser scroller til prisseksjon', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Åpne meny' }).click()
    await page.locator('#dottir-landing-nav').getByRole('link', { name: 'Priser' }).click()
    await expect(page.locator('#dottir-landing-nav')).toBeHidden()
    const pricing = page.locator('#priser')
    await expect(pricing.getByRole('heading', { name: 'Priser' })).toBeInViewport()
  })

  test('mobilmeny ligger over landingssideinnhold', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Åpne meny' }).click()
    const nav = page.locator('#dottir-landing-nav')
    await expect(nav).toBeVisible()
    const topElement = await page.evaluate(() => {
      const navEl = document.getElementById('dottir-landing-nav')
      if (!navEl) return null
      const rect = navEl.getBoundingClientRect()
      const x = rect.left + Math.min(48, rect.width / 2)
      const y = rect.top + Math.min(48, rect.height / 2)
      const el = document.elementFromPoint(x, y)
      return el?.closest('#dottir-landing-nav') ? 'nav' : el?.tagName ?? null
    })
    expect(topElement).toBe('nav')
  })
})
