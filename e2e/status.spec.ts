import { expect, test, type Page } from '@playwright/test'

type State = 'open' | 'closed' | 'unknown'

function payload(state: State) {
  return {
    state,
    open: state === 'unknown' ? null : state === 'open',
    checkedAt: new Date().toISOString(),
    source: 'https://www.sierichs.de/',
  }
}

async function mockStatus(page: Page, getState: () => State) {
  await page.route('**/api/status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload(getState())),
    }),
  )
}

test('shows the closed state and the last check time', async ({ page }) => {
  await mockStatus(page, () => 'closed')

  await page.goto('/')

  await expect(page.locator('html')).toHaveAttribute('data-state', 'closed')
  await expect(page.getByRole('heading', { name: 'Geschlossen' })).toBeVisible()
  await expect(page.getByText(/Stand \d{2}:\d{2} Uhr/)).toBeVisible()
  await expect(page.getByText(/Offline/)).toBeHidden()
})

test('refresh switches from closed to open', async ({ page }) => {
  let state: State = 'closed'
  await mockStatus(page, () => state)

  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-state', 'closed')

  state = 'open'
  await page.getByRole('button', { name: 'Aktualisieren' }).click()

  await expect(page.locator('html')).toHaveAttribute('data-state', 'open')
  await expect(page.getByRole('heading', { name: 'Geöffnet' })).toBeVisible()
  await expect(page.getByText('Der Biergarten Sierich hat geöffnet.')).toBeVisible()
})

test('falls back to the last known status when the API is offline', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'sierichs-ampel-status-v1',
      JSON.stringify({
        state: 'open',
        open: true,
        checkedAt: new Date().toISOString(),
        source: 'https://www.sierichs.de/',
      }),
    )
  })
  await page.route('**/api/status', (route) => route.abort())

  await page.goto('/')

  await expect(page.locator('html')).toHaveAttribute('data-state', 'open')
  await expect(page.getByText(/Offline/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Geöffnet' })).toBeVisible()
})

test('ships an installable web app manifest', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest')
  expect(response.ok()).toBe(true)

  const manifest = (await response.json()) as {
    name: string
    display: string
    icons: Array<{ src: string; sizes: string }>
  }

  expect(manifest.name).toBe('Sierichs Ampel')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
    expect.arrayContaining(['192x192', '512x512']),
  )

  for (const icon of manifest.icons) {
    const iconResponse = await request.get(`/${icon.src}`)
    expect(iconResponse.ok(), `${icon.src} should exist`).toBe(true)
  }
})

test('serves the service worker', async ({ request }) => {
  const response = await request.get('/sw.js')
  expect(response.ok()).toBe(true)
  expect(await response.text()).toContain('workbox')
})
