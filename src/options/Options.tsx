import { useEffect, useState } from 'react'
import {
  loadSettings,
  saveSettings,
  PRESETS,
  DEFAULT_SETTINGS,
  type Settings,
} from '../shared/settings'

// ─── Toggle ────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`toggle ${checked ? 'toggle--on' : ''}`}
    >
      <span className="toggle__thumb" />
    </button>
  )
}

// ─── Setting row ───────────────────────────────────────────────────────────

function Row({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="row">
      <div className="row__text">
        <span className="row__label">{label}</span>
        {description && <p className="row__desc">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

// ─── Section ───────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="section">
      <h2 className="section__title">{title}</h2>
      <div className="section__body">{children}</div>
    </section>
  )
}

// ─── Options root ──────────────────────────────────────────────────────────

export default function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [status, setStatus] = useState<'idle' | 'saved' | 'reset'>('idle')

  useEffect(() => {
    loadSettings().then(setSettings)
  }, [])

  async function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch, activePreset: 'custom' as const }
    setSettings(next)
    await saveSettings(next)
    flash('saved')
  }

  async function applyPreset(key: keyof typeof PRESETS) {
    const next = { ...settings, ...PRESETS[key] }
    setSettings(next)
    await saveSettings(next)
    flash('saved')
  }

  async function resetAll() {
    setSettings(DEFAULT_SETTINGS)
    await saveSettings(DEFAULT_SETTINGS)
    flash('reset')
  }

  function flash(type: 'saved' | 'reset') {
    setStatus(type)
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="options">
      {/* Header */}
      <header className="header">
        <div className="header__brand">
          <span className="header__icon">🎯</span>
          <div>
            <h1 className="header__title">YT Focus</h1>
            <p className="header__sub">Advanced settings</p>
          </div>
        </div>
        <div className="header__actions">
          {status !== 'idle' && (
            <span className={`status-badge status-badge--${status}`}>
              {status === 'saved' ? '✓ Saved' : '↺ Reset to defaults'}
            </span>
          )}
          <Toggle
            checked={settings.enabled}
            onChange={(v) => update({ enabled: v })}
          />
          <span className="master-label">
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </header>

      <div className="content">
        {/* Presets */}
        <Section title="Presets">
          <p className="section__intro">
            One-click configurations for common use cases. Selecting a preset
            overwrites all settings below.
          </p>
          <div className="presets">
            {(['study', 'music', 'relax'] as const).map((p) => {
              const meta = {
                study: { icon: '📚', desc: 'Maximum focus. Hides everything.' },
                music: { icon: '🎵', desc: 'Keep recommendations, hide clutter.' },
                relax: { icon: '☕', desc: 'Balanced. Only essentials hidden.' },
              }[p]
              return (
                <button
                  key={p}
                  className={`preset-card ${settings.activePreset === p ? 'preset-card--active' : ''}`}
                  onClick={() => applyPreset(p)}
                >
                  <span className="preset-card__icon">{meta.icon}</span>
                  <span className="preset-card__name">{p}</span>
                  <span className="preset-card__desc">{meta.desc}</span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Distractions */}
        <Section title="Hide distractions">
          <Row
            label="Shorts shelf"
            description="Removes Shorts from the home page, search results, and subscriptions feed."
            checked={settings.hideShorts}
            onChange={(v) => update({ hideShorts: v })}
          />
          <Row
            label="Shorts sidebar tab"
            description="Removes the Shorts entry from the left navigation sidebar."
            checked={settings.hideShortsTab}
            onChange={(v) => update({ hideShortsTab: v })}
          />
          <Row
            label="Home feed"
            description="Hides the entire recommendation grid on the YouTube homepage. You can still search and access subscriptions."
            checked={settings.hideHomeFeed}
            onChange={(v) => update({ hideHomeFeed: v })}
          />
          <Row
            label="Recommendations sidebar"
            description="Removes the 'Up next' and related video sidebar on the watch page. The video player expands to fill the space."
            checked={settings.hideRecommendations}
            onChange={(v) => update({ hideRecommendations: v })}
          />
          <Row
            label="End cards"
            description="Removes the video overlay cards that appear in the last 20 seconds of a video."
            checked={settings.hideEndCards}
            onChange={(v) => update({ hideEndCards: v })}
          />
          <Row
            label="Comments"
            description="Hides the entire comments section on watch pages."
            checked={settings.hideComments}
            onChange={(v) => update({ hideComments: v })}
          />
          <Row
            label="Autoplay"
            description="Hides the autoplay toggle and the 'Next' button to prevent videos from auto-playing."
            checked={settings.hideAutoplay}
            onChange={(v) => update({ hideAutoplay: v })}
          />
          <Row
            label="Live chat"
            description="Hides the live chat panel on live streams and premieres."
            checked={settings.hideLiveChat}
            onChange={(v) => update({ hideLiveChat: v })}
          />
          <Row
            label="Merchandise shelf"
            description="Removes the merch/product shelves that appear below videos."
            checked={settings.hideMerchandise}
            onChange={(v) => update({ hideMerchandise: v })}
          />
          <Row
            label="Notification bell"
            description="Hides the notification bell icon in the top bar."
            checked={settings.hideNotificationBell}
            onChange={(v) => update({ hideNotificationBell: v })}
          />
        </Section>

        {/* Focus */}
        <Section title="Focus tools">
          <Row
            label="Redirect Shorts to watch page"
            description="When you open a /shorts/ URL, automatically redirects to the standard /watch?v= player instead."
            checked={settings.redirectShortsToWatch}
            onChange={(v) => update({ redirectShortsToWatch: v })}
          />
          <Row
            label="Focus timer"
            description="Shows a small countdown timer overlay on YouTube. When the session ends, the timer pulses red as a reminder to take a break."
            checked={settings.focusTimerEnabled}
            onChange={(v) => update({ focusTimerEnabled: v })}
          />
          {settings.focusTimerEnabled && (
            <div className="row row--sub">
              <div className="row__text">
                <span className="row__label">Session length</span>
                <p className="row__desc">
                  How long each focus session lasts before the timer alert fires.
                </p>
              </div>
              <div className="number-input-wrap">
                <input
                  type="number"
                  className="number-input"
                  min={1}
                  max={240}
                  value={settings.focusTimerMinutes}
                  onChange={(e) =>
                    update({ focusTimerMinutes: Number(e.target.value) })
                  }
                />
                <span className="number-unit">minutes</span>
              </div>
            </div>
          )}
        </Section>

        {/* Danger zone */}
        <Section title="Reset">
          <div className="reset-zone">
            <div>
              <p className="row__label">Reset all settings</p>
              <p className="row__desc">
                Restores every setting to its factory default. This cannot be undone.
              </p>
            </div>
            <button className="reset-btn" onClick={resetAll}>
              Reset to defaults
            </button>
          </div>
        </Section>
      </div>
    </div>
  )
}
