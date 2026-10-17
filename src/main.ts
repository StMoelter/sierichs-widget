import './style.css'
import { STATUS_SOURCE, type OpenState, type StatusPayload } from './shared/status'

type UiState = OpenState | 'loading'

const STORAGE_KEY = 'sierichs-ampel-status-v1'
const REFRESH_INTERVAL_MS = 5 * 60 * 1000

const app = getElement<HTMLElement>('#app')
const title = getElement<HTMLElement>('#status-title')
const text = getElement<HTMLElement>('#status-text')
const checkedAt = getElement<HTMLElement>('#checked-at')
const refreshButton = getElement<HTMLButtonElement>('#refresh')
const offlineNote = getElement<HTMLElement>('#offline-note')

const timeFormatter = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
})

const COPY: Record<UiState, { title: string; text: string }> = {
  open: {
    title: 'Geöffnet',
    text: 'Der Biergarten Sierich hat geöffnet.',
  },
  closed: {
    title: 'Geschlossen',
    text: 'Der Biergarten Sierich hat geschlossen.',
  },
  unknown: {
    title: 'Unbekannt',
    text: 'Der Status konnte nicht ermittelt werden.',
  },
  loading: {
    title: 'Status wird geladen',
    text: 'Einen Moment bitte.',
  },
}

let inFlight = false

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)

  if (!element) {
    throw new Error(`Missing element: ${selector}`)
  }

  return element
}

function formatCheckedAt(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Zeitpunkt unbekannt'
  }

  const today = new Date()
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  const time = timeFormatter.format(date)

  return sameDay
    ? `Stand ${time} Uhr`
    : `Stand ${dateFormatter.format(date)}, ${time} Uhr`
}

function setState(state: UiState): void {
  document.documentElement.dataset.state = state
  app.dataset.state = state

  const copy = COPY[state]
  title.textContent = copy.title
  text.textContent = copy.text
  document.title = `${copy.title} · Sierichs Ampel`
}

function showNote(message: string | null): void {
  offlineNote.hidden = message === null
  offlineNote.textContent = message ?? ''
}

function renderStatus(payload: StatusPayload, isOffline = false): void {
  setState(payload.state)
  checkedAt.textContent = formatCheckedAt(payload.checkedAt)
  showNote(
    isOffline
      ? 'Offline – angezeigt wird der letzte bekannte Stand.'
      : null,
  )
}

function readCache(): StatusPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const value = JSON.parse(raw) as Partial<StatusPayload>

    if (
      (value.state === 'open' || value.state === 'closed') &&
      typeof value.checkedAt === 'string'
    ) {
      return {
        state: value.state,
        open: value.state === 'open',
        checkedAt: value.checkedAt,
        source: STATUS_SOURCE,
      }
    }
  } catch {
    return null
  }

  return null
}

function writeCache(payload: StatusPayload): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage can be unavailable in private modes; the app still works.
  }
}

function isStatusPayload(value: unknown): value is StatusPayload {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<StatusPayload>

  return (
    (candidate.state === 'open' ||
      candidate.state === 'closed' ||
      candidate.state === 'unknown') &&
    typeof candidate.checkedAt === 'string'
  )
}

async function refreshStatus(): Promise<void> {
  if (inFlight) {
    return
  }

  inFlight = true
  refreshButton.disabled = true
  refreshButton.classList.add('is-loading')
  app.setAttribute('aria-busy', 'true')

  try {
    const response = await fetch('/api/status', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Status request failed with HTTP ${response.status}`)
    }

    const data: unknown = await response.json()

    if (!isStatusPayload(data)) {
      throw new Error('Status response has an unexpected shape')
    }

    renderStatus(data)

    if (data.state !== 'unknown') {
      writeCache(data)
    }
  } catch {
    const cached = readCache()

    if (cached) {
      renderStatus(cached, true)
    } else {
      setState('unknown')
      checkedAt.textContent = '\u00a0'
      showNote('Status konnte nicht geladen werden. Bitte später erneut versuchen.')
    }
  } finally {
    inFlight = false
    refreshButton.disabled = false
    refreshButton.classList.remove('is-loading')
    app.removeAttribute('aria-busy')
  }
}

const cached = readCache()

if (cached) {
  renderStatus(cached)
} else {
  setState('loading')
  checkedAt.textContent = '\u00a0'
}

refreshButton.addEventListener('click', () => {
  void refreshStatus()
})

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    void refreshStatus()
  }
})

window.addEventListener('online', () => {
  void refreshStatus()
})

window.setInterval(() => {
  if (document.visibilityState === 'visible') {
    void refreshStatus()
  }
}, REFRESH_INTERVAL_MS)

void refreshStatus()
