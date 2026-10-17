export type OpenState = 'open' | 'closed' | 'unknown'

export interface StatusPayload {
  state: OpenState
  open: boolean | null
  checkedAt: string
  source: string
}

export const STATUS_SOURCE = 'https://www.sierichs.de/'

const CLASS_PATTERN = /<button\b[^>]*\bclass\s*=\s*["']([^"']*)["'][^>]*>/gi
const AMPEL_PATTERN = /<div\b[^>]*\bclass\s*=\s*["'][^"']*\bampel\b[^"']*["'][^>]*>[\s\S]*?<\/div>/i

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function parseStatus(html: string): OpenState {
  const classes = Array.from(html.matchAll(CLASS_PATTERN), (match) => match[1] ?? '')
  const hasOpenClass = classes.some((value) => /\bblub-open\b/i.test(value))
  const hasClosedClass = classes.some((value) => /\bblub-closed\b/i.test(value))

  if (hasOpenClass && !hasClosedClass) return 'open'
  if (hasClosedClass && !hasOpenClass) return 'closed'

  const ampel = html.match(AMPEL_PATTERN)
  if (!ampel) return 'unknown'

  const text = stripTags(ampel[0])
  if (/\b(?:GEOEFFNET|GEÖFFNET)\b/i.test(text)) return 'open'
  if (/\bGESCHLOSSEN\b/i.test(text)) return 'closed'

  return 'unknown'
}

export async function loadStatus(
  fetcher: typeof fetch = fetch,
  now: Date = new Date(),
): Promise<StatusPayload> {
  const response = await fetcher(STATUS_SOURCE, {
    headers: {
      accept: 'text/html',
      'user-agent': 'sierichs-ampel/1.0',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(8_000),
  })

  if (!response.ok) {
    throw new Error(`Status page responded with HTTP ${response.status}`)
  }

  const html = await response.text()
  const state = parseStatus(html)

  return {
    state,
    open: state === 'unknown' ? null : state === 'open',
    checkedAt: now.toISOString(),
    source: STATUS_SOURCE,
  }
}
