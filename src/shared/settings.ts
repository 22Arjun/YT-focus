// ─── Settings schema ───────────────────────────────────────────────────────

export interface Settings {
  // Master switch
  enabled: boolean

  // Distractions
  hideShorts: boolean
  hideShortsTab: boolean
  hideHomeFeed: boolean
  hideRecommendations: boolean   // right sidebar on watch page
  hideEndCards: boolean
  hideComments: boolean
  hideAutoplay: boolean
  hideLiveChat: boolean
  hideMerchandise: boolean
  hideNotificationBell: boolean

  // Focus features
  focusTimerEnabled: boolean
  focusTimerMinutes: number       // session length in minutes
  redirectShortsToWatch: boolean  // /shorts/ID → /watch?v=ID

  // Presets label (empty = custom)
  activePreset: 'study' | 'music' | 'relax' | 'custom'
}

// ─── Defaults ──────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,

  hideShorts: true,
  hideShortsTab: true,
  hideHomeFeed: false,
  hideRecommendations: true,
  hideEndCards: true,
  hideComments: false,
  hideAutoplay: true,
  hideLiveChat: false,
  hideMerchandise: true,
  hideNotificationBell: false,

  focusTimerEnabled: false,
  focusTimerMinutes: 25,
  redirectShortsToWatch: true,

  activePreset: 'custom',
}

// ─── Presets ───────────────────────────────────────────────────────────────

export const PRESETS: Record<string, Partial<Settings>> = {
  study: {
    hideShorts: true,
    hideShortsTab: true,
    hideHomeFeed: true,
    hideRecommendations: true,
    hideEndCards: true,
    hideComments: true,
    hideAutoplay: true,
    hideLiveChat: true,
    hideMerchandise: true,
    hideNotificationBell: true,
    focusTimerEnabled: true,
    focusTimerMinutes: 25,
    redirectShortsToWatch: true,
    activePreset: 'study',
  },
  music: {
    hideShorts: true,
    hideShortsTab: true,
    hideHomeFeed: false,
    hideRecommendations: false,
    hideEndCards: true,
    hideComments: false,
    hideAutoplay: false,
    hideLiveChat: false,
    hideMerchandise: true,
    hideNotificationBell: false,
    focusTimerEnabled: false,
    focusTimerMinutes: 25,
    redirectShortsToWatch: true,
    activePreset: 'music',
  },
  relax: {
    hideShorts: true,
    hideShortsTab: true,
    hideHomeFeed: false,
    hideRecommendations: false,
    hideEndCards: false,
    hideComments: false,
    hideAutoplay: true,
    hideLiveChat: false,
    hideMerchandise: true,
    hideNotificationBell: true,
    focusTimerEnabled: false,
    focusTimerMinutes: 25,
    redirectShortsToWatch: false,
    activePreset: 'relax',
  },
}

// ─── Chrome storage helpers ─────────────────────────────────────────────────

export async function loadSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      resolve(items as Settings)
    })
  })
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(patch, resolve)
  })
}

export function onSettingsChanged(
  cb: (newSettings: Settings) => void
): () => void {
  const listener = () => {
    loadSettings().then(cb)
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
