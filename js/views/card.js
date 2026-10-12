/* The match card: slides up from underneath (glass), one match at a time.
   Score + scorers, then two tabs: Stats (+ starting lineup) and Group (group stage) or Knockout (road to the final).
   Closes with ✕, Esc, a tap outside, or a pull down from the top of its content. */
import { state } from '../store.js';
import { t, teamName, flag, esc, venueText, slotText } from '../i18n.js';
import { surname } from '../logic/names.js';
import { matchStatus } from './match-status.js';
import { setPill } from './shell.js';

const $ = id => document.getElementById(id);
const sheet = $('sheet'), wrap = $('deck-wrap'), deck = $('deck');
let openId = null, titleOf = () => '';
const tabs = {}, luTab = {};
const fixtureOf = id => state.data.fixtures.find(f => f.id === id);
const matchOf = id => state.model.byId.get(id);

/* a team, or its slot text while the knockout hasn't decided it yet */
const sideName = (m, side) => m[side] ? teamName(m[side]) : slotText(fixtureOf(m.id)[side]);
const minute = mn => (mn || '').toString().replace(/\s+/g, '').replace(/'+$/, '') + "'";
const sameName = (a, b) => !!a && !!b && (a.toLowerCase() === b.toLowerCase() || surname(a) === surname(b));

/* ── stats: whatever the provider sends, else bookings counted from the lineups feed ── */
const STAT_KEYS = ['possession', 'shots', 'shotsOnTarget', 'corners', 'fouls', 'yellow', 'red', 'offsides'];
function statRows(m, s){
  const st = { ...(m.result?.stats || {}) };
  if(m.extra && s.phase !== 'upcoming' && !st.yellow){
    const n = (team, re) => m.extra.cards.filter(c => c.team === team && re.test(c.card || '')).length;
    st.yellow = [n(m.home, /yellow/i), n(m.away, /yellow/i)];
    st.red = [n(m.home, /red|second/i), n(m.away, /red|second/i)];
  }
  return STAT_KEYS.filter(k => Array.isArray(st[k])).map(k => [k, st[k]]);
}
function statsHTML(m, s){
  const rows = statRows(m, s), names = t('statNames');
  if(!rows.length) return `<p class="empty">${t(s.phase === 'upcoming' ? 'statsSoon' : 'noStats')}</p>`;
  return rows.map(([k, [h, a]]) => { const pct = k === 'possession' ? '%' : '';
    return `<div class="stat"><span class="lbl">${names[k]}</span><span class="v">${h}${pct}</span>
      <div class="bars"><i class="home" style="flex:${h || .001}"></i><i style="flex:${a || .001}"></i></div><span class="v away">${a}${pct}</span></div>`;
  }).join('');
}

/* ── starting lineup: one pitch per team, swapped with the formation switch ── */
const ICON = {
  down: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2v8M2.5 6.5L6 10l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  up: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10V2M2.5 5.5L6 2l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  glove: '<svg viewBox="0 0 12 12" aria-hidden="true" style="width:11px;height:11px"><path d="M3 11V6.5L2 4.8a.8.8 0 0 1 1.3-.9L4 5V2.2a.7.7 0 0 1 1.4 0V5V1.6a.7.7 0 0 1 1.4 0V5V2a.7.7 0 0 1 1.4 0v3.3V3a.7.7 0 0 1 1.3 0v4.6c0 1.9-1.2 3.4-3 3.4z" fill="currentColor"/></svg>'
};
/* "4-2-3-1" → rows of the XI after the keeper, back line first; unknown formation → keeper + everyone else */
function lineRows(lu){
  const xi = lu.xi || [], parts = String(lu.formation || '').split('-').map(Number).filter(n => n > 0);
  if(parts.reduce((n, p) => n + p, 0) !== xi.length - 1) return [xi.slice(0, 1), xi.slice(1)];
  const rows = [xi.slice(0, 1)]; let i = 1;
  for(const p of parts){ rows.push(xi.slice(i, i + p)); i += p; }
  return rows;
}
const shortName = n => { const w = String(n || '').trim().split(/\s+/); return w.length > 1 ? `${w[0][0]}. ${w.slice(1).join(' ')}` : (n || ''); };
function playerHTML(p, m, team, isGk){
  const side = team === m.home ? 'h' : 'a';
  const goals = (m.result?.goals || []).filter(g => g.side === side && !g.og && sameName(g.name, p.name)).length;
  const cards = (m.extra?.cards || []).filter(c => c.team === team && sameName(c.player, p.name));
  const red = cards.some(c => /red|second/i.test(c.card || ''));
  return `<div class="pl${isGk ? ' gk' : ''}"><span class="av">${esc(p.number ?? '')}
      ${cards.length ? `<span class="bd bk${red ? ' red' : ''}"></span>` : ''}
      ${goals ? `<span class="bd goal">${goals > 1 ? `<b>${goals}</b>` : ''}</span>` : ''}
      ${p.off ? `<span class="bd off">${ICON.down}</span>` : ''}</span>
    <span class="nm">${esc(shortName(p.name))}</span>
    <span class="no">${isGk ? `${ICON.glove}${t('gk')} · ${esc(p.number ?? '')}` : esc(p.number ?? '')}</span></div>`;
}
function pitchHTML(m){
  const lu = m.extra?.lineups, side = luTab[m.id] ?? 0, team = side ? m.away : m.home, l = lu?.[team];
  if(!l?.xi?.length) return '';
  const rows = lineRows(l).reverse();             /* attack at the top, keeper at the bottom */
  return `<div class="pitch" data-side="${side ? 'away' : 'home'}">${rows.map((r, k) =>
      `<div class="lu-row">${r.map(p => playerHTML(p, m, team, k === rows.length - 1)).join('')}</div>`).join('')}</div>
    ${l.subs?.length ? `<div class="bench"><div class="bench-h"><span>${t('bench')}</span><span>${t('subsLbl')}</span></div><ol>${l.subs.map(p =>
      `<li><span class="n">${esc(p.number ?? '')}</span><span>${esc(shortName(p.name))}</span>${p.on ? `<span class="on">${ICON.up}${esc(minute(p.on))}</span>` : '<span></span>'}</li>`).join('')}</ol></div>` : ''}`;
}
function lineupHTML(m){
  const lu = m.extra?.lineups;
  if(!lu || !(lu[m.home]?.xi?.length || lu[m.away]?.xi?.length)) return '';
  return `<section class="lineup"><h4>${t('startingLineup')}</h4>
    <div class="seg lu-seg" role="tablist" style="--n:2"><span class="seg-pill" aria-hidden="true"></span>
      ${[m.home, m.away].map((c, i) => `<button type="button" role="tab" data-i="${i}">${flag(c)}<span>${esc(lu[c]?.formation || teamName(c))}</span></button>`).join('')}</div>
    <div class="lu-body">${pitchHTML(m)}</div></section>`;
}

/* ── second tab: the group table, or the road to the final ── */
function groupHTML(m){
  const rows = state.model.tables[m.group] || [], h = t('table');
  return `<table class="gt"><thead><tr><th>#</th><th>${h.team}</th><th>${h.p}</th><th>${h.w}</th><th>${h.d}</th><th>${h.l}</th><th>${h.gd}</th><th>${h.pts}</th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr${[m.home, m.away].includes(r.code) ? ' class="in"' : ''}${i < 2 ? ' data-q="top2"' : ''}><td>${i + 1}</td>
      <td><span>${flag(r.code)}${teamName(r.code)}</span></td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GD > 0 ? '+' : ''}${r.GD}</td><td>${r.Pts}</td></tr>`).join('')}</tbody></table>`;
}
function pathHTML(m){
  const ko = state.data.fixtures.filter(f => f.stage !== 'group'), road = [];
  let cur = m.id, next;
  while((next = ko.find(f => f.home === 'W' + cur || f.away === 'W' + cur))){
    const other = next.home === 'W' + cur ? next.away : next.home, n = other.slice(1);
    const known = state.model.winner[n];
    road.push(`<li><b>${roundOf(next.stage)} · ${t('match')} ${next.id}</b><span>${t('then')}: ${known ? teamName(known) : t('winnerOf')(n)}</span></li>`);
    cur = next.id;
  }
  return `<ol class="path"><li class="here"><b>${roundOf(m.stage)} · ${t('match')} ${m.id}</b><span>${sideName(m, 'home')} – ${sideName(m, 'away')}</span></li>${road.join('')}</ol>`;
}
const roundOf = stage => state.data.tournament.roundLabel[stage]?.[state.lang] || stage;

/* ── the card ── */
const tabOf = (m, s) => tabs[m.id] ?? (s.phase === 'upcoming' ? 1 : 0);
const paneHTML = (m, s) => tabOf(m, s) === 0 ? statsHTML(m, s) + lineupHTML(m) : m.stage === 'group' ? groupHTML(m) : pathHTML(m);
function centerHTML(m, s){
  return s.score ? `<b>${s.score}</b><span class="${s.phase === 'live' ? 'is-live live-dot' : ''}">${esc(s.label)}</span>`
    : `<b class="small">${esc(s.label)}</b><span>${t('kickoff')}</span>`;
}
function cardHTML(m){
  const s = matchStatus(m, Date.now());
  const team = side => `<div class="st-team">${flag(m[side])}<span class="team-name"${m[side] ? '' : ' data-tbd'}>${esc(sideName(m, side))}</span></div>`;
  const goals = (m.result?.goals || []).map(g => `<li data-side="${g.side === 'h' ? 'home' : 'away'}"><span class="min">${esc(minute(g.minute))}</span><span class="ball"></span>
     <span>${esc(g.name)}${g.pen || g.og ? ` <small>(${[g.pen && t('pen'), g.og && t('og')].filter(Boolean).join(', ')})</small>` : ''}</span></li>`).join('');
  const short = side => m[side] || '';
  return `<article class="card" data-id="${m.id}" aria-label="${esc(sideName(m, 'home'))} – ${esc(sideName(m, 'away'))}">
    <div class="card-bar" aria-hidden="true">${flag(m.home)}<span>${short('home')}</span><span class="bar-score">${s.score || esc(s.label)}</span><span>${short('away')}</span>${flag(m.away)}<span class="bar-status">${s.score ? esc(s.label) : ''}</span></div>
    <button type="button" class="card-close" aria-label="${t('close')}"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    <div class="card-scroll">
      <div class="card-top"><div class="grabber" aria-hidden="true"></div>
        <p class="sheet-meta">${esc(venueText(m.venue))}</p>
        <div class="sheet-teams">${team('home')}<div class="st-score">${centerHTML(m, s)}</div>${team('away')}</div></div>
      <div class="sheet-band" aria-hidden="true"></div>
      <div class="sheet-body">${s.phase !== 'upcoming' ? `<ol class="timeline">${goals || `<li class="none">${t('noGoalsYet')}</li>`}</ol>` : ''}
        <div class="seg card-seg" role="tablist" style="--n:2"><span class="seg-pill" aria-hidden="true"></span>
          <button type="button" role="tab" data-i="0">${t('stats')}</button><button type="button" role="tab" data-i="1">${m.stage === 'group' ? `${t('group')} ${m.group}` : t('knockout')}</button></div>
        <div class="card-pane">${paneHTML(m, s)}</div></div>
    </div></article>`;
}
function syncPills(m){
  const s = matchStatus(m, Date.now());
  const cs = deck.querySelector('.card-seg'); if(cs) setPill(cs, tabOf(m, s));
  const ls = deck.querySelector('.lu-seg'); if(ls) setPill(ls, luTab[m.id] ?? 0);
}
function build(){
  const m = matchOf(openId); if(!m) return;
  $('deck-title').textContent = titleOf();
  const y = deck.querySelector('.card-scroll')?.scrollTop || 0;
  deck.innerHTML = cardHTML(m); syncPills(m);
  deck.querySelector('.card-scroll').scrollTop = y;
}
/* new feed data or language: redraw the open card in place */
export const refreshCard = () => { if(sheet.open && openId != null) build(); };
/* every second: the live clock on the open card */
export function tickCard(){
  if(!sheet.open || openId == null) return;
  const m = matchOf(openId); if(!m) return;
  const s = matchStatus(m, Date.now());
  const span = deck.querySelector('.st-score span'), bar = deck.querySelector('.bar-status');
  if(span && s.score && span.textContent !== s.label) span.textContent = s.label;
  if(bar && s.score && bar.textContent !== s.label) bar.textContent = s.label;
}

/* iOS lets a modal's swipes scroll the page underneath; pin the page while a card is open */
let savedY = 0;
function lockPage(on){
  const b = document.body;
  if(on){ savedY = scrollY; Object.assign(b.style, { position: 'fixed', top: -savedY + 'px', insetInline: '0' }); $('app').style.transformOrigin = `50% ${savedY}px`; }
  else { b.style.position = b.style.top = b.style.insetInline = ''; scrollTo({ top: savedY, behavior: 'instant' }); }
}
export function openCard(id, title){
  openId = id; titleOf = title || (() => '');
  wrap.style.removeProperty('--pull');
  lockPage(true); sheet.showModal(); build();
  document.documentElement.classList.add('sheet-open');
  void wrap.offsetHeight;                        /* commit the start position, then slide */
  sheet.classList.add('up');
}
function closeCard(){
  if(!sheet.open || !sheet.classList.contains('up')) return;
  sheet.classList.remove('up', 'dragging'); wrap.style.removeProperty('--pull'); document.documentElement.classList.remove('sheet-open');
  let finished = false;
  const done = () => { if(finished || sheet.classList.contains('up')) return; finished = true; sheet.close(); openId = null; lockPage(false); };
  wrap.addEventListener('transitionend', e => { if(e.target === wrap) done(); }, { once: true });
  setTimeout(done, 450);                         /* the slide-down is 0.35 s; never leave an invisible overlay */
}

export function initCard(){
  sheet.addEventListener('cancel', e => { e.preventDefault(); closeCard(); });
  sheet.addEventListener('click', e => {
    if([sheet, deck, wrap, $('deck-title')].includes(e.target) || e.target.closest('.card-close')) return closeCard();
    const m = matchOf(openId); if(!m) return;
    const cb = e.target.closest('.card-seg button');
    if(cb){ tabs[m.id] = +cb.dataset.i; const seg = cb.parentElement; seg.classList.add('animate'); setPill(seg, tabs[m.id]);
      deck.querySelector('.card-pane').innerHTML = paneHTML(m, matchStatus(m, Date.now())); syncPills(m); return; }
    const lb = e.target.closest('.lu-seg button');
    if(lb){ luTab[m.id] = +lb.dataset.i; const seg = lb.parentElement; seg.classList.add('animate'); setPill(seg, luTab[m.id]);
      deck.querySelector('.lu-body').innerHTML = pitchHTML(m); }
  });
  /* the compact score bar fades in as the big score scrolls away */
  deck.addEventListener('scroll', e => {
    const cs = e.target; if(!cs.classList?.contains('card-scroll')) return;
    const top = cs.querySelector('.card-top').offsetHeight;
    cs.parentElement.querySelector('.card-bar').style.opacity = Math.min(1, Math.max(0, (cs.scrollTop - top + 70) / 50));
  }, { capture: true, passive: true });

  /* pull down to dismiss; a vertical swipe the card can't use never reaches the page */
  let x0 = 0, y0 = 0, dy = 0, hist = [], active = false, dragging = false, cs = null;
  const start = (y, tm, el) => { cs = el.closest('.card-scroll'); active = !!cs && cs.scrollTop <= 0; y0 = y; dy = 0; hist = [[y, tm]]; dragging = false; };
  const move = (y, tm) => {
    if(!active) return false; dy = y - y0;
    if(!dragging && dy > 6 && cs.scrollTop <= 0){ dragging = true; sheet.classList.add('dragging'); }
    if(!dragging) return false;
    wrap.style.setProperty('--pull', Math.max(0, dy) + 'px'); hist.push([y, tm]); if(hist.length > 5) hist.shift(); return true;
  };
  const end = () => {
    if(!dragging){ active = false; return; }
    dragging = active = false; sheet.classList.remove('dragging');
    const [a, b] = [hist[0], hist[hist.length - 1]], v = (b[0] - a[0]) / Math.max(1, b[1] - a[1]) * 1000;
    if(dy > 110 || v > 700) closeCard(); else wrap.style.removeProperty('--pull');
  };
  deck.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; start(e.touches[0].clientY, e.timeStamp, e.target); }, { passive: true });
  deck.addEventListener('touchmove', e => {
    const tc = e.touches[0];
    if(move(tc.clientY, e.timeStamp)) return e.preventDefault();
    const ddx = tc.clientX - x0, ddy = tc.clientY - y0;
    if(Math.abs(ddy) <= Math.abs(ddx)) return;
    const c = e.target.closest('.card-scroll');
    const stuck = !c || c.scrollHeight <= c.clientHeight
      || (ddy < 0 && c.scrollTop + c.clientHeight >= c.scrollHeight - 1) || (ddy > 0 && c.scrollTop <= 0);
    if(stuck) e.preventDefault();
  }, { passive: false });
  deck.addEventListener('touchend', end); deck.addEventListener('touchcancel', end);
  deck.addEventListener('pointerdown', e => { if(e.pointerType !== 'mouse' || !e.target.closest('.card-top') || e.target.closest('button')) return;
    start(e.clientY, e.timeStamp, e.target); e.target.setPointerCapture(e.pointerId); });
  deck.addEventListener('pointermove', e => { if(e.pointerType === 'mouse') move(e.clientY, e.timeStamp); });
  deck.addEventListener('pointerup', e => { if(e.pointerType === 'mouse') end(); });
}
