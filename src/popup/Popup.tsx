import { useEffect, useState } from 'react'
import {
  loadSettings,
  saveSettings,
  PRESETS,
  DEFAULT_SETTINGS,
  type Settings,
} from '../shared/settings'



function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`toggle ${checked ? 'toggle--on' : ''}`}>
      <span className="toggle__thumb" />
    </button>
  )
}

function Row({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="row">
      <div className="row__text">
        <span className="row__label">{label}</span>
        {description && <span className="row__desc">{description}</span>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function Popup() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadSettings().then(setSettings) }, [])

  async function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch, activePreset: 'custom' as const }
    setSettings(next)
    await saveSettings(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1400)
  }

  async function applyPreset(key: keyof typeof PRESETS) {
    const next = { ...settings, ...PRESETS[key] }
    setSettings(next)
    await saveSettings(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1400)
  }

  return (
    <>
      <div className="popup">
        <header className="header">
          <div className="header__logo">
            <span className="header__icon">🎯</span>
            <span className="header__title">YT Focus</span>
          </div>
          <div className="header__right">
            {saved && <span className="saved-badge">Saved ✓</span>}
            <Toggle checked={settings.enabled} onChange={(v) => update({ enabled: v })} />
          </div>
        </header>

        <div className={`popup__body ${!settings.enabled ? 'popup__body--disabled' : ''}`}>
          <section className="section">
            <div className="section__title">Presets</div>
            <div className="presets">
              {(['study', 'music', 'relax'] as const).map((p) => (
                <button key={p} className={`preset-btn ${settings.activePreset === p ? 'preset-btn--active' : ''}`} onClick={() => applyPreset(p)}>
                  {p === 'study' && '📚'}{p === 'music' && '🎵'}{p === 'relax' && '☕'}
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section__title">Hide distractions</div>
            <Row label="Shorts" description="Home, search, subscriptions" checked={settings.hideShorts} onChange={(v) => update({ hideShorts: v })} />
            <Row label="Shorts tab" description="Sidebar navigation entry" checked={settings.hideShortsTab} onChange={(v) => update({ hideShortsTab: v })} />
            <Row label="Home feed" description="Entire recommended grid" checked={settings.hideHomeFeed} onChange={(v) => update({ hideHomeFeed: v })} />
            <Row label="Recommendations" description="Right sidebar on watch page" checked={settings.hideRecommendations} onChange={(v) => update({ hideRecommendations: v })} />
            <Row label="End cards" description="Video overlay at end of video" checked={settings.hideEndCards} onChange={(v) => update({ hideEndCards: v })} />
            <Row label="Comments" checked={settings.hideComments} onChange={(v) => update({ hideComments: v })} />
            <Row label="Autoplay" description="Next video button + toggle" checked={settings.hideAutoplay} onChange={(v) => update({ hideAutoplay: v })} />
            <Row label="Live chat" checked={settings.hideLiveChat} onChange={(v) => update({ hideLiveChat: v })} />
            <Row label="Merchandise shelf" checked={settings.hideMerchandise} onChange={(v) => update({ hideMerchandise: v })} />
            <Row label="Notification bell" checked={settings.hideNotificationBell} onChange={(v) => update({ hideNotificationBell: v })} />
          </section>

          <section className="section">
            <div className="section__title">Focus</div>
            <Row label="Redirect Shorts to watch" description="/shorts/ID → /watch?v=ID" checked={settings.redirectShortsToWatch} onChange={(v) => update({ redirectShortsToWatch: v })} />
            <Row label="Focus timer" description="Overlay timer on YouTube" checked={settings.focusTimerEnabled} onChange={(v) => update({ focusTimerEnabled: v })} />
            {settings.focusTimerEnabled && (
              <div className="timer-row">
                <span className="row__label">Session length</span>
                <div className="timer-input-wrap">
                  <input type="number" className="timer-input" min={1} max={240} value={settings.focusTimerMinutes} onChange={(e) => update({ focusTimerMinutes: Number(e.target.value) })} />
                  <span className="timer-unit">min</span>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="footer">
          <a className="footer__link" href="#" onClick={(e) => { e.preventDefault(); chrome.runtime.openOptionsPage() }}>
            Advanced settings ↗
          </a>
        </footer>
      </div>
    </>
  )
}
