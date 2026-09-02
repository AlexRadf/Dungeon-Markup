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

`content/03-the-god-is-still-dying.md` is a level 15 one-shot laid out on Sly
Flourish's prep spine instead of a plot: a strong start, unordered potential scenes,
ten secrets and clues tied to no room, three fantastic locations with three
evocative details each, then the monsters and the one decision the session turns on.

`content/04-nobody-drowned.md` is a five-node investigation: no scene order, five
places and people, and three clues pointing at every one of them.

`content/b00-the-board.md` and `content/b01-*` to `b14-*` are The Board: fourteen
jobs pinned up outside the Bursar's office at Eldoria University, levels 1–5, two to
four hours each. Every job is three sheets in the same order, so you can find
anything mid-session without reading:

- **the board** — the notice as posted, what they hear on the way there, the
  handouts to cut free, and the secrets;
- **the web** — where it starts, then five `:::node` blocks with three clues into
  every one of them, drawn and audited by `:::web`;
- **the crunch** — trouble, the four-step doom clock, the ways out, and every
  `:::stat`, `:::puzzle` and `:::roll` the table needs.

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
| `:::node A \| Name \| kind \| start` | One brief node. `-> B text` is a clue leading to node B. The badge counts the clues pointing here, and turns red under three |
| `:::web LABEL` | Every node on the page, drawn as a web and audited against the three clue rule |
| `:::reveal Conclusion` | A revelation list — the clues that add up to one conclusion, counted |
| `:::beats` | Numbered beats with black square markers |
| `:::npc Name \| descriptor` | Voice card — `WANT:` `VOICE:` `BREAK:` `LINE:` `USE:` |
| `:::stat Name \| CR 1/2 \| AC 12 \| HP 22 \| SPD 30 ft \| STR +2` | Compressed stat block; any `KEY value` pairs. All six abilities always print. A `>` line is the black where-it-goes bar |
| `:::rooms \| AREA \| WHAT IS THERE` | Keyed area table — `1 \| NAME \| text` per line |
| `:::item Name \| type, rarity` | Magic item or plot object |
| `:::puzzle Name \| premise` | Drop-in puzzle — `LOOKS:` `SOLVE:` `FAIL:` |
| `:::roll d6 \| TITLE` | Roll table — `1-2 Something` per line |
| `:::track` | Clocks — `Label: 6` per line, drawn as boxes to tick |
| `:::valve` | Pacing valves — `Label: text` per line |
| `:::box plain \| TITLE` | Callout. Kinds: `plain`, `gold`, `red`, `dark` |
| `:::cols 2` | Two or three columns; blocks nest inside |
| `:::secrets` | Ten things they can learn, in any order, each with a box to tick |
| `:::scenes LABEL` | What might happen, deliberately unordered |
| `:::place Name \| one line` | A location and the three details you say aloud |

### Stat blocks

The opening line is the whole defensive line: a name, then any number of
`KEY value` pairs split by `|`. The six ability modifiers are lifted out of those
pairs and always printed as their own row, in order, whether or not you supplied
them — an ability you leave out prints `+0`, which is what a stat block means by
silence.

In the body, a line of `SHOUTY KEY: value` becomes one compact keyed row: `SAVES`,
`SKILLS`, `SENSES`, `RESIST`, `LANG`, and `SPELLS`. Use `SPELLS` to compress a
caster into a single line instead of a spell list — the save DC and attack bonus,
then what they actually cast, by frequency.

```
:::stat Wisp | CR 1 | AC 13 | HP 18 | SPD fly 40 ft | STR -4 | DEX +3 | CON +0 | INT +1 | WIS +2 | CHA +3
SPELLS: DC 12, +4 -- at will *dancing lights* -- 1/day *sleep*
**Fade.** Invisible in bright light, and knows it.
> Area 3 · never fights, only leads
:::
```

### Nodes and the three clue rule

A scenario built this way is not a sequence. It is a handful of nodes — a place,
a person, a group, an event — joined by the clues that lead from one to the next,
and the players pick the order. The Alexandrian's rule is the part this press
actually checks: **for every node they have to reach, write three clues pointing
at it.** They will miss the first, misread the second, and follow the third.

```markdown
:::node A | The Silent Mill | place | start
The wheel still turns. Nobody has ground grain here in a year.
-> B  The ledger names a buyer, paid in Karrn silver
-> C  Bootprints in the flour, too big for a man
:::
```

The opening line is `ID | Name | kind`, and the word `start` anywhere in it marks
where the session opens — a start node is exempt from the rule, since nothing has
to lead there. A `-> ID text` line in the body is a lead: a clue found here that
points at node ID. Everything else is ordinary markdown, so a node stays as brief
as you leave it.

`:::web` draws every node on the page and counts the arrows. A node with fewer
than three clues pointing at it gets a dashed ring in the drawing, a red count on
its card, and a line under the diagram naming it. That red is the whole feature:
a page of prep telling you where the session will stall, before you run it. The
same lines report a node that leads nowhere, a lead to an ID that does not exist,
and an ID declared twice.

`:::reveal` is the same arithmetic for a conclusion rather than a place — the
thing they have to work out, and every clue that gets them there:

```markdown
:::reveal The mill is a front for the Karrn silver trade
- A: The ledger, if anybody reads the last page
- B: Vex brags about the mill when drunk
- D: Assay marks on the ingots
:::
```

A clue line beginning with a node's ID is tagged with it; the tally says so when
there are fewer than three.

The web is one page wide. A page is scanned for its `:::node` blocks before
anything on it renders, so `:::web` can sit above the nodes it draws and every
card knows how many clues point at it — and nodes on another page are another
web. A `:::node` quoted inside a ``` fence is a code sample, not a node.

### Dungeon maps

A fenced ` ```dungeon ` block is drawn as a real SVG map, one character per 5 ft
square. Text after the word `dungeon` becomes the caption.

`#` rock · `.` floor · `~` water · `:` rubble · `=` stairs · `+` door ·
`S` secret door · `0-9`/`A-Z` a keyed marker.

### Page setup

**Page…** in the toolbar (Ctrl/Cmd+I, or double-click a page's masthead) edits the
current page's front matter — title, kicker, number, subtitle, and both halves of
the running head — plus the file name it saves under. **New** builds a page from the
same form. Renaming a page is a local change: update `content/manifest.json` to
match before you commit.

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
