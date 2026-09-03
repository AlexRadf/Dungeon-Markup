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

`content/b00-the-board.md` and `content/b01-*` to `b18-*` are The Board: eighteen
jobs pinned up outside the Bursar's office at Eldoria University, levels 1–5, two to
four hours each. **Every job is exactly two sheets**, in the same order, so you can
find anything mid-session without reading:

- **the night** — the pitch and its theme line, the opening shot, the shape of the
  job, and the secrets;
- **the crunch** — trouble, the ways out, the doom clock, and every `:::stat`,
  `:::puzzle` and `:::roll` the table needs.

The notice is on neither sheet. It is on the job's **quest card** (see below),
because what the players are allowed to know before they set off is a different
document from the one the GM runs off.

The shape of a job comes in three kinds, because a node web is the wrong tool for a
siege and a map is the wrong tool for a mystery:

| Kind | Jobs | What is on it |
|---|---|---|
| **web** | 2, 4, 10, 11, 17 | The investigations. Five `:::node` blocks and three clues into each, drawn and audited by `:::web` |
| **map** | 5, 6, 7, 8, 12, 16 | The interior sites, including all three dungeons. A ` ```dungeon ` grid and `:::rooms` keyed areas |
| **beats** | 1, 3, 9, 13, 14, 15, 18 | The ones with a shape — a climb, a ten-round clock, an itinerary. `:::beats` and `:::place` blocks |

Jobs **15–18** are the level ones — two hours, posted by a person rather than a
department, and nothing in them is lying about anything. They pay badly, they end
well, and they are where you start a table that has never played before.

### The quest board

`content/q00-the-quest-board.md` is all eighteen jobs as cards, two to a sheet.
Print it, cut each card out on the solid line, and fold it along the dashed centre
**with the printed side facing out** — a single-sided sheet folded the other way
puts both panels on the inside, which is a lesson everybody learns once.

| Panel | What is on it |
|---|---|
| **Front** | The notice exactly as it hangs on the board, then genre, theme, where, who posted it, what it pays, the level and the difficulty |
| **Back** | The handouts, and nothing else |

A card's **theme** is five words at most and describes what to expect rather than
what the job means: *chase*, *torch counting*, *nobody fights*.

The back holds one or two handouts, and a handout is one of two things:

- **A document** — a ballot, a duty log, a letter, a lease — is printed as it
  reads, so you can cut the back up and hand the pieces over as they stand.
- **An illustration** cannot be, so it gets an empty dashed frame with room to draw
  in. Its brief drops to the foot of the panel, because a brief printed inside the
  box is a brief you would have to draw over. The frame takes whatever the documents
  leave, and never less than 26 mm.

Either way the guidance runs along the foot: what the handout is for, and when to
put it in somebody's hand.

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
| `:::quest Title \| kicker` | A fold-out quest card. SHOUTY keys make the front's data rows, `LEVEL` and `DIFFICULTY` go in the strip at the foot, and a `>> TITLE` line starts a section on the back |

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

### Quest cards

`:::quest` sets one job as a card to cut out and fold. Two panels and a crease: the
front is the notice and the numbers, the back is the handouts.

```markdown
:::quest Walk Me Home | JOB 15 · THE BOARD
GENRE: escort
THEME: walking, talking, nobody fights
WHERE: Chemistry to the east gate, two a.m.
POSTED: D. Ashgrove, night technician
PAYS: 12 gp and a hot meal
LEVEL: 1
DIFFICULTY: Easy
The notice, in the voice of whoever pinned it up.
>> THE SECURITY LOG, EAST GATE
**02:14** Escorted D. Ashgrove to east gate. No incident. **02:16** As above.
>> PEN & INK -- THE PARK AT TWO
ART: the physics path, unlit, and a lamp forty feet back with nobody holding it
!! Cut the log out and hand it over the first time anybody talks to Security.
:::
```

A **SHOUTY KEY: value** line becomes a row in the front's data grid, in the order
you write it, except `LEVEL` and `DIFFICULTY`, which are lifted into the black strip
along the foot. Everything else before the first `>>` is the notice.

A `>> TITLE` line starts one handout on the back. Inside it:

| Line | What it does |
|---|---|
| `ART: brief` | Makes this handout an empty frame to draw in. The brief prints at the foot of the panel instead of inside the box |
| `![alt](src)` | Fills that frame with a picture — paste or drop one in the editor and it lands here |
| anything else | The document, printed as it reads, so the back can be cut up and handed over |
| `!!` | The guidance, along the foot of the panel |

The card is a fixed height in millimetres so it stays the same object whatever text
size the booklet is set to — which means text can outgrow a panel without the page
noticing, so a card whose panels have overflowed is outlined in red the same way an
overfull page is. Two cards fit on a sheet. **Fold printed side out.**

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

### Reordering pages

The order of the book is the order of the **Pages** list. Drag a page up or down it,
or focus a page and press **Alt + ↑ / ↓** to move it (plain ↑ / ↓ just walk the
list). The page you were reading stays the page you are reading, wherever it lands.

Like a rename, the new order is a local preference until you commit it —
**Download manifest.json** writes out `content/manifest.json` exactly as the app is
showing the book, ready to drop back into `content/`.

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
content/q00-*.md      the quest board — every job as a fold-out card
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
