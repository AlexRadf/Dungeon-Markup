# Dungeon Markup

A static site for writing one-night D&D adventures in plain markdown and printing
them as a table-ready booklet. No build step, no dependencies, no server — three
files and a folder of `.md`.

The house style is deliberately spare: black ink, one red accent, condensed caps,
monospace labels. Everything is sized off one variable, so a session can be dialled
down to fit fewer pages without touching the writing.

## Run it

GitHub Pages: push this repo, then **Settings → Pages → Source: Deploy from a
branch**, pick the branch and `/ (root)`. That's it.

Locally, serve the folder — opening `index.html` off disk will not work, because
the browser blocks reading `content/*.md` from `file://`:

```
python3 -m http.server 8000
```

## Writing

One adventure page is one file in `content/`, listed in `content/manifest.json`:

```markdown
---
title: The Deep Stack
subtitle: Adventure Site I · Beneath the Great Hall
---

Ordinary markdown, plus the blocks below.
```

Normal markdown works: `**bold**`, `*italic*`, `~~struck~~`, `` `code` ``, lists,
`>` quotes, `---` rules, tables, images. Dice and DCs (`2d6+1`, `DC 14`) are tagged
in monospace automatically so they can be found at a glance mid-session. A line of
`+++` forces a page break.

### Blocks

Open with `:::name`, close with `:::` on its own line. Anything after the name is
the argument; `|` splits it into parts.

| Block | Makes |
|---|---|
| `:::pitch` | Black pitch panel — the one-paragraph sell |
| `:::read` | Read-aloud box |
| `:::clue LABEL` | Clue box; a `!!` line becomes the big line |
| `:::room 4 \| Name` | Keyed room entry matching a map marker |
| `:::npc Name \| descriptor` | Voice card — `WANT:`, `VOICE:`, `BREAK:`, `LINE:` |
| `:::stat Name \| CR 2 \| AC 16 \| HP 45` | Stat block; a `>` line becomes the "where it goes" bar |
| `:::roll 1d6 \| Title` | Roll table — one line per result, `1-2 Something` |
| `:::track` | Clocks — `Label: 6` per line, drawn as boxes to tick |
| `:::box plain \| TITLE` | Callout. Kinds: `plain`, `accent`, `dark`, `red`, `gold` |
| `:::beats` | Numbered beats |
| `:::valve` | Pacing valves — `Label: text` per line |
| `:::cols 2` | Two or three columns |

### Dungeon maps

A fenced ` ```dungeon ` block is drawn as a real SVG map, one character per 5 ft
square: `#` rock, `.` floor, `~` water, `:` rubble, `=` stairs, `+` door,
`S` secret door, `0-9`/`A-Z` a keyed marker.

```
#########
#1...+.2#
#...#...#
#########
```

### The in-browser editor

**Edit** (Ctrl/Cmd+E) opens a live editor beside the page, with a row of chips that
insert each block. Edits are kept as local drafts in `localStorage`; **Save .md**
(Ctrl/Cmd+S) downloads the file so you can commit it back to `content/`. **Revert
this page** throws the draft away and goes back to the committed file. The files in
the repo are always the source of truth.

## Printing

**Print…** opens paper size, margins, text size and an ink-saver toggle, then prints
either the current page or the whole book. The sheet on screen is a true page
preview: change the text size and you can watch the session shrink onto fewer pages
before printing anything.

In the browser's own print dialog, turn **Background graphics** on (or the filled
panels come out white) and **Headers and footers** off.

Blocks never split across a page break, and headings stay attached to what follows
them.

### Why the old print was broken

The app is a full-height flex layout with a scrolling preview pane. A browser cannot
paginate the inside of a scroll container, so printing produced one clipped page no
matter what `@media print` said. The fix is to not print the app at all: `app.js`
mirrors the pages into `#print-root`, a plain static `<div>` hanging directly off
`<body>`, and `assets/print.css` hides the app entirely. That also makes "print the
whole book" a one-line change instead of an impossibility.

## Adding a block

Two steps. In `assets/markup.js`:

```js
Markup.block('omen', (arg, body, h) =>
  `<div class="omen"><b>${h.esc(arg)}</b>${h.md(body)}</div>`);
```

Then style `.omen` in `assets/press.css`. Helpers on `h`: `h.md(body)` renders
markdown, `h.inline(text)` renders one line, `h.esc(text)` escapes, `h.lines(body)`
splits and drops blanks, `h.kv(body)` parses `KEY: value` lines.

## Layout

```
index.html            app shell
assets/press.css      design tokens + screen and page styles
assets/print.css      print-only rules (loaded with media="print")
assets/markup.js      parser, block registry, dungeon map renderer
assets/app.js         state, storage, editor, print pipeline
content/manifest.json page order
content/*.md          the adventure
```

Every colour, font and size lives in the `:root` block at the top of
`assets/press.css`. Page typography is sized in `em` off `--sheet-size`, so one
value scales the whole booklet.
