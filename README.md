# RSNA Study Cards

A private, mobile-first **PWA** for RSNA Ventures interview prep. Installs to your iPhone home screen, runs full-screen, works offline, and uses lightweight spaced repetition to keep the right cards in front of you.

> Sourced from `../RSNA_INTERVIEW_PREP.md` and interview-prep pitch artifacts. 220 hand-curated cards across 18 topics. All progress lives in `localStorage` on the device that installs it. Nothing is uploaded.

## Quickstart

```sh
cd "rsna-study-cards"
npm install
npm run dev -- --host
```

Vite prints two URLs:

- `Local:   http://localhost:5173/` — open this on the Mac for development.
- `Network: http://192.168.x.x:5173/` — open this on the iPhone (same Wi-Fi).

## Install on iPhone

1. On the Mac, run `npm run dev -- --host` (or `npm run build && npm run preview -- --host` for a production-feel build).
2. On the iPhone (same Wi-Fi), open the `Network: http://192.168.x.x:...` URL in **Safari** (not Chrome — Chrome on iOS doesn't install PWAs).
3. Tap the **Share** button, scroll down, tap **Add to Home Screen**.
4. The app now has its own icon, opens full-screen with no Safari chrome, and works offline after the first load.

To uninstall: long-press the icon on the home screen → Remove App → Delete App.

## Modes

- **Due** — cards whose `dueAt` is past or null (new). Default landing.
- **Cram** — all cards in the current topic, shuffled, no SRS effect.
- **Drill** — STAR / question-style prompts only, shuffled. Use this the morning of the interview.
- **Search** — full-text across front, back, topic, tags.

## Spaced repetition (SM-2 lite)

Per card we store `ease` (default 2.5, min 1.3), `intervalDays`, `dueAt`, `reviewCount`, `lapses`, and `lastReviewedAt`.

| Rating | Interval                    | Ease         |
|--------|-----------------------------|--------------|
| Again  | 0d (due now)                | -0.20        |
| Hard   | `intervalDays * 1.2`, min 1 | -0.15        |
| Good   | `intervalDays * ease`, min 1| unchanged    |
| Easy   | `intervalDays * ease * 1.3` | +0.15        |

The confidence buttons show the projected next-review interval before you tap, so you can calibrate.

## Keyboard shortcuts (desktop)

- `Space` / `Enter` — flip card
- `1` `2` `3` `4` — Again / Hard / Good / Easy (after the card is flipped)

On iPhone you tap to flip; swiping left/right past the threshold rates Again/Good when the back is showing.

## Editing cards

Cards live in `src/data/cards.json`. Each card has:

```ts
{
  id: string;            // stable; do not change after first review
  topic: Topic;          // one of the 8 topics in src/lib/types.ts
  front: string;
  back: string;
  sourceSection?: string;
  difficulty: 'core' | 'stretch';
  tags: string[];
  promptType: 'definition' | 'compare' | 'star' | 'question' | 'concept';
}
```

Editing a card's text is safe — the card's `id` is what links to your review history. Adding new cards is just appending to the array; their `id` strings must be unique.

After editing, refresh the dev server tab on the iPhone (or rebuild and re-cache).

## Reset progress

In the app: tap the `⋮` menu in the header → **Reset progress**. Wipes `localStorage`. Does not affect cards.

## Build / deploy

```sh
npm run typecheck   # tsc -b --noEmit
npm run build       # outputs dist/
npm run preview     # serves dist/ locally
```

`dist/` is fully static — host it anywhere. **Don't host this publicly**: cards include compensation strategy and draft interview answers. The local Vite server is enough for an interview week.

## File map

```
rsna-study-cards/
├─ public/                       # icons + favicon (generated)
├─ scripts/generate-icons.py     # regenerate icons from a single Python script
├─ src/
│  ├─ components/
│  │  ├─ Card.tsx                # flip + swipe + haptics
│  │  ├─ ConfidenceButtons.tsx   # Again / Hard / Good / Easy
│  │  ├─ ModeBar.tsx             # Due / Cram / Drill / Search
│  │  ├─ SearchView.tsx
│  │  ├─ StudyDeck.tsx           # queue builder + scheduler glue
│  │  └─ TopicPicker.tsx         # bottom-sheet topic selector
│  ├─ data/cards.json            # the study cards
│  ├─ lib/
│  │  ├─ haptics.ts
│  │  ├─ srs.ts                  # SM-2 lite
│  │  ├─ storage.ts              # localStorage wrappers
│  │  └─ types.ts
│  ├─ App.tsx
│  ├─ main.tsx
│  ├─ styles.css
│  └─ sw.ts                      # custom service worker (Workbox injectManifest)
├─ index.html                    # iOS PWA meta tags
└─ vite.config.ts                # vite-plugin-pwa, injectManifest mode
```

## Troubleshooting

- **iPhone doesn't see the URL.** Confirm both devices are on the same Wi-Fi. Some networks (corporate / hotel / guest) isolate clients; use a personal hotspot if so.
- **PWA opens in Safari instead of full-screen.** You opened the home-screen icon, not the bookmark — make sure you used **Add to Home Screen**, not **Add Bookmark**.
- **Old version of the app keeps loading.** Pull-to-refresh in the app, or close and reopen — the service worker uses `autoUpdate` and will pick up the new version on the next launch.
- **"Reset progress" warning bypassed.** That uses `window.confirm`, which iOS PWAs honor.

## Privacy

- No analytics, no remote calls, no auth.
- All progress lives in `localStorage` on the device.
- Service worker only caches files served by your local Vite or static host — nothing leaves the device.
