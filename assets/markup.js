/* ============================================================
   DUNGEON MARKUP — the language
   ------------------------------------------------------------
   Markup.render(src)      -> HTML for a body of markdown
   Markup.parseDoc(text)   -> {title, subtitle, md} (front matter)
   Markup.renderDoc(doc)   -> HTML including the title block
   Markup.block(name, fn)  -> register a new :::block

   ADDING A BLOCK is two steps:
     1. Markup.block('name', (arg, body, h) => `<div class="x">…</div>`)
     2. a `.x{}` rule in assets/press.css

   `arg` is everything after the block name on the opening line,
   `body` is the raw text up to the closing `:::`, and `h` holds
   helpers: h.md(body) renders markdown, h.inline(text) renders a
   single line, h.esc(text) escapes, h.lines(body) splits and
   drops blanks, h.kv(body) parses `KEY: value` lines.
   ============================================================ */
window.Markup = (function(){
'use strict';

/* ---------- dungeon map renderer ---------- */
const INK = '#17130E', ACCENT = '#A32323';
const FLOOR = new Set(['.','~',':','=','+','S']);
const isLabel = c => /[0-9A-Z]/.test(c);
const walkable = c => FLOOR.has(c) || isLabel(c);

function drawDungeon(src){
  const rows = src.replace(/\t/g,'  ').split('\n').filter(r=>r.length);
  if(!rows.length) return '<div class="err">dungeon: no grid</div>';
  const h = rows.length, w = Math.max(...rows.map(r=>r.length));
  const g = rows.map(r=>r.padEnd(w,'#').split(''));
  const C = 14, W = w*C, H = h*C;
  const at = (x,y) => (y>=0&&y<h&&x>=0&&x<w) ? g[y][x] : '#';
  const on = (x,y) => walkable(at(x,y));
  let s = `<svg class="dmap" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dungeon map">`;
  s += `<rect width="${W}" height="${H}" fill="#fff"/>`;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const c = at(x,y); if(!walkable(c)) continue;
    const fill = c==='~' ? '#D9E3E6' : c===':' ? '#EFEADC' : '#fff';
    s += `<rect x="${x*C}" y="${y*C}" width="${C}" height="${C}" fill="${fill}"/>`;
    s += `<rect x="${x*C}" y="${y*C}" width="${C}" height="${C}" fill="none" stroke="#BDB8AE" stroke-width=".45"/>`;
    if(c===':') s += `<path d="M${x*C+3} ${y*C+10}l3-4M${x*C+7} ${y*C+11}l4-5" stroke="${INK}" stroke-width=".6" fill="none"/>`;
    if(c==='~') s += `<path d="M${x*C+2.5} ${y*C+7.5}q2.5-2 5 0t5 0" stroke="#6E8A96" stroke-width=".8" fill="none"/>`;
    if(c==='='){ for(let k=1;k<5;k++){const yy=y*C+k*C/5; s += `<line x1="${x*C+1.5}" y1="${yy}" x2="${x*C+C-1.5}" y2="${yy}" stroke="${INK}" stroke-width=".7"/>`;} }
  }
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    if(!on(x,y)) continue;
    const X=x*C, Y=y*C, X2=X+C, Y2=Y+C, sw=2;
    if(!on(x,y-1)) s+=`<line x1="${X}" y1="${Y}" x2="${X2}" y2="${Y}" stroke="${INK}" stroke-width="${sw}"/>`;
    if(!on(x,y+1)) s+=`<line x1="${X}" y1="${Y2}" x2="${X2}" y2="${Y2}" stroke="${INK}" stroke-width="${sw}"/>`;
    if(!on(x-1,y)) s+=`<line x1="${X}" y1="${Y}" x2="${X}" y2="${Y2}" stroke="${INK}" stroke-width="${sw}"/>`;
    if(!on(x+1,y)) s+=`<line x1="${X2}" y1="${Y}" x2="${X2}" y2="${Y2}" stroke="${INK}" stroke-width="${sw}"/>`;
  }
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const c=at(x,y); if(c!=='+'&&c!=='S') continue;
    const col = c==='S' ? ACCENT : INK;
    const horiz = on(x-1,y)&&on(x+1,y);
    if(horiz) s+=`<rect x="${x*C+C*.34}" y="${y*C+1.5}" width="${C*.32}" height="${C-3}" fill="#fff" stroke="${col}" stroke-width="1.2"/>`;
    else s+=`<rect x="${x*C+1.5}" y="${y*C+C*.34}" width="${C-3}" height="${C*.32}" fill="#fff" stroke="${col}" stroke-width="1.2"/>`;
  }
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const c=at(x,y); if(!isLabel(c)) continue;
    const cx=x*C+C/2, cy=y*C+C/2;
    s+=`<circle cx="${cx}" cy="${cy}" r="${C*.42}" fill="${INK}"/>`;
    s+=`<text x="${cx}" y="${cy+3.3}" text-anchor="middle" font-family="TeX Gyre Heros Cn,Arial Narrow,sans-serif" font-weight="700" font-size="9.5" fill="#fff">${c}</text>`;
  }
  return s+'</svg>';
}

/* ---------- inline ---------- */
const esc = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const SEP = '\u0001'; // sentinel: never appears in real prose

function inline(t){
  const keep = [];
  const park = html => SEP + (keep.push(html) - 1) + SEP;
  let s = esc(t == null ? '' : t);

  // park anything whose innards must not be rewritten again
  s = s.replace(/`([^`]+)`/g, (m,c) => park(`<code>${c}</code>`));
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m,a,u) => park(`<img src="${u}" alt="${a}">`));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m,a,u) => park(`<a href="${u}" rel="noopener">${a}</a>`));

  s = s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
       .replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>')
       .replace(/~~([^~]+)~~/g,'<s>$1</s>');

  // table-facing niceties: dice and DCs get a monospace tag
  s = s.replace(/\b(\d*d\d+(?:\s*[+-]\s*\d+)?)\b/g,'<span class="dice">$1</span>');
  s = s.replace(/\bDC\s*(\d+)/g,'<span class="dc">DC $1</span>');  // .dc is nowrap
  s = s.replace(/ -- /g,' — ');

  return s.replace(new RegExp(SEP + '(\\d+)' + SEP, 'g'), (m,i) => keep[+i]);
}

/* ---------- helpers handed to every block ---------- */
const h = {
  esc, inline,
  md: body => render(body),
  lines: body => String(body||'').split('\n').filter(l => l.trim()),
  kv: body => String(body||'').split('\n').map(l => {
    const m = l.match(/^\s*([A-Za-z][A-Za-z ]*?)\s*:\s*(.*)$/);
    return m ? {k:m[1].trim(), v:m[2]} : null;
  }).filter(Boolean)
};

/* ---------- block registry ---------- */
const BLOCKS = {};
const block = (name, fn) => { BLOCKS[name] = fn; };
const split = arg => String(arg||'').split('|').map(s => s.trim());

block('pitch', (arg, body) => {
  const ls = String(body).split('\n');
  const gold = ls.filter(l => l.startsWith('!! ')).map(l => inline(l.slice(3))).join(' ');
  const rest = ls.filter(l => !l.startsWith('!! ')).join('\n');
  return `<div class="pitch">${h.md(rest)}`
       + (gold?`<div class="theme">${gold}</div>`:'') + `</div>`;
});

block('read', (arg, body) =>
  `<div class="read"><div class="lbl">${inline(arg || 'Read aloud')}</div>${h.md(body)}</div>`);

block('clue', (arg, body) => {
  const ls = String(body).split('\n');
  const big = ls.filter(l => l.startsWith('!! ')).map(l => inline(l.slice(3))).join('<br>');
  const sub = ls.filter(l => l.startsWith('>> ')).map(l => inline(l.slice(3))).join(' ');
  const rest = ls.filter(l => !l.startsWith('!! ') && !l.startsWith('>> ')).join('\n');
  return `<div class="clue">${arg?`<div class="lbl">&#8594; ${inline(arg)}</div>`:''}`
       + h.md(rest)
       + (big?`<div class="big">${big}</div>`:'')
       + (sub?`<div class="sub">${sub}</div>`:'') + `</div>`;
});

block('npc', (arg, body) => {
  const [nm, de] = split(arg);
  let rows = '', line = '';
  h.kv(body).forEach(({k,v}) => {
    if(/^line$/i.test(k)) line = `<div class="line">&ldquo;${inline(v)}&rdquo;</div>`;
    else rows += `<div class="row"><span class="k">${esc(k)}</span><span>${inline(v)}</span></div>`;
  });
  return `<div class="npc"><div class="nm">${esc(nm||'')}</div>`
       + (de?`<div class="de">${inline(de)}</div>`:'') + rows + line + `</div>`;
});

/* Compressed stat block.

   The opening line is the whole defensive line: a name, then any number
   of `KEY value` pairs separated by `|`. The six ability modifiers are
   pulled out of those pairs and always printed as their own row, in
   order, whether or not you supplied them — an ability you leave out
   shows +0, which is what a 5e stat block means by silence.

   In the body, a line of `SHOUTY KEY: value` becomes a compact keyed
   row: SPELLS, SAVES, SKILLS, SENSES, RESIST, LANG. Use SPELLS for a
   caster's attack in one line rather than a spell list:
     SPELLS: DC 13, +5 · at will fire bolt 1d10 · 2/day misty step  */
const ABIL = ['STR','DEX','CON','INT','WIS','CHA'];

block('stat', (arg, body) => {
  const p = split(arg);
  const nm = p.shift() || '';
  const cr = p.find(x => /^CR\b/i.test(x)) || '';
  const abil = {}, defence = [];
  p.forEach(x => {
    if(!x || /^CR\b/i.test(x)) return;
    const m = x.match(/^([A-Za-z]{3})\s+(.+)$/);
    if(m && ABIL.includes(m[1].toUpperCase())) abil[m[1].toUpperCase()] = m[2].trim();
    else defence.push(x);
  });

  const bar = defence.map(x => {
    const m = x.match(/^(\S+)\s+(.*)$/);
    return m ? `<b>${esc(m[1])}</b> ${esc(m[2])}` : esc(x);
  }).join(' &nbsp; ');

  const abilRow = '<div class="abil">'
    + ABIL.map(k => `<span><b>${k}</b> ${esc(abil[k] || '+0')}</span>`).join('')
    + '</div>';

  let where = '', rows = '';
  String(body).split('\n').forEach(l => {
    if(l.startsWith('> ')){ where += (where?' ':'') + inline(l.slice(2)); return; }
    if(!l.trim()) return;
    const m = l.match(/^([A-Z][A-Z0-9 &/'-]{1,13}):\s*(.*)$/);
    rows += m ? `<div class="krow"><span class="k">${esc(m[1].trim())}</span><span>${inline(m[2])}</span></div>`
              : `<p>${inline(l)}</p>`;
  });

  return `<div class="stat"><div class="hd"><span class="nm">${esc(nm)}</span>`
       + (cr?`<span class="cr">${esc(cr)}</span>`:'') + `</div>`
       + (bar?`<div class="bar">${bar}</div>`:'') + abilRow + rows
       + (where?`<div class="where">&#9654; ${where}</div>`:'') + `</div>`;
});

block('box', (arg, body) => {
  const [kind, title] = split(arg);
  const k = ['gold','red','dark','plain','accent'].includes(kind) ? kind : '';
  return `<div class="kbox ${k}">${title?`<div class="t">${inline(title)}</div>`:''}${h.md(body)}</div>`;
});

block('beats', (arg, body) => {
  const items = String(body).split('\n').filter(l => /^\s*\d+\.\s/.test(l))
    .map(l => `<li>${inline(l.replace(/^\s*\d+\.\s/,''))}</li>`).join('');
  return `<ol class="beats">${items}</ol>`;
});

block('room', (arg, body) => {
  const [mk, nm] = split(arg);
  return `<div class="room"><div class="mk">${esc(mk||'')}</div><div class="bd">`
       + (nm?`<div class="rn">${inline(nm)}</div>`:'') + h.md(body) + `</div></div>`;
});

block('roll', (arg, body) => {
  const [die, title] = split(arg);
  const rows = h.lines(body).map(l => {
    const m = l.match(/^\s*(\d+(?:\s*[-–]\s*\d+)?)\s*[.)|:]?\s+(.*)$/);
    return m ? `<tr><td class="d">${esc(m[1].replace(/\s/g,''))}</td><td>${inline(m[2])}</td></tr>`
             : `<tr><td class="d"></td><td>${inline(l)}</td></tr>`;
  }).join('');
  const cap = [die, title].filter(Boolean).map(esc).join(' &nbsp;&middot;&nbsp; ');
  return `<table class="roll">${cap?`<caption>${cap}</caption>`:''}<tbody>${rows}</tbody></table>`;
});

block('track', (arg, body) => {
  const rows = h.kv(body).map(({k,v}) => {
    const n = Math.max(1, Math.min(24, parseInt(v,10) || 4));
    const pips = Array.from({length:n}, () => '<span class="pip"></span>').join('');
    return `<div class="row"><span class="k">${esc(k)}</span><span class="pips">${pips}</span></div>`;
  }).join('');
  return `<div class="track">${arg?`<div class="row"><span class="k">${inline(arg)}</span></div>`:''}${rows}</div>`;
});

block('valve', (arg, body) => {
  const rows = h.lines(body).map(l => {
    const m = l.match(/^([^:]+):\s*(.*)$/);
    return m ? `<div><span class="k">${esc(m[1].toUpperCase())} &#8594;</span> ${inline(m[2])}</div>`
             : `<div>${inline(l)}</div>`;
  }).join('');
  return `<div class="valve">${rows}</div>`;
});

block('cols', (arg, body) => {
  const n = /^[23]$/.test(String(arg).trim()) ? String(arg).trim() : '2';
  // The cols2/cols3 class is what press.css counts children against: a block
  // holding exactly as many children as it has columns is laid out on a grid
  // instead of balanced, so a tall stat block cannot drag its partner down
  // underneath it. Everything else keeps the multi-column flow.
  return `<div class="cols cols${n}" style="column-count:${n}">${h.md(body)}</div>`;
});

block('rooms', (arg, body) => {
  const head = String(arg||'').trim() ? split(arg) : [];
  const rows = h.lines(body).map(l => {
    const c = l.split('|').map(x => x.trim());
    const mk = c.length > 2 ? c.shift() : '';
    const nm = c.shift() || '';
    return `<tr>${mk!==''?`<td class="mk">${esc(mk)}</td>`:''}`
         + `<td class="nm">${inline(nm)}</td><td>${inline(c.join(' | '))}</td></tr>`;
  }).join('');
  const th = head.length
    ? `<thead><tr><th class="mk">${esc(head[0]||'')}</th><th>${esc(head[1]||'')}</th><th>${esc(head[2]||'')}</th></tr></thead>`
    : '';
  return `<table class="rooms">${th}<tbody>${rows}</tbody></table>`;
});

/* ---------- the quest card ----------
   One job as a card you cut out and fold. Two panels side by side:
   the FRONT — the notice as posted, and everything you need to choose
   the job — and the BACK, which is the handouts and nothing else.

   A single-sided sheet folded ink-inward hides both panels, so these
   fold PRINTED SIDE OUT: the crease is the card's edge, both panels
   end up on an outer face, and neither needs to be set upside down.

   A handout is one of two things and the card treats them differently.
   A DOCUMENT is printed as it reads, so the back can be cut up and
   handed over as it stands. An ILLUSTRATION cannot be, so it gets an
   empty frame — room to draw in, or to paste a picture into — and its
   brief drops to the foot of the panel with the guidance, because a
   brief printed inside the box is a brief you would have to draw over.

     :::quest Walk Me Home | JOB 15 · THE BOARD
     GENRE: escort
     LEVEL: 1
     DIFFICULTY: Easy
     The notice, in the voice of whoever pinned it up.
     >> THE SECURITY LOG
     02:14 Escorted D. Ashgrove to east gate. No incident.
     >> PEN & INK -- THE PARK AT TWO
     ART: the physics path, unlit, and a lamp forty feet back
     !! Hand the log over the first time anybody talks to Security.
     :::

   SHOUTY keys become the card's data rows; LEVEL and DIFFICULTY are
   lifted into the strip along the foot. Anything not a key is the
   detail. `>> TITLE` starts a handout; inside it, `ART: brief` makes
   that handout a frame to draw in, an `![alt](src)` line fills the
   frame with a picture, and anything else is the document, printed as
   it reads. `!!` lines anywhere on the back are the guidance.  */

const QFOOT = { level:'LEVEL', difficulty:'DIFFICULTY', diff:'DIFFICULTY' };
const IMG_LINE = /^\s*!\[([^\]]*)\]\(\s*([^)\s]*)[^)]*\)\s*$/;

block('quest', (arg, body) => {
  const [nm, kick] = split(arg);
  const ls = String(body||'').split('\n');
  const cut = ls.findIndex(l => /^>>\s/.test(l));
  const front = (cut < 0 ? ls : ls.slice(0, cut));
  const back  = (cut < 0 ? [] : ls.slice(cut));

  // front: SHOUTY keys make the grid, everything else is the detail
  let rows = '', foot = {}, detail = [];
  front.forEach(l => {
    const m = l.match(/^\s*([A-Z][A-Z ]*[A-Z]|[A-Z])\s*:\s*(.*)$/);
    if(!m) return detail.push(l);
    const key = m[1].trim(), slot = QFOOT[key.toLowerCase().replace(/\s+/g,'')];
    if(slot) foot[slot] = m[2];
    else rows += `<div class="row"><span class="k">${esc(key)}</span><span>${inline(m[2])}</span></div>`;
  });

  // back: one section per handout, plus the guidance along the foot
  const cards = [];
  let guide = [], cur = null;
  back.forEach(l => {
    let m;
    if((m = l.match(/^>>\s+(.*)$/))){ cur = { label:m[1], brief:'', img:null, lines:[] }; cards.push(cur); }
    else if(!cur) return;
    else if((m = l.match(/^ART:\s*(.*)$/i)))  cur.brief = m[1];
    else if((m = l.match(IMG_LINE)))          cur.img = { alt:m[1], src:m[2] };
    else if((m = l.match(/^!!\s+(.*)$/)))     guide.push(m[1]);
    else cur.lines.push(l);
  });

  const secs = cards.map(c => {
    // no picture yet: an empty frame, and the brief goes down to the foot
    const art = (c.img && c.img.src)
      ? `<figure class="qart has"><img src="${esc(c.img.src)}" alt="${esc(c.img.alt)}"></figure>`
      : (c.brief || c.img) ? `<figure class="qart"></figure>` : '';
    // name the brief only when the panel holds more than one handout
    if(c.brief && !(c.img && c.img.src))
      c.foot = (cards.length > 1 ? `<b>${inline(c.label)}.</b> ` : '') + inline(c.brief);
    return `<section class="qdoc${art?' art':''}">`
         + (c.label?`<div class="qlbl">${inline(c.label)}</div>`:'')
         + art + h.md(c.lines.join('\n')) + `</section>`;
  }).join('');

  const foots = cards.filter(c => c.foot).map(c => `<p>${c.foot}</p>`).join('')
              + (guide.length ? `<p>${inline(guide.join(' '))}</p>` : '');

  const strip = Object.keys(foot).length
    ? `<div class="qfoot">` + Object.entries(foot).map(([k,v]) =>
        `<span><b>${esc(k)}</b> ${inline(v)}</span>`).join('') + `</div>`
    : '';

  return `<div class="quest">`
       + `<div class="qp qfront">`
       +   (kick?`<div class="qkick">${inline(kick)}</div>`:'')
       +   `<div class="qname">${inline(nm||'')}</div>`
       +   `<div class="qdetail">${h.md(detail.join('\n'))}</div>`
       +   (rows?`<div class="qgrid">${rows}</div>`:'') + strip
       +   `<div class="qtag">front</div>`
       + `</div>`
       + `<div class="qp qback">`
       +   `<div class="qhand">${secs}</div>`
       +   (foots?`<div class="qguide">${foots}</div>`:'')
       +   `<div class="qtag">back</div>`
       + `</div>`
       + `<div class="qcrease" aria-hidden="true">fold &middot; printed side out</div>`
       + `</div>`;
});

/* ---------- a printable handout ----------
   A quest card's back is 90mm across, which is fine for a note and no
   use at all for a prop somebody has to sign, fold, count or cross off.
   `:::handout` sets one at usable size: a dashed cut line with the prop
   clean inside it, the label above and the guidance below, so cutting
   the thing out does not take the GM's note with it.

     :::handout JOB 4 · LIABILITY WAIVER | one per player
     I, the undersigned, enter of my own free will...
     !! Make them actually sign it before the portal opens.
     :::

   `ART: brief` makes it a frame to draw in, as on a quest card, and
   `TALL:` / `WIDE:` before it set the frame's shape.  */

block('handout', (arg, body) => {
  const [label, note] = split(arg);
  let brief='', img=null, guide=[], lines=[], shape='';
  String(body||'').split('\n').forEach(l => {
    let m;
    if((m = l.match(/^ART:\s*(.*)$/i)))       brief = m[1];
    else if((m = l.match(/^(TALL|WIDE):\s*$/i))) shape = m[1].toLowerCase();
    else if((m = l.match(IMG_LINE)))          img = { alt:m[1], src:m[2] };
    else if((m = l.match(/^!!\s+(.*)$/)))     guide.push(m[1]);
    else lines.push(l);
  });
  const art = (img && img.src)
    ? `<figure class="hoart has"><img src="${esc(img.src)}" alt="${esc(img.alt)}"></figure>`
    : (brief || img) ? `<figure class="hoart ${esc(shape)}"></figure>` : '';
  const foot = [brief && !(img && img.src) ? brief : '', ...guide]
                 .filter(Boolean).map(t => inline(t));
  // the label sits inside the cut, styled as a card back's does; the note
  // stays outside it, so cutting the prop out leaves the GM's note behind
  if(note) foot.unshift(`<b>${inline(note)}.</b>`);
  return `<div class="handout">`
       + `<div class="hocut">`
       +   (label?`<div class="holbl">${inline(label)}</div>`:'')
       +   art + h.md(lines.join('\n'))
       + `</div>`
       + (foot.length?`<div class="honote">${foot.join(' ')}</div>`:'')
       + `</div>`;
});

block('item', (arg, body) => {
  const [nm, kind] = split(arg);
  return `<div class="item"><div class="nm">${inline(nm||'')}</div>`
       + (kind?`<div class="kd">${inline(kind)}</div>`:'') + h.md(body) + `</div>`;
});

block('puzzle', (arg, body) => {
  const [nm, de] = split(arg);
  const rows = h.kv(body).map(({k,v}) =>
    `<div class="row"><span class="k">${esc(k)}</span><span>${inline(v)}</span></div>`).join('');
  return `<div class="puzzle"><div class="nm">${inline(nm||'')}</div>`
       + (de?`<div class="de">${inline(de)}</div>`:'') + rows + `</div>`;
});

/* Lazy-DM prep blocks: a session is a situation, not a sequence.

   :::secrets   ten things the party can learn, in any order, ticked off
                as they land — never tied to a room.
   :::scenes    what might happen, deliberately unordered.
   :::place     a fantastic location and the three details you say aloud. */

block('secrets', (arg, body) => {
  const items = h.lines(body)
    .map(l => `<li>${inline(l.replace(/^\s*(?:\d+[.)]|[-*])\s+/, ''))}</li>`).join('');
  return `<ol class="secrets">${items}</ol>`;
});

block('scenes', (arg, body) => {
  const items = h.lines(body)
    .map(l => `<li>${inline(l.replace(/^\s*(?:\d+[.)]|[-*])\s+/, ''))}</li>`).join('');
  return `<ul class="scenes">${arg?`<li class="t">${inline(arg)}</li>`:''}${items}</ul>`;
});

block('place', (arg, body) => {
  const [nm, de] = split(arg);
  const items = h.lines(body)
    .map(l => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('');
  return `<div class="place"><div class="nm">${inline(nm||'')}</div>`
       + (de?`<div class="de">${inline(de)}</div>`:'')
       + `<ul class="det">${items}</ul></div>`;
});

/* ============================================================
   THE NODE WEB — node-based design, and the three clue rule
   ------------------------------------------------------------
   A scenario is not a sequence. It is a handful of nodes — a
   place, a person, a group, an event — joined by the clues that
   lead from one to the next. The players pick the order.

   THE THREE CLUE RULE: for every node they have to reach, write
   three clues pointing at it. They will miss the first, misread
   the second, and follow the third. A node with two ways in is a
   scenario with one way to stall.

     :::node A | The Silent Mill | place | start
     Brief. What is there, and why they care.
     -> B  The ledger names a buyer, paid in Karrn silver
     -> C  Bootprints in the flour, too big for a man
     :::

   A `-> ID text` line is a lead: a clue found here that points at
   node ID. Everything else in the body is ordinary markdown, so a
   node stays as brief as you leave it.

     :::web LABEL       every node on the page, drawn and audited
     :::reveal Claim    a conclusion, and the clues that add up

   The web is one page wide. render() scans a page for :::node
   blocks before it renders anything on it, so each card knows how
   many clues point at it and :::web can sit anywhere on the page,
   above or below the nodes it draws.
   ============================================================ */

const LEAD = /^\s*(?:->|=>|→)\s*([A-Za-z0-9][\w-]*)\s*[:|.]?\s*(.*)$/;
const nid  = s => String(s||'').trim().toUpperCase();

/* One :::node. `-> ID text` lines come out as leads, the rest is body. */
function parseNode(arg, body){
  const p = split(arg);
  const id = nid(p.shift()) || '?';
  const name = p.shift() || '';
  let start = false;
  const kind = p.filter(x => {
    if(/^start$/i.test(x)){ start = true; return false; }
    return !!x;
  }).join(' · ');

  const leads = [], text = [];
  String(body||'').split('\n').forEach(l => {
    const m = l.match(LEAD);
    if(m) leads.push({ to: nid(m[1]), text: m[2].trim() });
    else text.push(l);
  });
  return { id, name, kind, start, leads, md: text.join('\n') };
}

/* The arithmetic the rule needs: how many clues point at each node.
   A start node is exempt — it is where the session opens, so nothing
   has to lead there. */
function weigh(list){
  const w = { list, has:{}, name:{}, start:{}, in:{}, dup:[] };
  list.forEach(n => {
    if(w.has[n.id]) w.dup.push(n.id);
    w.has[n.id]  = true;
    w.in[n.id]   = w.in[n.id] || 0;
    w.name[n.id] = w.name[n.id] || n.name;
    if(n.start) w.start[n.id] = true;
  });
  list.forEach(n => n.leads.forEach(l => { if(w.has[l.to]) w.in[l.to]++; }));
  w.count = id => w.in[id] || 0;
  w.thin  = id => !w.start[id] && w.count(id) < 3;
  w.lost  = () => {
    const out = [];
    list.forEach(n => n.leads.forEach(l => { if(!w.has[l.to]) out.push([n.id, l.to]); }));
    return out;
  };
  return w;
}

/* Nodes are found by reading the page, not by rendering it, so this has
   to skip ``` fences the same way the parser does — a :::node quoted in
   a code sample is a code sample, not a node. */
function scanNodes(src){
  const lines = String(src||'').replace(/\r/g,'').split('\n');
  const list = [];
  let fence = false;
  for(let i = 0; i < lines.length; i++){
    if(/^```/.test(lines[i])){ fence = !fence; continue; }
    if(fence) continue;
    const m = lines[i].match(/^:::\s*node\b\s*(.*)$/);
    if(!m) continue;
    const body = [];
    let depth = 1;
    while(++i < lines.length){
      if(/^:::\s*[\w-]/.test(lines[i])) depth++;
      else if(/^:::\s*$/.test(lines[i]) && !--depth) break;
      body.push(lines[i]);
    }
    list.push(parseNode(m[1], body.join('\n')));
  }
  return weigh(list);
}

let WEB = weigh([]);

/* ---------- the web, drawn ----------
   Nodes sit on an ellipse in the order they are declared, so the
   picture is the same every time you print it. Clues are arrows,
   bowed left of the way they travel so a pair that point at each
   other do not land on the same line. A node the rule is unhappy
   with wears a dashed red ring. */

const r2 = v => Math.round(v*100)/100;

const edge = (p, tx, ty, r) => {
  const dx = tx-p.x, dy = ty-p.y, L = Math.hypot(dx,dy) || 1;
  return { x: p.x + dx/L*r, y: p.y + dy/L*r };
};

/* a long name breaks once, at the space nearest the middle */
function wrapName(s, max){
  const t = String(s||'').toUpperCase().trim();
  if(t.length <= max) return [t];
  const mid = t.length/2;
  let cut = -1;
  for(let i = 0; i < t.length; i++)
    if(t[i] === ' ' && (cut < 0 || Math.abs(i-mid) < Math.abs(cut-mid))) cut = i;
  return cut < 0 ? [t] : [t.slice(0,cut), t.slice(cut+1)];
}

const DSP = 'TeX Gyre Heros Cn,Arial Narrow,sans-serif';

function drawWeb(w){
  const ns = w.list, n = ns.length;
  const W = 560, H = 310, cx = W/2, cy = H/2, R = 15;
  const rx = n < 4 ? 120 : 155, ry = n < 4 ? 68 : 96;

  const pos = ns.map((nd,i) => {
    if(n === 1) return { x:cx, y:cy, c:0, s:1 };
    const a = -Math.PI/2 + i*2*Math.PI/n;
    return { x: cx + rx*Math.cos(a), y: cy + ry*Math.sin(a), c: Math.cos(a), s: Math.sin(a) };
  });
  const idx = {};
  ns.forEach((nd,i) => { if(idx[nd.id] === undefined) idx[nd.id] = i; });

  // The viewBox is cropped to what is actually drawn, so a web ships no
  // band of blank paper — and, more to the point, never clips the name
  // hanging off the node on the far left. Label widths are estimated:
  // Heros Cn bold runs about .52em to the character.
  let y0 = cy, y1 = cy, x0 = cx, x1 = cx;
  const span  = (a, b) => { y0 = Math.min(y0, a); y1 = Math.max(y1, b); };
  const spanX = (a, b) => { x0 = Math.min(x0, a); x1 = Math.max(x1, b); };
  const LBL = 11.5, wide = rows => Math.max(...rows.map(t => t.length)) * LBL * 0.52;

  let arcs = '';
  ns.forEach((nd,i) => nd.leads.forEach(l => {
    const j = idx[l.to];
    if(j === undefined || j === i) return;
    const p = pos[i], q = pos[j];
    const dx = q.x-p.x, dy = q.y-p.y, L = Math.hypot(dx,dy) || 1;
    const bow = Math.min(30, L*0.17);
    const mx = (p.x+q.x)/2 - dy/L*bow, my = (p.y+q.y)/2 + dx/L*bow;
    const a = edge(p, mx, my, R+2), b = edge(q, mx, my, R+7);
    span(my, my); spanX(mx, mx);
    const hl = Math.hypot(b.x-mx, b.y-my) || 1;
    const hx = (b.x-mx)/hl, hy = (b.y-my)/hl;
    arcs += `<path d="M${r2(a.x)} ${r2(a.y)}Q${r2(mx)} ${r2(my)} ${r2(b.x)} ${r2(b.y)}" fill="none" stroke="${INK}" stroke-width="1.1"/>`
          + `<path d="M${r2(b.x+hx*6)} ${r2(b.y+hy*6)}L${r2(b.x-hy*3.4)} ${r2(b.y+hx*3.4)}`
          + `L${r2(b.x+hy*3.4)} ${r2(b.y-hx*3.4)}Z" fill="${INK}"/>`;
  }));

  let discs = '', labels = '';
  ns.forEach((nd,i) => {
    const p = pos[i];
    span(p.y - R - 5, p.y + R + 5);
    spanX(p.x - R - 5, p.x + R + 5);
    if(w.thin(nd.id))
      discs += `<circle cx="${r2(p.x)}" cy="${r2(p.y)}" r="${R+4}" fill="none" stroke="${ACCENT}" stroke-width="1.2" stroke-dasharray="3 2.6"/>`;
    discs += `<circle class="disc" cx="${r2(p.x)}" cy="${r2(p.y)}" r="${R}" fill="${nd.start?ACCENT:INK}"/>`
           + `<text class="lt" x="${r2(p.x)}" y="${r2(p.y+4.6)}" text-anchor="middle" font-family="${DSP}"`
           + ` font-weight="700" font-size="${nd.id.length>1?10:13}" fill="#fff">${esc(nd.id)}</text>`;

    const side = Math.abs(p.c) < .3 ? 0 : (p.c > 0 ? 1 : -1);
    const rows = wrapName(nd.name || nd.id, 20);
    const lx = p.x + side*(R+7);
    const ly = side === 0
      ? (p.s < 0 ? p.y - R - 10 - (rows.length-1)*11 : p.y + R + 18)
      : p.y + 4 - (rows.length-1)*5.5;
    span(ly - 9, ly + (rows.length-1)*11 + 3);
    const wd = wide(rows);
    spanX(lx - (side < 0 ? wd : side ? 0 : wd/2), lx + (side > 0 ? wd : side ? 0 : wd/2));
    labels += rows.map((t,k) =>
      `<text x="${r2(lx)}" y="${r2(ly + k*11)}" text-anchor="${side===0?'middle':side>0?'start':'end'}"`
      + ` font-family="${DSP}" font-weight="700" font-size="${LBL}" fill="${INK}">${esc(t)}</text>`).join('');
  });

  // sized off its own aspect, so a web takes about the same band of paper
  // whatever shape the crop came out — see svg.webmap in press.css
  const vw = x1-x0+8, vh = y1-y0+8;
  return `<svg class="webmap" style="--a:${r2(vw/vh)}"`
       + ` viewBox="${r2(x0-4)} ${r2(y0-4)} ${r2(vw)} ${r2(vh)}"`
       + ` xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Scenario web">`
       + `${arcs}${discs}${labels}</svg>`;
}

/* ---------- the three blocks ---------- */

block('node', (arg, body) => {
  const n = parseNode(arg, body), w = WEB;
  const thin = w.has[n.id] ? w.thin(n.id) : !n.start;
  const badge = n.start
    ? `<span class="in start">start</span>`
    : `<span class="in${thin?' thin':''}">${w.count(n.id)} in</span>`;

  const leads = n.leads.map(l => {
    const known = w.has[l.to];
    const nm = w.name[l.to] || '';
    return `<li><span class="to${known?'':' bad'}">${esc(l.to)}</span>`
         + (nm ? `<span class="tn">${inline(nm)}${l.text?' &mdash;':''}</span>` : '')
         + (l.text ? ` ${inline(l.text)}` : '') + `</li>`;
  }).join('');

  return `<div class="node${n.start?' start':''}"><div class="mk">${esc(n.id)}</div><div class="bd">`
       + `<div class="hd"><span class="nm">${inline(n.name)}</span>`
       + (n.kind ? `<span class="de">${inline(n.kind)}</span>` : '') + badge + `</div>`
       + (n.md.trim() ? h.md(n.md) : '')
       + (leads ? `<ul class="leads">${leads}</ul>` : '')
       + `</div></div>`;
});

block('web', (arg, body) => {
  const w = WEB;
  if(!w.list.length)
    return `<div class="err">:::web &mdash; no :::node blocks on this page</div>`;

  const rows = w.list.map(n => {
    const inTxt = n.start ? 'start' : `${w.count(n.id)} in`;
    return `<div class="r"><span class="mk">${esc(n.id)}</span>`
         + `<span class="nm">${inline(n.name || n.id)}</span>`
         + `<span class="ct"><b${w.thin(n.id)?' class="thin"':''}>${inTxt}</b>`
         + ` &middot; ${n.leads.length} out</span></div>`;
  }).join('');

  const thin = w.list.filter(n => w.thin(n.id));
  const ends = w.list.filter(n => !n.leads.length);
  const lost = w.lost();
  const dup  = [...new Set(w.dup)];

  let notes = thin.length
    ? `<div class="note bad"><b>Under three.</b> `
      + thin.map(n => `${esc(n.id)} has ${w.count(n.id)}`).join(', ')
      + `. Write another clue, or plan on them stalling there.</div>`
    : `<div class="note">Three ways into every node. The rule holds.</div>`;
  if(ends.length) notes += `<div class="note">Ends here: ${ends.map(n => esc(n.id)).join(', ')}.</div>`;
  if(lost.length) notes += `<div class="note bad"><b>No such node.</b> `
    + lost.map(p => `${esc(p[0])} &#8594; ${esc(p[1])}`).join(', ') + `.</div>`;
  if(dup.length) notes += `<div class="note bad"><b>Declared twice.</b> ${dup.map(esc).join(', ')}.</div>`;

  return `<div class="web">${arg?`<div class="lbl">${inline(arg)}</div>`:''}`
       + (String(body||'').trim() ? h.md(body) : '')
       + drawWeb(w) + `<div class="audit">${rows}</div>${notes}</div>`;
});

/* A revelation list: the thing you need them to work out, and every
   clue that gets them there. Three, or it is not written yet. */
block('reveal', (arg, body) => {
  const w = WEB;
  const items = h.lines(body).map(l => {
    const t = l.replace(/^\s*(?:[-*]|\d+[.)])\s+/, '');
    const m = t.match(/^([A-Za-z0-9][\w-]{0,7})\s*[.:|]\s*(.+)$/);
    return (m && w.has[nid(m[1])]) ? { id: nid(m[1]), t: m[2] } : { id:'', t };
  });
  const n = items.length, thin = n < 3;
  return `<div class="reveal${thin?' thin':''}">`
       + `<div class="hd"><span class="q">${inline(arg||'')}</span>`
       + `<span class="tally${thin?' thin':''}">${n} clue${n===1?'':'s'}`
       + `${thin?' &mdash; the rule says three':''}</span></div>`
       + `<ul class="cl">` + items.map(it =>
           `<li${it.id?'':' class="free"'}>${it.id?`<span class="mk">${esc(it.id)}</span>`:''}`
           + `${inline(it.t)}</li>`).join('')
       + `</ul></div>`;
});

/* ---------- block parser ----------
   render() is the door in. Before anything on a page is rendered the
   page is scanned for :::node blocks, so the node web is counted once
   and every block on that page sees the same arithmetic. Nested calls
   (h.md inside a block, a blockquote) go straight through and keep the
   page's web. */
let DEPTH = 0;

function render(src){
  if(DEPTH) return renderBody(src);
  WEB = scanNodes(src);
  DEPTH = 1;
  try { return renderBody(src); }
  finally { DEPTH = 0; }
}

function renderBody(src){
  const lines = String(src||'').replace(/\r/g,'').split('\n');
  let out = '', i = 0;

  while(i < lines.length){
    const l = lines[i];

    // ::: custom block
    if(/^:::/.test(l)){
      const m = l.match(/^:::\s*([\w-]+)\s*(.*)$/);
      const body = []; i++;
      let depth = 1;
      while(i < lines.length){
        if(/^:::\s*[\w-]/.test(lines[i])) depth++;
        else if(/^:::\s*$/.test(lines[i])){ depth--; if(!depth) break; }
        body.push(lines[i]); i++;
      }
      i++;
      if(m){
        const fn = BLOCKS[m[1]];
        out += fn ? fn(m[2], body.join('\n'), h)
                  : `<div class="err">unknown block :::${esc(m[1])}</div>`;
      }
      continue;
    }

    // ``` fenced code, or a dungeon map
    if(/^```/.test(l)){
      const lang = l.slice(3).trim();
      const body = []; i++;
      while(i < lines.length && !/^```/.test(lines[i])){ body.push(lines[i]); i++; }
      i++;
      const dm = lang.match(/^dungeon\b\s*(.*)$/);
      out += dm ? drawDungeon(body.join('\n')) + (dm[1]?`<div class="mapcap">${inline(dm[1])}</div>`:'')
                : `<pre><code>${esc(body.join('\n'))}</code></pre>`;
      continue;
    }

    // hard page break
    if(/^\+\+\+\s*$/.test(l)){ out += '<div class="pagebreak"></div>'; i++; continue; }

    // table
    if(/^\|/.test(l) && /^\|[\s:|-]+\|?\s*$/.test(lines[i+1]||'')){
      const t = []; while(i < lines.length && /^\|/.test(lines[i])){ t.push(lines[i]); i++; }
      out += tableBlock(t); continue;
    }

    let m;
    if((m = l.match(/^(#{1,4})\s+(.*)$/))){
      const lv = m[1].length; out += `<h${lv}>${inline(m[2])}</h${lv}>`; i++; continue;
    }
    if(/^(---|\*\*\*)\s*$/.test(l)){ out += '<hr>'; i++; continue; }
    if(/^>\s?/.test(l)){
      const b = []; while(i < lines.length && /^>\s?/.test(lines[i])){ b.push(lines[i].replace(/^>\s?/,'')); i++; }
      out += `<blockquote>${render(b.join('\n'))}</blockquote>`; continue;
    }
    if(/^\s*[-*]\s+/.test(l)){
      const b = []; while(i < lines.length && /^\s*[-*]\s+/.test(lines[i])){ b.push(lines[i].replace(/^\s*[-*]\s+/,'')); i++; }
      out += '<ul>' + b.map(x => `<li>${inline(x)}</li>`).join('') + '</ul>'; continue;
    }
    if(/^\s*\d+\.\s+/.test(l)){
      const b = []; while(i < lines.length && /^\s*\d+\.\s+/.test(lines[i])){ b.push(lines[i].replace(/^\s*\d+\.\s+/,'')); i++; }
      out += '<ol>' + b.map(x => `<li>${inline(x)}</li>`).join('') + '</ol>'; continue;
    }
    if(!l.trim()){ i++; continue; }

    const p = [];
    while(i < lines.length && lines[i].trim() &&
          !/^(#{1,4}\s|:::|```|>|\||\+\+\+|\s*[-*]\s|\s*\d+\.\s|---)/.test(lines[i])){ p.push(lines[i]); i++; }
    out += `<p>${inline(p.join(' '))}</p>`;
  }
  return out;
}

const PIPE = '\u0002'; // stands in for an escaped \\| while we split cells

function tableBlock(rows){
  const cells = r => r.replace(/\\\|/g, PIPE).replace(/^\||\|$/g,'')
                      .split('|').map(c => c.trim().split(PIPE).join('|'));
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  let out = '<table>';
  if(!head.every(c => !c)) out += '<thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead>';
  out += '<tbody>';
  body.forEach(r => { out += '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>'; });
  return out + '</tbody></table>';
}

/* ---------- documents ---------- */
function parseDoc(text){
  const src = String(text||'').replace(/\r/g,'');
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = {};
  let md = src;
  if(m){
    md = src.slice(m[0].length);
    m[1].split('\n').forEach(l => {
      const kv = l.match(/^\s*([\w-]+)\s*:\s*(.*)$/);
      if(kv) meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g,'');
    });
  }
  return {
    title:    meta.title || (md.match(/^#\s+(.*)$/m)||[])[1] || 'Untitled',
    subtitle: meta.subtitle || meta.sub || '',
    kicker:   meta.kicker || '',
    number:   meta.number || '',
    head:     meta.head || '',
    headright: meta.headright || meta['head-right'] || '',
    // how the page is set: '' is the house's dense GM setting, 'open' is
    // the large, airy one a player handout wants. See .sheet.set-* in press.css.
    set:      (meta.set || '').toLowerCase(),
    md
  };
}

/* A page in this house style is designed, not flowed: `+++` on its own
   line ends one printed page and starts the next. */
function splitPages(md){
  return String(md||'').split(/^\+\+\+[ \t]*$/m);
}

/* The title block that opens a document's first page. */
function masthead(doc){
  return `<div class="masthead">`
       + (doc.number?`<div class="bignum">${esc(doc.number)}</div>`:'')
       + (doc.kicker?`<div class="kicker">${inline(doc.kicker)}</div>`:'')
       + `<h1>${esc(doc.title)}</h1>`
       + (doc.subtitle?`<div class="subtitle">${inline(doc.subtitle)}</div>`:'')
       + `</div>`;
}

function renderDoc(doc){
  return splitPages(doc.md).map((md,i) => (i?'':masthead(doc)) + render(md)).join('');
}

function serialize(doc){
  const fm = ['---', `title: ${doc.title||''}`];
  if(doc.kicker) fm.push(`kicker: ${doc.kicker}`);
  if(doc.number) fm.push(`number: ${doc.number}`);
  if(doc.subtitle) fm.push(`subtitle: ${doc.subtitle}`);
  if(doc.head) fm.push(`head: ${doc.head}`);
  if(doc.headright) fm.push(`headright: ${doc.headright}`);
  if(doc.set) fm.push(`set: ${doc.set}`);
  fm.push('---', '');
  return fm.join('\n') + String(doc.md||'').replace(/^\n+/,'');
}

return { render, renderDoc, parseDoc, serialize, splitPages, masthead,
         block, blocks: BLOCKS, drawDungeon, inline, esc };
})();
