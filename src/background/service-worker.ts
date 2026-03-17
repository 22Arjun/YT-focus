// YT Focus — Service Worker (Manifest V3)
// Handles messages and keeps extension icon badge in sync.

import { loadSettings, saveSettings } from '../shared/settings'

// ─── Extension icon badge ──────────────────────────────────────────────────

async function syncBadge(): Promise<void> {
  const { enabled } = await loadSettings()
  chrome.action.setBadgeText({ text: enabled ? '' : 'OFF' })
  chrome.action.setBadgeBackgroundColor({ color: '#cc0000' })
}

// ─── Message handler ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_SETTINGS') {
    loadSettings().then(sendResponse)
    return true  // async response
  }

  if (msg.type === 'SAVE_SETTINGS') {
    saveSettings(msg.payload).then(() => {
      syncBadge()
      sendResponse({ ok: true })
    })
    return true
  }
})

// ─── Storage change → badge sync ──────────────────────────────────────────

chrome.storage.onChanged.addListener(() => {
  syncBadge()
})

// ─── Install / update ──────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    // Open YouTube on first install so the content script activates
    chrome.tabs.create({ url: 'https://www.youtube.com' })
  }
  syncBadge()
})

// Initial badge sync on service worker startup
syncBadge()
