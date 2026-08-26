---
title: Writing Pages
subtitle: Every block this site understands
---

Plain markdown works: **bold**, *italic*, ~~struck~~, `code`, lists, > quotes, `---` rules, and tables. Dice and DCs — `2d6+1`, `DC 14` — are tagged automatically so they stand out mid-session.

A page is one file in `content/`, listed in `content/manifest.json`. The top of each file sets its name:

```
---
title: The Deep Stack
subtitle: Adventure Site I
---
```

## Custom blocks

Open with `:::name` and close with `:::` on its own line. Anything after the name on the opening line is the block's argument, and `|` splits it into parts.

| BLOCK | WHAT IT MAKES |
|---|---|
| `:::pitch` | Black pitch panel. The one-paragraph sell. |
| `:::read` | Read-aloud box. `:::read A LABEL` renames it. |
| `:::clue LABEL` | Clue box. A line starting `!!` becomes the big line. |
| `:::room 4 \| Name` | Keyed room entry. The number matches the map marker. |
| `:::npc Name \| descriptor` | Voice card. Write `WANT:`, `VOICE:`, `BREAK:`, `LINE:`. |
| `:::stat Name \| CR 2 \| AC 16 \| HP 45` | Stat block. A `>` line becomes the black "where it goes" bar. |
| `:::roll 1d6 \| Title` | Roll table. One line per result: `1-2 Something`. |
| `:::track` | Clocks. One `Label: 6` per line, drawn as boxes to tick. |
| `:::box plain \| TITLE` | Boxed callout. Kinds: `plain`, `accent`, `dark`, `red`, `gold`. |
| `:::beats` | Numbered beats with square markers. |
| `:::valve` | Pacing valves. Write `Label: text` per line. |
| `:::cols 2` | Two or three columns. |

A line of `+++` on its own forces a page break when printing.

**Images.** Drag a file onto the editor, or paste one from the clipboard, and it is embedded in the page. Or use a normal path: `![Caption](images/map.png)`

## Dungeon maps

A fenced `dungeon` block draws a real map. One character is one 5 ft square.

| CHAR | MEANING |
|---|---|
| `#` | solid rock |
| `.` | floor |
| `~` | water |
| `:` | rubble, difficult terrain |
| `=` | stairs |
| `+` | door |
| `S` | secret door, drawn in red |
| `0-9 A-Z` | floor with a numbered key marker |

```dungeon
#########
#1...+.2#
#...#...#
#..:#~~~#
#########
```

+++

## Printing

**Print…** opens the setup panel: paper size, margins, text size, and an ink-saver mode that hollows out the filled panels. The sheet on screen is a true preview — change the text size and you can see the session shrink onto fewer pages before you print anything.

Two buttons: **this page**, or **the whole book** with a page break between each.

:::box plain | IN THE BROWSER'S PRINT DIALOG
Turn **Background graphics** on, or the black panels and table headers come out white. Turn **Headers and footers** off to lose the URL and date. Then Save as PDF.
:::

Blocks never split across a page break — a stat block, a room, an NPC card, a roll table each stay whole, and headings stay attached to what follows them.

## Adding your own block

Two steps. In `assets/markup.js`:

```
Markup.block('omen', (arg, body, h) =>
  `<div class="omen"><b>${h.esc(arg)}</b>${h.md(body)}</div>`);
```

Then style `.omen` in `assets/press.css`. That is the whole extension point — `h.md()` renders markdown, `h.inline()` renders one line, `h.lines()` and `h.kv()` chop the body up for you.
