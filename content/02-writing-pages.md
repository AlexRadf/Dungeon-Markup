---
title: Writing Pages
kicker: REFERENCE
subtitle: Every block this press understands
number: R
head: REFERENCE
headright: WRITING PAGES
---

A page is one file in `content/`, listed in `content/manifest.json`. The front matter at the top sets the furniture: `title`, `subtitle`, `kicker` (the small red line above the title), `number` (the big grey numeral), `head` and `headright` (the running head, left and right).

**One `+++` on its own line ends a printed page and starts the next.** Pages here are designed, not flowed — what you see stacked in the preview is what comes out of the printer, and a page that runs long gets outlined in red so you can trim it before you print.

Plain markdown works: **bold**, *italic*, ~~struck~~, `code`, lists, `>` quotes, `---` rules, tables, images. Dice and DCs — 2d6+1, DC 14 — are set in mono automatically.

:::cols 2
| BLOCK | WHAT IT MAKES |
|---|---|
| `:::pitch` | Black panel. A `!!` line becomes the gold theme rule. |
| `:::read LABEL` | Rule-topped read-aloud, italic. |
| `:::clue LABEL` | Pink clue box. `!!` = the big line, `>>` = the red sub-line. |
| `:::beats` | Numbered beats with black square markers. |
| `:::npc Name \| descriptor` | Voice card. `WANT:` `VOICE:` `BREAK:` `LINE:` `USE:` |
| `:::stat Name \| CR 1/2 \| AC 12 \| HP 22 \| SPD 30 ft \| STR +2` | Compressed stat block. Any `KEY value` pairs. A `>` line is the black where-it-goes bar. |

| BLOCK | WHAT IT MAKES |
|---|---|
| `:::rooms \| AREA \| WHAT IS THERE` | Keyed area table. One line per area: `1 \| NAME \| text`. |
| `:::item Name \| type, rarity` | Magic item or plot object. |
| `:::puzzle Name \| premise` | Drop-in puzzle. `LOOKS:` `SOLVE:` `FAIL:` |
| `:::roll d6 \| TITLE` | Roll table. One line per result: `1-2 Something`. |
| `:::track` | Clocks. `Label: 6` per line, drawn as boxes to tick. |
| `:::valve` | Pacing valves. `Label: text` per line. |
| `:::box plain \| TITLE` | Callout. Kinds: `plain`, `gold`, `red`, `dark`. |
| `:::cols 2` | Two or three columns. Blocks nest inside. |
:::

+++

### Dungeon maps

A fenced `dungeon` block draws a real map, one character per 5 ft square. Text after the word `dungeon` becomes the caption.

:::cols 2
```dungeon 5 FT GRID · A WORKED EXAMPLE
#############
#1...+.2....#
#...##...####
#..:##~~~~#S#
#####.....#.#
#####..3..#4#
#############
```

| CHAR | MEANING |
|---|---|
| `#` | solid rock |
| `.` | floor |
| `~` | water |
| `:` | rubble, difficult terrain |
| `=` | stairs |
| `+` | door |
| `S` | secret door, drawn in red |
| `0-9 A-Z` | floor with a keyed marker |
:::

### Printing

**Print…** sets paper, margins, text size and an ink-saver mode that hollows out the filled panels, then prints the current page or the whole book. The sheet on screen is a true page preview at the same point size, so what fits, fits.

:::box plain | IN THE BROWSER'S PRINT DIALOG
Turn **Background graphics** on, or the black panels and table headers come out white. Turn **Headers and footers** off to lose the URL and date. Then Save as PDF.
:::

The house sets body copy at 8.2pt, which is what the booklet uses. It is dense on purpose: a session should be one spread you can take in at a glance, not four pages you leaf through at the table.

### The fonts

TeX Gyre Heros Cn for display, Lora for body, DejaVu Sans Mono for labels — all three bundled as subset WOFF2 in `assets/fonts`, about 160 KB total. Nothing is fetched from a network, so the page prints identically on any machine, offline, forever.

### Adding a block

Two steps. In `assets/markup.js`:

```
Markup.block('omen', (arg, body, h) =>
  `<div class="omen"><b>${h.esc(arg)}</b>${h.md(body)}</div>`);
```

Then style `.omen` in `assets/press.css`. Helpers: `h.md()` renders markdown, `h.inline()` one line, `h.esc()` escapes, `h.lines()` splits and drops blanks, `h.kv()` parses `KEY: value` lines.

:::valve
Writing in your editor: edit `content/*.md`, refresh. The files are the source of truth.
Writing in the browser: Edit (Ctrl/Cmd+E), then Save .md (Ctrl/Cmd+S) and commit the file.
:::
