import { describe, expect, it } from 'vitest'
import { loadStatus, parseStatus } from '../src/shared/status'

const CLOSED_HTML = `
  <div class="ampel is-wow fadeInLeft" data-wow-delay="0.05s">
    <button class="blub-closed is-wow fadeInLeft" data-wow-delay="0.05s"></button>
    <span class="mb-bhi-display mb-bhi-closed ">
      <span class="mb-bhi-oc-text">Wir haben leider <span>GESCHLOSSEN</span>.</span>
    </span>
  </div>
`

const OPEN_HTML = `
  <div class="ampel is-wow fadeInLeft">
    <button class="blub-open is-wow fadeInLeft"></button>
    <span class="mb-bhi-display mb-bhi-open">
      <span class="mb-bhi-oc-text">Wir haben <span>GEOEFFNET</span>.</span>
    </span>
  </div>
`

const CLOSED_TEXT_ONLY_HTML = `
  <div class="ampel">
    <span class="mb-bhi-display">
      <span class="mb-bhi-oc-text">Wir haben leider <span>GESCHLOSSEN</span>.</span>
    </span>
  </div>
`

describe('parseStatus', () => {
  it('detects the closed marker', () => {
    expect(parseStatus(CLOSED_HTML)).toBe('closed')
  })

  it('detects the open marker', () => {
    expect(parseStatus(OPEN_HTML)).toBe('open')
  })

  it('falls back to the status text when the marker is missing', () => {
    expect(parseStatus(CLOSED_TEXT_ONLY_HTML)).toBe('closed')
  })

  it('ignores stylesheet references outside the status markup', () => {
    const html = `
      <style>
        .ampel .blub-open { background: green; }
        .ampel .blub-closed { background: red; }
      </style>
      <p>Ampel GRÜN: Geöffnet. Ampel ROT: Geschlossen.</p>
    `

    expect(parseStatus(html)).toBe('unknown')
  })

  it('returns unknown when no status can be found', () => {
    expect(parseStatus('<html><body><p>Wartungsarbeiten</p></body></html>')).toBe(
      'unknown',
    )
  })
})

describe('loadStatus', () => {
  it('returns a typed payload for a successful response', async () => {
    const now = new Date('2026-10-17T12:00:00.000Z')
    const fetcher = (async () =>
      new Response(CLOSED_HTML, { status: 200 })) as typeof fetch

    await expect(loadStatus(fetcher, now)).resolves.toEqual({
      state: 'closed',
      open: false,
      checkedAt: '2026-10-17T12:00:00.000Z',
      source: 'https://www.sierichs.de/',
    })
  })

  it('maps unknown markup to an unknown payload', async () => {
    const fetcher = (async () =>
      new Response('<html><body>Kein Status</body></html>', {
        status: 200,
      })) as typeof fetch

    await expect(loadStatus(fetcher)).resolves.toMatchObject({
      state: 'unknown',
      open: null,
    })
  })

  it('throws when the status page is unavailable', async () => {
    const fetcher = (async () =>
      new Response('Service Unavailable', { status: 503 })) as typeof fetch

    await expect(loadStatus(fetcher)).rejects.toThrow('HTTP 503')
  })
})
