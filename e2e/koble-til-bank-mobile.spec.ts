import { test, expect } from '@playwright/test'

const HELP_LABEL = 'Slik kobler du til bank'

test.describe('Koble til bank (mobil)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('siden laster uten horisontell body-overflow', async ({ page }) => {
    await page.goto('/konto/koble-til-bank')
    if (page.url().includes('logg-inn')) {
      test.skip()
    }

    await expect(page.getByRole('heading', { name: /koble til bank/i })).toBeVisible({
      timeout: 15_000,
    })

    const overflow = await page.evaluate(() => {
      const el = document.documentElement
      return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(2)
  })

  test('?-hjelp for bankkobling er tilgjengelig', async ({ page }) => {
    await page.goto('/konto/koble-til-bank')
    if (page.url().includes('logg-inn')) {
      test.skip()
    }

    const helpBtn = page.getByRole('button', { name: HELP_LABEL })
    await expect(helpBtn).toBeVisible({ timeout: 15_000 })
    await helpBtn.click()
    await expect(page.getByRole('region').getByText(HELP_LABEL)).toBeVisible()
  })

  test('kontoer-seksjon kan vises når koblet', async ({ page }) => {
    await page.goto('/konto/koble-til-bank')
    if (page.url().includes('logg-inn')) {
      test.skip()
    }
    const accountsHeading = page.getByRole('heading', { name: /kontoer å hente fra/i })
    if ((await accountsHeading.count()) === 0) {
      test.skip()
    }
    await expect(accountsHeading).toBeVisible({ timeout: 15_000 })
  })

  test('trykkflater for bank-handlinger har minst ca. 44px høyde', async ({ page }) => {    await page.goto('/konto/koble-til-bank')
    if (page.url().includes('logg-inn')) {
      test.skip()
    }

    const buttons = page.getByRole('button')
    const count = await buttons.count()
    if (count === 0) {
      test.skip()
    }

    for (let i = 0; i < Math.min(count, 6); i++) {
      const box = await buttons.nth(i).boundingBox()
      if (!box) continue
      expect(box.height).toBeGreaterThanOrEqual(40)
    }
  })
})
