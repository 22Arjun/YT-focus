# YT Focus — Distraction-free YouTube

A professional Chrome extension to remove distractions from YouTube.

## Features

- Hide Shorts (shelf, tab, and redirect /shorts/ URLs to /watch)
- Hide home feed recommendations
- Hide right sidebar on watch page
- Hide end cards, comments, autoplay, live chat, merchandise
- Preset modes: Study, Music, Relax
- Focus timer overlay (Pomodoro-style)
- Settings sync across Chrome devices via chrome.storage.sync
- Master on/off toggle
- "OFF" badge on icon when disabled

## Setup

### Prerequisites

- Node.js 18+
- A Chromium browser (Chrome, Edge, Brave, Arc)

### Install & run

```bash
# 1. Install dependencies
npm install

# 2. Build in watch mode (rebuilds on every save)
npm run dev
```

### Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder inside this project
5. The YT Focus icon appears in your toolbar

> After any code change, the extension auto-rebuilds. Hit the **↺ refresh** button on the extensions page to reload it.

## Project structure

```
src/
  shared/
    settings.ts        ← Settings schema, defaults, presets, storage helpers
  content/
    content.ts         ← DOM manipulation, MutationObserver, SPA navigation
    content.css        ← CSS selectors that hide YouTube elements
  background/
    service-worker.ts  ← MV3 service worker, badge sync
  popup/
    Popup.tsx          ← Main popup UI (React)
    popup.tsx          ← Entry point
    popup.html         ← HTML shell
    popup.css          ← Dark theme styles
```

## Adding a new feature

1. Add the key to `Settings` interface in `src/shared/settings.ts`
2. Set a default in `DEFAULT_SETTINGS`
3. Add the CSS selector to `content.css`
4. Map the key to its class in `CLASS_MAP` inside `content.ts`
5. Add a `<Row>` toggle in `Popup.tsx`

## Publishing to Chrome Web Store

1. Run `npm run build`
2. Zip the `dist/` folder
3. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Pay one-time $5 developer fee
5. Upload the zip, add screenshots, description, and submit for review
