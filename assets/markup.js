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
  s = s.replace(/\bDC\s*(\d+)/g,'<span class="dc">DC&nbsp;$1</span>');
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
  return `<div class="cols" style="column-count:${n}">${h.md(body)}</div>`;
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

/* ---------- block parser ---------- */
function render(src){
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
  fm.push('---', '');
  return fm.join('\n') + String(doc.md||'').replace(/^\n+/,'');
}

return { render, renderDoc, parseDoc, serialize, splitPages, masthead,
         block, blocks: BLOCKS, drawDungeon, inline, esc };
})();
