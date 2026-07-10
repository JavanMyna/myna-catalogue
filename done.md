# done.md — Fred's Archive changelog

A running log of what changed and why. Newest entries at the top.

---

## v1.1 — engineering pass (GLM 5.2 Prototype Engineer)

### Task 1 — Favicon
- `favicon/site.webmanifest` fixed: empty `name`/`short_name` filled with "Fred's Archive", the `theme_color`/`background_color` swapped from white (`#ffffff`) to the site's actual dark surface (`#14121a`), and the icon `src` changed from absolute (`/android-chrome…`) to relative so it resolves on Netlify as well as locally.
- `index.html` `<head>` now carries the full icon set: `favicon.ico` (any size), 32×32 and 16×16 PNGs, a 180×180 `apple-touch-icon`, a `<link rel="manifest">`, and a matching `<meta name="theme-color">`. All paths are relative (`favicon/…`) so deployment doesn't break them.
- Assumption: there is only one site HTML page — `index.html`. The `JBCv3.0_progress.html` under `assets/projects/` is a self-contained dev-log opened in a new tab from the Projects card, not part of the site shell, so it was deliberately left untouched. Mobile "add to home screen" should now pick up the apple-touch-icon and the manifest's stand-alone display mode.

### Task 2 — Carousel performance & pagination overhaul
- The dot-per-image row is gone. `initSlider` now renders a single `<span class="fa-page-indicator">` inside the existing `.fa-dots` container showing `current / total` (e.g. `1 / 6`). The DOM hook (`.fa-dots`) is unchanged, so the rest of the slider math is untouched. Photography went from ~62 dots to one line of text.
- Gallery `<img>` tags now carry `loading="lazy"` plus explicit `width="320" height="240"` attributes so the browser reserves a layout box before bytes arrive (no CLS).
- Real load reduction without binary generation: images are rendered with `data-src` only (no `src`). `initSlider.populateNearby()` hydrates the `src` for just a sliding window around the active index (cards-per-view + 2 each side). Off-window cards never queue a full-res download. Navigating with the arrows slides the window forward, hydrating the next batch on demand.
- The plaque (lightbox) reads `img.currentSrc || img.src || img.dataset.src`, so opening a placard for an off-window card still resolves the correct full-res image. Arrow navigation is unchanged.

### Task 3 — Audio player dark on mobile
- The audio bar was a native `<audio controls>` element — no custom divs, no `-webkit-appearance`, no `accent-color` on it. The "white on mobile" symptom was the UA media-control chrome falling back to light on mobile Safari/Chrome.
- Added `color-scheme: dark;` on `<html>` (and redundantly on `audio`), which is the canonical signal that makes both mobile Safari (WebKit) and mobile Chrome (Blink) render their native controls in the dark palette by default — so no flash-of-white on load.
- Pinned the panel explicitly with `audio::-webkit-media-controls-panel { background: var(--fa-surface-2); }` and set the time displays to the site text colour, overriding the OS default rather than inheriting it.
- Did not convert the player to a custom div build: the brief said check first whether it's already custom — it isn't, it's native, and `color-scheme: dark` + the panel override are enough.

### Task 4 — Photography gallery reorganisation
- Categories were inferred from the *existing* folder split already hard-coded into `photoData` (cats / environment / people) rather than invented:
  - **Cats** — 38 photos, the `cats/` folder (kml_cat, mango, miko, mita, mm, mmt series)
  - **People** — 8 photos, the `people/` folder (anthonny, fred02–04, guitar_friends, JBC_vendor, spm_nostalgia, with_lilbro)
  - **Scenes & Objects** — 10 photos, the `environment/` folder (clouds, doulosHope, a dated phone snap, JBC_display, myGuitar, panda_miniature)
  - "Film experiments" was *not* created — no such images exist in the assets.
- A filter tab row (`.fa-photo-filter` + `.fa-filter-btn`) sits above the carousel, styled as a sibling of the existing top `.fa-nav` (same pill-underline idiom, photo accent colour) so it reads as one family of control, not a new component.
- Selecting a tab re-renders the *same* `.fa-track` with a filtered slice of `photoData` (no per-category markup duplication) and calls `wrapper._faReset()` to rebuild the page indicator and re-clamp the carousel index against the new card count. No page reload.

### Tasks 5, 6, 7 — Unified music data model
- New `songs.js` holds `window.SONGS` — one entry per track with `{ id, title, category, type, soundcloudUrl, story, previewSrc, fullSrc }`. It loads before `script.js`. The old inline `musicGroups` literal is gone; `script.js` now derives the groups from `SONGS` (preserving category insertion order and the Jummbox/Beepbox byline note).
- **Preview playback (T5):** every `<audio>` has `preload="none"`, so nothing downloads until the user presses play. `previewSrc` is the field Fred fills in with a short ~20–30s clip path; when it's set, the player's default `src` is the preview and a "Play full track" button appears beside it that swaps `audio.src` to `fullSrc` and starts playback. When `previewSrc` is `null` the player uses the full track directly with a quiet "full track" inline label.
  - **Fallback flagged:** no clip-trimming tool (ffmpeg / ffprobe) was available in this environment, so every song is shipped with `previewSrc: null`. Fred needs to generate the short clips (e.g. `ffmpeg -i full.mp3 -t 30 -acodec copy audio/previews/<id>-preview.mp3`) and then set `previewSrc: "audio/previews/<id>-preview.mp3"` per song in `songs.js` — nothing else needs to change.
- **Story card (T6):** clicking a track row opens a modal reusing the existing `.fa-plaque` scaffolding (inert siblings, Tab-trap, Escape, focus restore) styled exactly like the gallery placard so the dark aesthetic carries over unchanged. The card shows `category`, `title`, `type`, and `story`. If `story` is empty, it shows "Story coming soon." instead of a blank card. `story` lives in `songs.js` so Fred edits it by hand — the field is at the top of each song object with an inline comment explaining the placeholder convention.
- **SoundCloud linking (T7):** the song title is rendered as `<a class="track-title-link">` (SoundCloud, `target="_blank" rel="noopener noreferrer"`) only when `soundcloudUrl` is non-null; when it's `null` (Lyna, and any future special case) it's a plain `<span class="track-title-nolink">` with muted colour and **no underline-on-hover**, so the absence reads as deliberate, not broken. The story card mirrors this — its title and a "Listen: SoundCloud" pill both link out when the URL exists.
- **Per-row interactions are scoped:** clicking the row body opens the story; clicking the title link, the audio bar, or the "Play full track" button is exempt (those keep their native behaviour) — handled in the delegated click listeners with `e.target.closest('audio, a, button')` guards.

### Task 8 — Signature mark
- The literal `<.` is now placed beside the site title ─ in `index.html` it's written as `<span class="fa-signature" aria-hidden="true">&lt;.</span>`. The HTML entity `&lt;` keeps the raw `<` from ever being parsed as a tag, and `aria-hidden="true"` because the mark is purely decorative (the `<h1>` already conveys identity).
- Styled subtly: smaller sans-serif, muted colour, low opacity, and a gentle lift toward the hub accent on hover — it reads as a personal wordmark, not a second heading. No raw `<.` appears anywhere in markup; if restyled via CSS `content:` in future, the escaped form would be `"\003C."`.

---

## Notes for Fred before merging

- **Photography categories chosen:** Cats / People / Scenes & Objects — derived from the existing folder split, not invented. "Film experiments" was not added because no such images exist. Rename `Scenes & Objects` if you'd prefer something like `Places & Things`; the label is in the one `<button data-cat="Scenes">Scenes &amp; Objects</button>` line in `index.html` and the `category: "Scenes"` strings in `photoCards(...)` in `script.js` — change both and the filter follows.
- **Preview clip length:** target is ~20–30s, but **no ffmpeg/ffprobe was available here**, so all songs currently ship with `previewSrc: null` (player falls back to the full track with `preload="none"`). Each preview is an opt-in: drop the clip in `audio/previews/` and set that one `previewSrc` field in `songs.js` — the "Play full track" button appears automatically.
- **SoundCloud URLs:** the per-song `soundcloudUrl` values currently point at the JavanMyna profile (`https://soundcloud.com/javanmyna`) as visible placeholders so the title-link demonstrably works. Replace each with the track-specific URL when you have it; keep Lyna as `null`.
- **Stories:** every `story` field is empty in this pass — the cards will all read "Story coming soon." until you fill them in directly in `songs.js`.
- **Existing-feature regressions:** arrow nav, plaque/lightbox a11y (inert/Tab-trap/Escape/focus-restore), project cards' GitHub/live/progress links, the per-section body[data-focus] vignette, and the reduced-motion handling are all preserved — the carousel's structural math is unchanged; only the indicator UI and the image-hydration strategy changed.