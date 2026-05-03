import { test, expect } from '@playwright/test'

test.describe('SmartVane (mobil)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('måned og innsikt uten query redirectes til kanonisk y/m (innlogget)', async ({ page }) => {
    await page.goto('/smartvane/maned')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    await expect(page).toHaveURL(/\/smartvane\/maned\?y=\d{4}&m=\d{1,2}/)

    await page.goto('/smartvane/insikt')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    await expect(page).toHaveURL(/\/smartvane\/insikt\?y=\d{4}&m=\d{1,2}/)
  })

  test('SmartVane-ruter laster uten horisontell body-overflow', async ({ page }) => {
    for (const path of ['/smartvane/i-dag', '/smartvane/maned', '/smartvane/insikt', '/smartvane/start-her']) {
      await page.goto(path)
      const overflow = await page.evaluate(() => {
        const el = document.documentElement
        return el.scrollWidth - el.clientWidth
      })
      expect(overflow).toBeLessThanOrEqual(2)
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('underfaner SmartVane (innlogget)', async ({ page }) => {
    await page.goto('/smartvane/i-dag')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    await expect(page.getByRole('navigation', { name: 'SmartVane' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'I dag', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Måned', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Innsikt', exact: true })).toBeVisible()
  })

  test('Fra bibliotek legger til forslagsrutine (innlogget)', async ({ page }) => {
    await page.goto('/smartvane/i-dag')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    const libBtn = page.getByRole('button', { name: 'Fra bibliotek …' })
    if ((await libBtn.count()) === 0) {
      test.skip()
    }
    await libBtn.click()
    const dialog = page.getByRole('dialog', { name: 'Rutinebibliotek' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: /vaske badet/i }).first().click()
    await dialog.getByRole('button', { name: 'Legg til valgte' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 12_000 })
  })

  test('Legg til vane åpner skjema (innlogget)', async ({ page }) => {
    await page.goto('/smartvane/i-dag')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    const addBtn = page.getByRole('button', { name: 'Legg til vane', exact: true })
    if ((await addBtn.count()) === 0) {
      test.skip()
    }
    await addBtn.click()
    await expect(page.getByRole('button', { name: 'Lagre', exact: true })).toBeVisible()
    await expect(page.getByPlaceholder(/f\.eks\. 20/)).toBeVisible()
  })

  test('Utvidet gjennomgang starter driver.js-popover på start-her (innlogget)', async ({ page }) => {
    await page.goto('/smartvane/start-her')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    const extBtn = page.getByRole('button', { name: 'Utvidet gjennomgang', exact: true })
    if ((await extBtn.count()) === 0) {
      test.skip()
    }
    await extBtn.click()
    await expect(page.locator('#driver-popover-content')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Utvidet gjennomgang/i).first()).toBeVisible()
    await expect(page.locator('.driver-overlay')).toBeVisible()
  })

  test('Vis meg rundt starter driver.js-popover på start-her (innlogget)', async ({ page }) => {
    await page.goto('/smartvane/start-her')
    if (page.url().includes('/logg-inn')) {
      test.skip()
    }
    const tourBtn = page.getByRole('button', { name: 'Vis meg rundt', exact: true })
    if ((await tourBtn.count()) === 0) {
      test.skip()
    }
    await tourBtn.click()
    await expect(page.locator('#driver-popover-content')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.driver-overlay')).toBeVisible()
  })
})
