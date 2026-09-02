---
title: Writing Pages
kicker: REFERENCE
subtitle: Every block this press understands
number: R
head: REFERENCE
headright: WRITING PAGES
---

A page is one file in `content/`, listed in `content/manifest.json`. The front matter at the top sets the furniture: `title`, `subtitle`, `kicker` (the small red line above the title), `number` (the big grey numeral), `head` and `headright` (the running head, left and right). **Page…** in the toolbar (Ctrl/Cmd+I, or double-click the masthead) edits all of it, including the file name; **New** builds a page from the same form.

**One `+++` on its own line ends a printed page and starts the next.** Pages here are designed, not flowed — what you see stacked in the preview is what comes out of the printer, and a page that runs long gets outlined in red so you can trim it before you print.

Plain markdown works: **bold**, *italic*, ~~struck~~, `code`, lists, `>` quotes, `---` rules, tables, images. Dice and DCs — 2d6+1, DC 14 — are set in mono automatically.

| BLOCK | WHAT IT MAKES |
|---|---|
| `:::pitch` | Black panel. A `!!` line becomes the gold theme rule. |
| `:::read LABEL` | Rule-topped read-aloud, italic. |
| `:::clue LABEL` | Pink clue box. `!!` = the big line, `>>` = the red sub-line. |
| `:::node A \| Name \| kind \| start` | One brief node. `-> B text` is a clue leading to node B. The badge counts the clues pointing here, and turns red under three. |
| `:::web LABEL` | Every node on the page, drawn as a web and audited against the three clue rule. |
| `:::reveal Conclusion` | A revelation list: the clues that add up to one conclusion, counted. |
| `:::beats` | Numbered beats with black square markers. |
| `:::npc Name \| descriptor` | Voice card. `WANT:` `VOICE:` `BREAK:` `LINE:` `USE:` |
| `:::stat Name \| CR 1/2 \| AC 12 \| HP 22 \| SPD 30 ft \| STR +2` | Compressed stat block. All six abilities always print. A `>` line is the black where-it-goes bar. |
| `:::rooms \| AREA \| WHAT IS THERE` | Keyed area table. One line per area: `1 \| NAME \| text`. |
| `:::item Name \| type, rarity` | Magic item or plot object. |
| `:::puzzle Name \| premise` | Drop-in puzzle. `LOOKS:` `SOLVE:` `FAIL:` |
| `:::roll d6 \| TITLE` | Roll table. One line per result: `1-2 Something`. |
| `:::track` | Clocks. `Label: 6` per line, drawn as boxes to tick. |
| `:::valve` | Pacing valves. `Label: text` per line. |
| `:::box plain \| TITLE` | Callout. Kinds: `plain`, `gold`, `red`, `dark`. |
| `:::cols 2` | Two or three columns. Blocks nest inside. |
| `:::secrets` | Ten things they can learn, in any order, each with a box to tick. |
| `:::scenes LABEL` | What might happen, deliberately unordered. |
| `:::place Name \| one line` | A location and the three details you say aloud. |

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

### Stat blocks

The opening line is the whole defensive line: a name, then any number of `KEY value` pairs split by `|`. The six ability modifiers are lifted out of those pairs and always printed as their own row, in order, whether or not you gave them — an ability you leave out prints `+0`, which is what a stat block means by silence.

In the body, a line of `SHOUTY KEY: value` becomes one compact keyed row — `SAVES`, `SKILLS`, `SENSES`, `RESIST`, `LANG`, and `SPELLS`. Use `SPELLS` to compress a caster into a single line instead of a spell list: the save DC and attack bonus, then what they actually cast, by frequency.

:::stat Proctor Sabbath | CR 2 | AC 12 | HP 33 | SPD 30 ft | STR +0 | DEX +2 | CON +1 | INT +3 | WIS +1 | CHA +2
SAVES: INT +5, WIS +3
SPELLS: DC 13, +5 -- at will *mage hand*, *minor illusion* -- 2/day *hold person*, *silence* -- 1/day *counterspell*
**Invigilate.** Anyone who lies within 30 ft is marked. Sabbath does not say so.
**No proctor may assist a candidate.** He will not act to save them, and it costs him something.
> Any exam · fights only if the paperwork says he may
:::

The opening line is one line, however long it gets. Everything after it is the body:

```
:::stat Wisp | CR 1 | AC 13 | HP 18 | SPD fly 40 ft | STR -4 | DEX +3 | CON +0 | INT +1 | WIS +2 | CHA +3
SPELLS: DC 12, +4 -- at will *dancing lights* -- 1/day *sleep*
**Fade.** Invisible in bright light, and knows it.
> Area 3 · never fights, only leads
:::
```

+++

### The fonts

TeX Gyre Heros Cn for display, Lora for body, DejaVu Sans Mono for labels — all three bundled as subset WOFF2 in `assets/fonts`, about 160 KB total. Nothing is fetched from a network, so the page prints identically on any machine, offline, forever.

### Prepping the lazy way

`content/03-the-god-is-still-dying.md` is laid out on Sly Flourish's prep spine rather than a plot: a **strong start** you read cold, **potential scenes** that are explicitly not a sequence, **ten secrets and clues** tied to no room in particular, and **three fantastic locations** with three evocative details each. `:::secrets`, `:::scenes` and `:::place` exist for exactly those four things.

The tick boxes on `:::secrets` are the point — a secret lands wherever the table wanders into it, and you cross it off. Nothing on that list says where it is found.

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

+++

### Nodes and the three clue rule

A scenario built this way is not a sequence. It is a handful of nodes — a place, a person, a group, an event — joined by the clues that lead from one to the next, and the players pick the order. The Alexandrian's rule is the part this press actually checks: **for every node they have to reach, write three clues pointing at it.** They will miss the first, misread the second, and follow the third.

The opening line is `ID | Name | kind`, and the word `start` anywhere in it marks where the session opens — a start node is exempt, since nothing has to lead there. A `-> ID text` line in the body is a lead. Everything else is ordinary markdown, so a node stays as brief as you leave it.

```
:::node A | The Burnt Shop | place | start
-> B  A name in the ash: the shop's own insurer.
:::
```

:::web A WORKED WEB -- FOUR NODES, THREE WAYS INTO EACH
:::

:::cols 2
:::node A | The Burnt Shop | place | start
-> B  A name in the ash: the shop's own insurer.
-> C  Lamp oil, in a shop that never sold oil.
-> D  A key that fits no door on this street.
:::

:::node B | Auber the Insurer | person
-> C  He insured the oil, and not the building.
-> D  He holds the deed to the warehouse.
:::

:::node C | The Oil Dock | place
-> B  The manifest is signed in his hand.
-> D  Barrels went to a warehouse, not a ship.
:::

:::node D | The Wet Warehouse | place
-> B  His coat is hanging in the office.
-> C  Empty barrels, still wet, stacked to the roof.
:::
:::

`:::web` draws every node on the page and counts the arrows. A node with fewer than three clues pointing at it gets a dashed ring in the drawing, a red count on its card, and a line under the diagram naming it — a page of prep telling you where the session will stall, before you run it. `:::reveal` is the same arithmetic for a conclusion rather than a place:

:::reveal Auber burned his own shop
- B: He insured the oil and not the building.
- C: The dock manifest is in his own hand.
- D: His coat is hanging in the warehouse office.
:::

A clue line that begins with a node's letter is tagged with it. The web is one page wide — a page is scanned for its nodes before anything on it renders, so `:::web` can sit above the nodes it draws, and nodes on another page are another web. `content/04-nobody-drowned.md` is a five-node investigation run the same way.
