/* ============================================================
   DUNGEON MARKUP — the app
   ------------------------------------------------------------
   Source of truth is the .md files in /content, listed by
   /content/manifest.json. The in-browser editor keeps local
   drafts in localStorage on top of those files; "Save .md"
   downloads a file you can commit back to the repo.

   PRINTING: #print-root is a plain static <div> hanging off
   <body>, outside the app's flex/overflow layout. Everything
   printable is mirrored into it and assets/print.css hides the
   app. That is the whole trick — a browser cannot paginate the
   inside of a scroll container.
   ============================================================ */
(function(){
'use strict';

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const STORE = 'dungeon-markup:v1';
const PAPER = { A4:['210mm','297mm'], Letter:['216mm','279mm'], A5:['148mm','210mm'] };

const WELCOME = [
  '---',
  'title: Dungeon Markup',
  'subtitle: Nothing loaded',
  '---',
  '',
  ":::box red | Content could not be loaded",
  'The pages live in `content/*.md` and are listed in `content/manifest.json`.',
  '',
  'If you opened this file straight off disk, the browser blocks reading those',
  'files. Serve the folder instead:',
  '',
  '```',
  'python3 -m http.server 8000',
  '```',
  '',
  'Then open http://localhost:8000. On GitHub Pages it just works.',
  ':::'
].join('\n');

/* ---------- state ---------- */
let docs = [];          // {file, title, subtitle, md, base, dirty}
let cur = 0;
let editing = false;
let saveT = null;
let printScope = 'page';

let cfg = { page:'A4', margin:'14mm 15mm', text:8.2, mono:false };
let store = { order:null, drafts:{} };

/* ---------- storage ---------- */
function readStore(){
  try{
    const raw = localStorage.getItem(STORE);
    if(raw){
      const d = JSON.parse(raw);
      store.drafts = d.drafts || {};
      store.order  = Array.isArray(d.order) ? d.order : null;
      if(d.cfg) cfg = Object.assign(cfg, d.cfg);
    }
  }catch(e){ /* corrupt or unavailable; carry on with defaults */ }
}
function writeStore(){
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try{
      localStorage.setItem(STORE, JSON.stringify({
        drafts: store.drafts,
        order: docs.map(d => d.file),
        cfg
      }));
    }catch(e){ toast('Could not save locally — storage full'); }
  }, 400);
}

function toast(msg){
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1900);
}

/* ---------- load ---------- */
async function boot(){
  readStore();
  applyConfig();

  let files = [], bases = {};
  try{
    const mf = await fetch('content/manifest.json', {cache:'no-cache'});
    if(!mf.ok) throw new Error('manifest ' + mf.status);
    const data = await mf.json();
    files = (data.pages || []).map(p => typeof p === 'string' ? p : p.file);
    if(data.title) document.querySelector('.brand').firstChild.textContent = data.title;
    await Promise.all(files.map(async f => {
      try{
        const r = await fetch('content/' + f, {cache:'no-cache'});
        if(r.ok) bases[f] = await r.text();
      }catch(e){ /* individual page missing; skip it */ }
    }));
  }catch(e){
    bases['welcome.md'] = WELCOME;
    files = ['welcome.md'];
  }

  // local-only pages the writer created in the browser
  const extra = Object.keys(store.drafts).filter(f => !files.includes(f));
  let order = store.order && store.order.length
    ? store.order.filter(f => files.includes(f) || extra.includes(f))
    : files;
  files.concat(extra).forEach(f => { if(!order.includes(f)) order.push(f); });

  docs = order.map(f => {
    const text = store.drafts[f] != null ? store.drafts[f] : bases[f];
    if(text == null) return null;
    const d = Markup.parseDoc(text);
    d.file = f;
    d.base = bases[f] || null;
    d.dirty = store.drafts[f] != null && store.drafts[f] !== bases[f];
    return d;
  }).filter(Boolean);

  if(!docs.length){
    const d = Markup.parseDoc(WELCOME);
    d.file = 'welcome.md'; d.base = WELCOME; d.dirty = false;
    docs = [d];
  }
  draw();
}

/* ---------- render ----------
   A document is a run of designed pages: `+++` ends one and starts
   the next. Each page becomes its own .sheet, carrying a running head
   and a folio, so the preview stack is exactly the printed stack. */

function sheetHTML(doc, md, first, folio){
  const left  = doc.head || doc.kicker || doc.title;
  const right = doc.headright || doc.title;
  return `<section class="sheet">`
       + `<div class="runhead"><span>${Markup.esc(left)}</span>`
       + `<span class="r">${Markup.esc(right)}</span></div>`
       + `<div class="body">${first ? Markup.masthead(doc) : ''}${Markup.render(md)}</div>`
       + `<div class="overflag">This page overflows — trim it, or split it with +++</div>`
       + `<div class="folio">${folio}</div>`
       + `</section>`;
}

function renderBook(list){
  let n = 0, out = '';
  list.forEach(doc => {
    Markup.splitPages(doc.md).forEach((md, i) => { n++; out += sheetHTML(doc, md, i === 0, n); });
  });
  return out;
}

/* Flag any page whose content runs past the paper.
   .sheet has a min-height of one page, so its rendered height hides
   whether the content actually fits — measure with that lifted. Print
   lays the same content out a little taller than the screen does, so
   the last ~2% of the page is treated as full: "fits here" has to
   mean "fits there", and being wrong costs a blank sheet of paper. */
function flagOverflow(root){
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;height:var(--sheet-h)';
  document.body.appendChild(probe);
  const limit = probe.offsetHeight;
  probe.remove();
  if(!limit) return;
  root.querySelectorAll('.sheet').forEach(el => {
    const held = el.style.minHeight;
    el.classList.remove('over');   // the warning itself takes up room
    el.style.minHeight = '0';
    const natural = el.offsetHeight;
    el.style.minHeight = held;
    el.classList.toggle('over', natural > limit - 10);
    el.dataset.fill = Math.round(natural / limit * 100) + '%';
  });
}

function draw(){
  const d = docs[cur];

  $('#side').innerHTML =
    '<div class="sect">Pages</div>' +
    docs.map((pg,i) =>
      `<div class="pg${i===cur?' on':''}${pg.dirty?' mod':''}" data-i="${i}" tabindex="0" role="button">
         <span class="n">${String(i+1).padStart(2,'0')}</span>
         <span class="dot" title="Unsaved local edits"></span>
         <span>${Markup.esc(pg.title)}</span>
         <span class="x" data-del="${i}" title="Remove page">&times;</span>
       </div>`).join('') +
    `<div class="sect">Book</div>
     <div class="sidefoot">
       <button class="btn" id="dlAllBtn">Download all .md</button>
       <button class="btn" id="revertBtn">Revert this page</button>
     </div>`;

  if(!d) return;
  $('#md').value = d.md;
  drawView();
  document.title = d.title + ' — Dungeon Markup';
  syncPrint();
}

function drawView(){
  const d = docs[cur];
  const out = $('#out');
  out.innerHTML = renderBook([d]);
  flagOverflow(out);
  const words = (d.md.match(/[A-Za-z0-9'-]+/g) || []).length;
  const pages = Markup.splitPages(d.md).length;
  $('#stats').textContent = `${words} words · ${pages} page${pages>1?'s':''}`;
  $('#draft').textContent = d.dirty ? 'local draft' : '';
  $('#draft').classList.toggle('on', !!d.dirty);
}

/* ---------- printing ---------- */
function syncPrint(){
  const list = printScope === 'book' ? docs : [docs[cur]].filter(Boolean);
  $('#print-root').innerHTML = renderBook(list);
}

function doPrint(scope){
  printScope = scope;
  syncPrint();
  closePrintBox();
  // let the DOM settle before the browser snapshots it
  requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
}

// covers Ctrl/Cmd+P and the browser's own File > Print
window.addEventListener('beforeprint', syncPrint);
window.addEventListener('afterprint', () => { printScope = 'page'; syncPrint(); });

function applyConfig(){
  $('#pagerule').textContent = `@page{size:${cfg.page};margin:${cfg.margin}}`;
  const r = document.documentElement.style;
  const paper = PAPER[cfg.page] || PAPER.A4;
  r.setProperty('--sheet-w', paper[0]);
  r.setProperty('--sheet-h', paper[1]);
  // How tall one printed page's content box is: paper minus the @page
  // margins. print.css pins each sheet to this so the folio sits at the
  // foot of the page without 100vh spilling onto a second sheet.
  const vpad = parseFloat(cfg.margin) || 0;
  r.setProperty('--print-fill', `calc(${paper[1]} - ${vpad * 2}mm - 2mm)`);
  r.setProperty('--sheet-pad', cfg.margin);
  r.setProperty('--sheet-size', cfg.text + 'pt');
  r.setProperty('--print-size', cfg.text + 'pt');
  document.body.classList.toggle('mono', !!cfg.mono);
  if(docs.length) { flagOverflow($('#out')); }
}

function openPrintBox(){
  $('#pbPage').value = cfg.page;
  $('#pbMargin').value = cfg.margin;
  $('#pbText').value = cfg.text;
  $('#pbTextOut').value = cfg.text + 'pt';
  $('#pbMono').checked = !!cfg.mono;
  $('#scrim').hidden = false;
  $('#printbox').hidden = false;
  $('#pbPageBtn').focus();
}
function closePrintBox(){ $('#scrim').hidden = true; $('#printbox').hidden = true; }

/* ---------- files ---------- */
function download(name, text){
  const blob = new Blob([text], {type:'text/markdown;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const slug = s => (s||'page').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'page';

/* ---------- events ---------- */
$('#side').addEventListener('click', e => {
  if(e.target.id === 'dlAllBtn'){
    docs.forEach((d,i) => setTimeout(() => download(d.file, Markup.serialize(d)), i*250));
    return toast('Downloading ' + docs.length + ' files');
  }
  if(e.target.id === 'revertBtn'){
    const d = docs[cur];
    if(!d.dirty) return toast('No local edits on this page');
    if(!confirm('Discard local edits to "' + d.title + '"?')) return;
    delete store.drafts[d.file];
    Object.assign(d, Markup.parseDoc(d.base), {file:d.file, base:d.base, dirty:false});
    draw(); writeStore(); toast('Reverted to the file');
    return;
  }
  const del = e.target.closest('[data-del]');
  if(del){
    e.stopPropagation();
    const i = +del.dataset.del;
    if(docs.length < 2) return toast('Keep at least one page');
    if(!confirm('Remove "' + docs[i].title + '" from this book?')) return;
    delete store.drafts[docs[i].file];
    docs.splice(i,1);
    cur = Math.min(cur, docs.length-1);
    draw(); writeStore(); toast('Removed');
    return;
  }
  const row = e.target.closest('.pg');
  if(row){ cur = +row.dataset.i; draw(); document.body.classList.remove('nav'); }
});
$('#side').addEventListener('keydown', e => {
  if(e.key === 'Enter' || e.key === ' '){
    const r = e.target.closest('.pg');
    if(r){ e.preventDefault(); cur = +r.dataset.i; draw(); }
  }
});

const ta = $('#md');
ta.addEventListener('input', () => {
  const d = docs[cur];
  d.md = ta.value;
  d.dirty = true;
  store.drafts[d.file] = Markup.serialize(d);
  drawView();
  const row = $(`.pg[data-i="${cur}"]`); if(row) row.classList.add('mod');
  syncPrint();
  writeStore();
});

/* title + subtitle are edited from the page itself */
$('#view').addEventListener('dblclick', e => {
  if(e.target.closest('.masthead') || e.target.closest('.runhead')) openPageSetup();
});

/* images: paste or drop, embedded as data URIs so a page stays self-contained */
function insertAtCursor(text){
  const s = ta.selectionStart, e = ta.selectionEnd;
  ta.value = ta.value.slice(0,s) + text + ta.value.slice(e);
  ta.selectionStart = ta.selectionEnd = s + text.length;
  ta.dispatchEvent(new Event('input'));
}
function readImage(file){
  if(file.size > 1.5*1024*1024) return toast('Image over 1.5 MB — shrink it first');
  const fr = new FileReader();
  fr.onload = () => {
    insertAtCursor('\n![' + file.name.replace(/\.[^.]+$/,'') + '](' + fr.result + ')\n');
    toast('Image inserted');
  };
  fr.readAsDataURL(file);
}
ta.addEventListener('paste', e => {
  const item = [...e.clipboardData.items].find(i => i.type.startsWith('image/'));
  if(item){ e.preventDefault(); readImage(item.getAsFile()); }
});
['dragover','drop'].forEach(ev => ta.addEventListener(ev, e => {
  e.preventDefault();
  if(ev === 'drop'){
    const f = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'));
    if(f) readImage(f);
  }
}));

/* insert chips */
const SNIP = [
  ['H2',      '## '],
  ['Pitch',   ':::pitch\nThe one-paragraph sell.\n!! THEME -- the one line you keep coming back to.\n:::\n'],
  ['Read',    ':::read OPENING SHOT -- READ IT, THEN STOP TALKING\nThe boxed text you say out loud.\n:::\n'],
  ['Beats',   ':::beats\n1. **Beat.** What happens.\n:::\n'],
  ['Clue',    ':::clue THE CLUE -- S1\nWhat they learn.\n!! The big line.\n>> Do not explain it.\n:::\n'],
  ['Node',    ':::node A | Name of the node | place | start\nWhat is there, briefly.\n-> B  The clue that points at B.\n-> C  The clue that points at C.\n:::\n'],
  ['Web',     ':::web WHAT LEADS WHERE\n:::\n'],
  ['Reveal',  ':::reveal The thing they have to work out\n- A: Where they can learn it.\n- B: Where else.\n- C: And a third, because they will miss one.\n:::\n'],
  ['NPC',     ':::npc Name | race, role, one physical thing\nWANT: \nVOICE: \nBREAK: \nLINE: \nUSE: \n:::\n'],
  ['Stat',    ':::stat Name | CR 1/2 | AC 12 | HP 22 | SPD 30 ft | STR +2 | DEX +0 | CON -2 | INT -4 | WIS +0 | CHA -3\n**Attack** +4, 5 ft: 7 (2d6) damage.\n> Area 1 -- x2\n:::\n'],
  ['Caster',  ':::stat Name | CR 2 | AC 12 | HP 33 | SPD 30 ft | STR +0 | DEX +2 | CON +1 | INT +3 | WIS +1 | CHA +2\nSAVES: INT +5, WIS +3\nSPELLS: DC 13, +5 -- at will *mage hand* -- 2/day *hold person*\n> Area 1\n:::\n'],
  ['Rooms',   ':::rooms | AREA | WHAT IS THERE\n1 | THE STAIR | Sticks shut. DC 12 Athletics, or press on.\n2 | THE STACK | Unsorted, enormous. Anything they want is here.\n:::\n'],
  ['Item',    ':::item The Somnolent Stamp | Wondrous, rare -- found in S1\nWhat it does, in two sentences.\n:::\n'],
  ['Puzzle',  ':::puzzle The Sealed Nameplate | Painted over, eleven years ago\nLOOKS: What they see first.\nSOLVE: The intended answer, and the roll if they force it.\nFAIL: What it costs. Never a dead end.\n:::\n'],
  ['Roll',    ':::roll d6 | COMPLICATION\n1 First thing.\n2 Second thing.\n:::\n'],
  ['Track',   ':::track\nAlarm: 6\nLantern: 4\n:::\n'],
  ['Valves',  ":::valve\nIf it's dragging: \nIf it's going fast: \n:::\n"],
  ['Box',     ':::box plain | TITLE\nText.\n:::\n'],
  ['Cols',    ':::cols 2\nContent.\n:::\n'],
  ['Table',   '| A | B |\n|---|---|\n| 1 | 2 |\n'],
  ['Dungeon', '```dungeon\n#########\n#1...+.2#\n#...#...#\n#########\n```\n'],
  ['New page','\n+++\n\n']
];

$('#edbar').innerHTML = SNIP.map((s,i) => `<button class="chip" data-s="${i}">${s[0]}</button>`).join('');
$('#edbar').addEventListener('click', e => {
  const b = e.target.closest('[data-s]');
  if(!b) return;
  insertAtCursor(SNIP[+b.dataset.s][1]);
  ta.focus();
});

/* toolbar */
function toggleEdit(){
  editing = !editing;
  document.body.classList.toggle('editing', editing);
  $('#editBtn').classList.toggle('on', editing);
  $('#editBtn').textContent = editing ? 'Reading' : 'Edit';
  if(editing) ta.focus();
}
$('#editBtn').addEventListener('click', toggleEdit);

/* ---------- page setup ----------
   One form, two jobs: New builds a page from it, Page… edits the one
   you are on. The fields are the front matter — everything that ends up
   between the --- lines at the top of the .md file. */

const META_FIELDS = [
  ['title',     'Title',        'The big line'],
  ['kicker',    'Kicker',       'Small red line above the title'],
  ['number',    'Number',       'Large grey numeral, top right'],
  ['subtitle',  'Subtitle',     'Grey line under the title'],
  ['head',      'Running head', 'Top left of every page'],
  ['headright', 'Head right',   'Top right of every page']
];

function metaModal(opts){
  const v = opts.values || {};
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML =
    `<div class="modal-content" role="dialog" aria-modal="true" aria-label="${Markup.esc(opts.heading)}">
       <h3>${Markup.esc(opts.heading)}</h3>
       ${META_FIELDS.map(([k, label, hint]) => `
         <label for="doc-${k}">${label}<small>${hint}</small></label>
         <input type="text" id="doc-${k}" value="${Markup.esc(v[k] || '')}">`).join('')}
       ${opts.withFile ? `
         <label for="doc-file">File name<small>Commit it to content/ under this name</small></label>
         <input type="text" id="doc-file" value="${Markup.esc(v.file || '')}">` : ''}
       ${opts.withBody ? `
         <label for="doc-body">Initial content</label>
         <textarea id="doc-body" rows="5">Write here.</textarea>` : ''}
       <div class="modal-actions">
         <button class="btn" data-act="cancel">Cancel</button>
         <button class="btn solid" data-act="ok">${Markup.esc(opts.submitLabel)}</button>
       </div>
     </div>`;

  const close = () => { modal.remove(); document.removeEventListener('keydown', onKey); };
  const read = () => {
    const out = {};
    META_FIELDS.forEach(([k]) => { out[k] = modal.querySelector('#doc-' + k).value.trim(); });
    if(opts.withFile) out.file = modal.querySelector('#doc-file').value.trim();
    if(opts.withBody) out.body = modal.querySelector('#doc-body').value;
    return out;
  };
  const submit = () => { opts.onSubmit(read()); close(); };
  function onKey(e){
    if(e.key === 'Escape'){ e.preventDefault(); close(); }
    if(e.key === 'Enter' && e.target.tagName === 'INPUT'){ e.preventDefault(); submit(); }
  }

  modal.addEventListener('click', e => {
    if(e.target === modal) return close();
    const act = e.target.closest('[data-act]');
    if(!act) return;
    if(act.dataset.act === 'cancel') close(); else submit();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(modal);
  modal.querySelector('#doc-title').focus();
  modal.querySelector('#doc-title').select();
  return modal;
}

/* write the form back onto a doc and persist it as a draft */
function applyMeta(d, vals){
  META_FIELDS.forEach(([k]) => { d[k] = vals[k]; });
  d.dirty = true;
  store.drafts[d.file] = Markup.serialize(d);
}

$('#newBtn').addEventListener('click', () => metaModal({
  heading: 'New page',
  submitLabel: 'Create',
  withBody: true,
  values: { title: 'New page' },
  onSubmit: vals => {
    const t = vals.title || 'New page';
    let file = slug(t) + '.md', n = 2;
    while(docs.some(d => d.file === file)) file = slug(t) + '-' + (n++) + '.md';
    const d = { file, md: (vals.body || 'Write here.') + '\n', base: null, dirty: true };
    applyMeta(d, Object.assign({}, vals, { title: t }));
    docs.push(d);
    cur = docs.length - 1;
    draw(); writeStore();
    if(!editing) toggleEdit();
  }
}));

function openPageSetup(){
  const d = docs[cur];
  if(!d) return;
  metaModal({
    heading: 'Page setup',
    submitLabel: 'Apply',
    withFile: true,
    values: d,
    onSubmit: vals => {
      const was = d.file;
      const file = (vals.file || was).replace(/[^\w.\- ]+/g, '').trim() || was;
      if(file !== was){
        if(docs.some(x => x !== d && x.file === file)) return toast('A page already uses that file name');
        delete store.drafts[was];
        d.file = file;
        // the committed file still lives under the old name, so there is
        // nothing to revert this one to any more
        d.base = null;
        toast('Renamed — update content/manifest.json to match');
      }
      applyMeta(d, vals);
      draw(); writeStore();
    }
  });
}
$('#pageBtn').addEventListener('click', openPageSetup);

$('#dlBtn').addEventListener('click', () => {
  const d = docs[cur];
  download(d.file, Markup.serialize(d));
  toast('Saved ' + d.file + ' — commit it to content/');
});

$('#prtBtn').addEventListener('click', openPrintBox);
$('#pbClose').addEventListener('click', closePrintBox);
$('#scrim').addEventListener('click', closePrintBox);
$('#pbPageBtn').addEventListener('click', () => doPrint('page'));
$('#pbBookBtn').addEventListener('click', () => doPrint('book'));
$('#pbPage').addEventListener('change', e => { cfg.page = e.target.value; applyConfig(); writeStore(); });
$('#pbMargin').addEventListener('change', e => { cfg.margin = e.target.value; applyConfig(); writeStore(); });
$('#pbText').addEventListener('input', e => {
  cfg.text = parseFloat(e.target.value);
  $('#pbTextOut').value = cfg.text + 'pt';
  applyConfig(); writeStore();
});
$('#pbMono').addEventListener('change', e => { cfg.mono = e.target.checked; applyConfig(); writeStore(); });

$('#navBtn').addEventListener('click', () => document.body.classList.toggle('nav'));
const mq = window.matchMedia('(max-width:860px)');
const syncNav = () => { $('#navBtn').hidden = !mq.matches; };
mq.addEventListener('change', syncNav); syncNav();

document.addEventListener('keydown', e => {
  const cmd = e.metaKey || e.ctrlKey;
  if(cmd && e.key.toLowerCase() === 'e'){ e.preventDefault(); toggleEdit(); }
  if(cmd && e.key.toLowerCase() === 's'){ e.preventDefault(); $('#dlBtn').click(); }
  if(cmd && e.key.toLowerCase() === 'i'){ e.preventDefault(); openPageSetup(); }
  if(e.key === 'Escape' && !$('#printbox').hidden) closePrintBox();
});

boot();
})();
