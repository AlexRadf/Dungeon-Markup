# Dungeon Markup

A static site for writing one-night D&D adventures in plain markdown and printing
them as a table-ready booklet. No build step, no dependencies, no server — a few
files and a folder of `.md`.

The house style is taken from the Eldoria GM booklet: **TeX Gyre Heros Cn** for
display, **Lora** for body, **DejaVu Sans Mono** for labels, black ink with a red
accent and a gold second. All three fonts are bundled as subset WOFF2 (~160 KB
total), so nothing is fetched at runtime and the page prints identically on any
machine, offline.

## Run it

GitHub Pages: push the repo, then **Settings → Pages → Source: Deploy from a
branch**, pick the branch and `/ (root)`.

Locally, serve the folder — opening `index.html` off disk will not work, because
the browser blocks reading `content/*.md` from `file://`:

```
python3 -m http.server 8000
```

## Pages are designed, not flowed

One `.sheet` is one printed page. A line of `+++` ends a page and starts the next.
The preview stacks the pages exactly as they will print, at the same point size on
the same paper — and a page whose content runs past the paper is outlined in red
with a warning, so you trim it before you print rather than after.

Each page carries a running head (left and right) and a folio, set in front matter:

```markdown
---
title: The Matriculation Delve
kicker: DUNG 101 · SESSION 1 OF 10
subtitle: The Registry cellar · Level 1 → 2 · Two hours
number: 01
head: SESSION 1 OF 10
headright: DUNG 101
---
```

`content/01-matriculation-delve.md` is a worked two-page example: page 1 is the
session — pitch, opening shot, beats, cast, the clue, pacing valves — and page 2 is
the crunch — map, keyed areas, compressed stat blocks, a drop-in puzzle, hazards, a
d6 complication table and the loot.

## Writing

Normal markdown works: `**bold**`, `*italic*`, `~~struck~~`, `` `code` ``, lists,
`>` quotes, `---` rules, tables, images. Dice and DCs (`2d6+1`, `DC 14`) are set in
mono automatically.

### Blocks

Open with `:::name`, close with `:::` on its own line. Anything after the name is
the argument; `|` splits it into parts.

| Block | Makes |
|---|---|
| `:::pitch` | Black panel. A `!!` line becomes the gold theme rule |
| `:::read LABEL` | Rule-topped read-aloud, italic |
| `:::clue LABEL` | Pink clue box. `!!` is the big line, `>>` the red sub-line |
| `:::beats` | Numbered beats with black square markers |
| `:::npc Name \| descriptor` | Voice card — `WANT:` `VOICE:` `BREAK:` `LINE:` `USE:` |
| `:::stat Name \| CR 1/2 \| AC 12 \| HP 22 \| SPD 30 ft \| STR +2` | Compressed stat block; any `KEY value` pairs. A `>` line is the black where-it-goes bar |
| `:::rooms \| AREA \| WHAT IS THERE` | Keyed area table — `1 \| NAME \| text` per line |
| `:::item Name \| type, rarity` | Magic item or plot object |
| `:::puzzle Name \| premise` | Drop-in puzzle — `LOOKS:` `SOLVE:` `FAIL:` |
| `:::roll d6 \| TITLE` | Roll table — `1-2 Something` per line |
| `:::track` | Clocks — `Label: 6` per line, drawn as boxes to tick |
| `:::valve` | Pacing valves — `Label: text` per line |
| `:::box plain \| TITLE` | Callout. Kinds: `plain`, `gold`, `red`, `dark` |
| `:::cols 2` | Two or three columns; blocks nest inside |

### Dungeon maps

A fenced ` ```dungeon ` block is drawn as a real SVG map, one character per 5 ft
square. Text after the word `dungeon` becomes the caption.

`#` rock · `.` floor · `~` water · `:` rubble · `=` stairs · `+` door ·
`S` secret door · `0-9`/`A-Z` a keyed marker.

### The in-browser editor

**Edit** (Ctrl/Cmd+E) opens a live editor beside the page with chips that insert
each block. Edits are kept as local drafts in `localStorage`; **Save .md**
(Ctrl/Cmd+S) downloads the file so you can commit it back to `content/`. **Revert
this page** throws the draft away. The files in the repo are always the source of
truth.

## Printing

**Print…** sets paper (A4 / Letter / A5), margins, text size and an ink-saver mode
that hollows out the filled panels, then prints the current page or the whole book.
Body copy defaults to 8.2pt — the booklet's own size, dense on purpose, so a
session is one spread you take in at a glance.

In the browser's own print dialog, turn **Background graphics** on (or the filled
panels come out white) and **Headers and footers** off.

Blocks never split across a page break, and headings stay attached to what follows.

### Why the old print was broken

The app is a full-height flex layout with a scrolling preview pane. A browser cannot
paginate the inside of a scroll container, so printing produced one clipped page no
matter what `@media print` said. The fix is to not print the app at all: `app.js`
mirrors the pages into `#print-root`, a plain static `<div>` hanging directly off
`<body>`, and `assets/print.css` hides the app entirely.

Each printed sheet is pinned to `--print-fill` — the paper height minus the `@page`
margins — so the folio sits at the foot of the page without a stray blank sheet
after it.

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
assets/press.css      palette, type, page and block styles
assets/print.css      print-only rules (loaded with media="print")
assets/markup.js      parser, block registry, dungeon map renderer
assets/app.js         state, storage, editor, print pipeline
assets/fonts/         subset WOFF2 + licences
content/manifest.json page order
content/*.md          the adventure
```

Every colour, font and size lives in the `:root` block at the top of
`assets/press.css`. Page typography is sized in `em` off `--sheet-size`, so one
value scales the whole booklet.

## Fonts and licences

- **TeX Gyre Heros Cn** — GUST Font License (`assets/fonts/LICENSE-TeXGyreHeros.txt`)
- **Lora** — SIL Open Font License 1.1 (`assets/fonts/LICENSE-Lora.txt`)
- **DejaVu Sans Mono** — Bitstream Vera / Arev licence (`assets/fonts/LICENSE-DejaVu.txt`)

All three are subset to Latin plus the punctuation the house style uses. To
re-subset after changing the character set, see `fontTools.subset`.
