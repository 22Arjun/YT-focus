import { loadSettings, onSettingsChanged, type Settings } from '../shared/settings'

// ─── Class map ─────────────────────────────────────────────────────────────
// Maps each setting key → CSS class toggled on <html>

const CLASS_MAP: Partial<Record<keyof Settings, string>> = {
  hideShorts:           'ytf-hide-shorts',
  hideShortsTab:        'ytf-hide-shorts-tab',
  hideHomeFeed:         'ytf-hide-home-feed',
  hideRecommendations:  'ytf-hide-recommendations',
  hideEndCards:         'ytf-hide-end-cards',
  hideComments:         'ytf-hide-comments',
  hideAutoplay:         'ytf-hide-autoplay',
  hideLiveChat:         'ytf-hide-live-chat',
  hideMerchandise:      'ytf-hide-merchandise',
  hideNotificationBell: 'ytf-hide-notification-bell',
}

const ALL_CLASSES = Object.values(CLASS_MAP) as string[]

// ─── MutationObserver (forward declaration) ────────────────────────────────
// Declared here so applySettings can disconnect/reconnect it to prevent
// infinite loops: applySettings changes <html> classes → observer fires →
// applySettings again → infinite loop → page freeze/crash.

let observer: MutationObserver

// ─── Apply settings to DOM ─────────────────────────────────────────────────

function applySettings(s: Settings): void {
  const html = document.documentElement

  // Pause the observer so our class mutations don't re-trigger it
  observer.disconnect()

  try {
    if (!s.enabled) {
      // Master switch OFF: strip ALL ytf classes and clean up
      for (const cls of ALL_CLASSES) {
        html.classList.remove(cls)
      }
      removeTimer()
    } else {
      // Toggle each feature class based on setting value
      for (const [key, cls] of Object.entries(CLASS_MAP) as [keyof Settings, string][]) {
        html.classList.toggle(cls, Boolean(s[key]))
      }

      // Shorts redirect
      if (s.redirectShortsToWatch) {
        redirectShortsIfNeeded()
      }

      // Focus timer
      if (s.focusTimerEnabled) {
        initTimer(s.focusTimerMinutes)
      } else {
        removeTimer()
      }
    }
  } finally {
    // Always resume observing after we're done writing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }
}

// ─── Shorts redirect ───────────────────────────────────────────────────────

function redirectShortsIfNeeded(): void {
  const match = location.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/)
  if (match) {
    location.replace(`/watch?v=${match[1]}`)
  }
}

// ─── Focus Timer ───────────────────────────────────────────────────────────

let timerInterval: ReturnType<typeof setInterval> | null = null
let timerEl: HTMLElement | null = null
let timerSeconds = 0
let timerRunning = false
let timerInitialSeconds = 0

function initTimer(minutes: number): void {
  if (timerEl) return  // already mounted
  timerInitialSeconds = minutes * 60
  timerSeconds = timerInitialSeconds
  timerRunning = true

  timerEl = document.createElement('div')
  timerEl.id = 'ytf-timer'
  timerEl.innerHTML = `
    <span class="ytf-timer-icon">⏱</span>
    <div>
      <div class="ytf-timer-time">${formatTime(timerSeconds)}</div>
      <div class="ytf-timer-label">Focus session</div>
    </div>
    <button id="ytf-timer-toggle">Pause</button>
    <button id="ytf-timer-reset">↺</button>
  `
  document.body.appendChild(timerEl)

  timerEl.querySelector('#ytf-timer-toggle')!.addEventListener('click', () => {
    timerRunning = !timerRunning
    const btn = timerEl!.querySelector('#ytf-timer-toggle') as HTMLButtonElement
    btn.textContent = timerRunning ? 'Pause' : 'Resume'
  })

  timerEl.querySelector('#ytf-timer-reset')!.addEventListener('click', () => {
    timerSeconds = timerInitialSeconds
    timerRunning = true
    timerEl!.classList.remove('ytf-timer-done')
    const btn = timerEl!.querySelector('#ytf-timer-toggle') as HTMLButtonElement
    btn.textContent = 'Pause'
    updateTimerDisplay()
  })

  timerInterval = setInterval(tick, 1000)
}

function tick(): void {
  if (!timerRunning || !timerEl) return
  timerSeconds--
  updateTimerDisplay()
  if (timerSeconds <= 0) {
    timerEl.classList.add('ytf-timer-done')
    timerRunning = false
    const btn = timerEl.querySelector('#ytf-timer-toggle') as HTMLButtonElement
    btn.textContent = 'Done!'
  }
}

function updateTimerDisplay(): void {
  const timeEl = timerEl?.querySelector('.ytf-timer-time')
  if (timeEl) timeEl.textContent = formatTime(Math.max(0, timerSeconds))
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function removeTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  timerEl?.remove()
  timerEl = null
}

// ─── SPA navigation (YouTube History API) ─────────────────────────────────
// YouTube is a SPA — intercept pushState/replaceState to re-apply settings
// on each page transition since the <html> element persists across navigations.

let currentSettings: Settings | null = null

function patchHistoryMethod(method: 'pushState' | 'replaceState') {
  const original = history[method].bind(history)
  history[method] = function (...args) {
    original(...args)
    window.dispatchEvent(new Event('ytf:navigate'))
  }
}

patchHistoryMethod('pushState')
patchHistoryMethod('replaceState')

window.addEventListener('popstate', () => {
  window.dispatchEvent(new Event('ytf:navigate'))
})

window.addEventListener('ytf:navigate', () => {
  if (!currentSettings) return
  if (currentSettings.redirectShortsToWatch) {
    redirectShortsIfNeeded()
  }
  // Re-apply classes — YouTube SPA navigation can reset <html> attributes
  applySettings(currentSettings)
})

// ─── MutationObserver ──────────────────────────────────────────────────────
// YouTube's framework occasionally resets <html> class attributes on
// page transitions. Re-apply our classes if they get stripped.
// IMPORTANT: applySettings() disconnects this observer before writing
// classes and reconnects after — preventing the infinite feedback loop
// that previously caused page crashes.
// Debounce: avoid re-applying on every rapid mutation (e.g. during search
// load) which can cause feedback loops and perpetually "loading" pages.

let observerTimeout: ReturnType<typeof setTimeout> | null = null
const OBSERVER_DEBOUNCE_MS = 80

observer = new MutationObserver(() => {
  if (!currentSettings) return
  if (observerTimeout) clearTimeout(observerTimeout)
  observerTimeout = setTimeout(() => {
    observerTimeout = null
    applySettings(currentSettings)
  }, OBSERVER_DEBOUNCE_MS)
})

// Initial observe — applySettings will manage disconnect/reconnect from here on
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class'],
})

// ─── Boot ──────────────────────────────────────────────────────────────────

async function boot() {
  currentSettings = await loadSettings()
  applySettings(currentSettings)

  // React to changes from popup / options page
  onSettingsChanged((newSettings) => {
    currentSettings = newSettings
    applySettings(newSettings)
  })
}

boot()
