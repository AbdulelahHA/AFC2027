/* Scores: Yesterday · Today · Upcoming (calendar days in the tournament timezone), side by side,
   swiped or switched with the segmented control. A 1-second tick updates only the time-dependent
   bits (state, score, clock, goal flash, countdown); tapping a match opens its card. */
import { state } from '../store.js';
import { t, teamName, dayName, monthName, roundLabel, flag, slotText, esc } from '../i18n.js';
import { local, countdown } from '../time.js';
import { goalFx, GOAL_FX_MS } from '../live.js';
import { matchStatus, saveClock, kickoffText } from './match-status.js';
import { setPill } from './shell.js';
import { openCard } from './card.js';

const $ = id => document.getElementById(id);
const panes = $('panes'), days = $('days');
const TABS = ['yesterday', 'today', 'upcoming'], EMPTY = ['noYesterday', 'noToday', 'noUpcoming'];
let current = null, renderedSig = '';

const dayNum = ms => { const p = local(ms); return p.y * 10000 + (p.mo + 1) * 100 + p.d; };
const fixtureOf = id => state.data.fixtures.find(f => f.id === id);

/* the three panes, each a list of [dayNum, matches] */
function split(now){
  const today = dayNum(now), yest = dayNum(now - 864e5), byDay = new Map();
  for(const m of state.model.matches){ const k = dayNum(m.kickoff); if(!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(m); }
  const all = [...byDay].sort((a, b) => a[0] - b[0]);
  return [all.filter(([k]) => k === yest), all.filter(([k]) => k === today), all.filter(([k]) => k > today)];
}

/* a team picked for goal alerts wears a star (coloured by the visit's region) */
export const starHTML = code => state.follow.includes(code)
  ? `<svg class="star" viewBox="0 0 12 12" role="img" aria-label="★"><path d="M6 .7l1.62 3.3 3.63.52-2.63 2.56.62 3.62L6 9l-3.24 1.7.62-3.62L.75 4.52l3.63-.52z"/></svg>` : '';
function side(m, which){
  if(m[which]) return `${flag(m[which])} <span class="team-name">${esc(teamName(m[which]))}</span>${starHTML(m[which])}`;
  return `<span class="team-name" data-tbd>${esc(slotText(fixtureOf(m.id)[which]))}</span>`;
}
const stageText = m => m.stage === 'group' ? `${t('group')} ${m.group}` : roundLabel(m.stage);

function rowHTML(m){
  const spot = state.data.tournament.spotlight;
  return `<li class="match" data-id="${m.id}" data-stage="${m.stage}"${m.group ? ` data-group="${m.group}"` : ''}${spot && (m.home === spot || m.away === spot) ? ' data-spotlight' : ''}>
    <button type="button" class="row">
      <time class="kickoff"${m.timeTBC ? ' data-tbc' : ` datetime="${new Date(m.kickoff).toISOString()}"`}>${esc(kickoffText(m))}</time>
      <span class="team home">${side(m, 'home')}</span>
      <span class="score"></span>
      <span class="team away">${side(m, 'away')}</span>
      <span class="status"></span>
      <span class="stage">${esc(stageText(m))}</span>
    </button></li>`;
}
function dayHTML(list, isToday){
  const p = local(list[0].kickoff);
  return `<section class="day"${isToday ? ' data-day="today" id="today"' : ''}>
    <h3><time>${dayName(p.weekday)} ${p.d} ${monthName(p.mo)}</time> <small>(${t('matchesN')(list.length)})</small></h3>
    ${isToday ? '<p class="countdown" hidden></p>' : ''}<ol class="matches">${list.map(rowHTML).join('')}</ol></section>`;
}

/* before the first match: count down to it (to the start of its day while its time is TBC) */
const opening = () => state.model.matches[0];
const openingAt = m => m.timeTBC ? Date.parse(`${m.date}T00:00:00+03:00`) : m.kickoff;
function heroHTML(m){
  const p = local(m.kickoff), u = t('units'), team = c => `${flag(c)}<span>${esc(teamName(c))}</span>${starHTML(c)}`;
  return `<section class="hero"><p class="hero-k">${t('startsIn')}</p>
    <div class="hero-clock">${['d', 'h', 'm', 's'].map(k => `<span><b data-u="${k}">–</b><small>${u[k]}</small></span>`).join('')}</div>
    <button type="button" class="hero-match" data-id="${m.id}">${team(m.home)}<span class="vs">${t('vs')}</span>${team(m.away)}</button>
    <p class="hero-meta">${t('openingMatch')} · ${dayName(p.weekday)} ${p.d} ${monthName(p.mo)}</p></section>`;
}
/* Today with no matches: the countdown before the tournament, else when the next matches are */
function emptyToday(parts, now){
  if(now < openingAt(opening())) return heroHTML(opening());
  const next = parts[2][0];
  if(!next) return `<p class="empty">${t('noToday')}</p>`;
  const p = local(next[1][0].kickoff);
  return `<div class="empty"><p>${t('noToday')}</p><button type="button" class="next-btn">${t('nextOn')(`${dayName(p.weekday)} ${p.d} ${monthName(p.mo)}`)} ›</button></div>`;
}

/* rebuild when the day, the teams on the cards or the language change; otherwise just tick */
export function renderScores(){
  if(!state.model) return;
  const now = Date.now(), parts = split(now);
  const sig = state.lang + dayNum(now) + state.model.matches.map(m => `${m.id}:${m.home}>${m.away}`).join('|') + '*' + state.follow.join();
  if(sig !== renderedSig){
    renderedSig = sig;
    TABS.forEach((k, i) => { $('tab-' + i).textContent = t(k); });
    parts.forEach((list, i) => {
      $('pane-' + i).innerHTML = list.length ? list.map(([, ms]) => dayHTML(ms, i === 1)).join('')
        : i === 1 ? emptyToday(parts, now) : `<p class="empty">${t(EMPTY[i])}</p>`;
    });
    /* first time: Today (matches, the countdown, or when the next ones are); after the final, what just happened */
    if(current == null) current = parts[1].length || parts[2].length ? 1 : 0;
    requestAnimationFrame(() => showPane(current, false));
  }
  tick();
}

export function tick(){
  if(!state.model) return;
  const now = Date.now();
  if(dayNum(now) !== +renderedSig.slice(2, 10)) return renderScores();      /* midnight in Mecca: new panes */
  let next = null;
  for(const el of panes.querySelectorAll('.match')){
    const m = state.model.byId.get(+el.dataset.id), s = matchStatus(m, now);
    el.dataset.state = s.phase;
    if(s.winner) el.dataset.winner = s.winner === 'h' ? 'home' : 'away'; else delete el.dataset.winner;
    const sc = el.querySelector('.score'), st = el.querySelector('.status'), lbl = s.phase === 'upcoming' ? '' : s.label;
    if(sc.textContent !== (s.score || '')) sc.textContent = s.score || '';
    if(st.textContent !== lbl) st.textContent = lbl;
    const g = ['h', 'a'].find(x => now - (goalFx.get(m.id + '|' + x) || 0) < GOAL_FX_MS);
    if(g) el.dataset.goal = g === 'h' ? 'home' : 'away'; else delete el.dataset.goal;
    if(el.closest('#pane-1') && !next && s.phase === 'upcoming' && !m.timeTBC && m.kickoff > now) next = m;
  }
  const hero = panes.querySelector('.hero-clock');
  if(hero){
    let s = Math.max(0, Math.floor((openingAt(opening()) - now) / 1000));
    const v = { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
    for(const b of hero.querySelectorAll('b')){ const x = String(v[b.dataset.u]).padStart(b.dataset.u === 'd' ? 1 : 2, '0'); if(b.textContent !== x) b.textContent = x; }
  }
  const cd = panes.querySelector('#pane-1 .countdown');
  if(cd){
    cd.hidden = !next;
    if(next){ const c = countdown(next.kickoff - now); cd.textContent = `${t('nextKickoff')} ${c.d ? c.d + 'd ' : ''}${c.clock}`; }
  }
  saveClock();
}

/* ── the Yesterday · Today · Upcoming switch: the pill follows a swipe 1:1, a tap scrolls to the pane ── */
/* the row of panes is as tall as the pane in view (mid-swipe: the taller of the two), not the tallest of all three */
function fitHeight(pos){
  const h = i => $('pane-' + i)?.offsetHeight || 0;
  panes.style.height = Math.max(h(Math.floor(pos)), h(Math.ceil(pos))) + 'px';
}
function showPane(i, smooth = true){
  current = i; fitHeight(i);
  panes.scrollTo({ left: (document.documentElement.dir === 'rtl' ? -1 : 1) * i * panes.clientWidth, behavior: smooth ? 'smooth' : 'instant' });
  setPill(days, i);
}

export function initScores(){
  panes.addEventListener('scroll', () => {
    days.classList.remove('animate');
    const pos = Math.abs(panes.scrollLeft) / panes.clientWidth;
    setPill(days, pos); current = Math.round(pos); fitHeight(pos);
  }, { passive: true });
  /* a pane's content changed (new day, feed, language): refit */
  const ro = new ResizeObserver(() => current != null && fitHeight(Math.abs(panes.scrollLeft) / panes.clientWidth || current));
  for(const p of panes.children) ro.observe(p);
  days.addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; days.classList.add('animate'); showPane(+b.dataset.i); });
  days.addEventListener('keydown', e => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if(!step) return;
    const n = Math.min(2, Math.max(0, current + step * (document.documentElement.dir === 'rtl' ? -1 : 1)));
    days.classList.add('animate'); showPane(n); $('tab-' + n).focus();
  });
  addEventListener('resize', () => current != null && showPane(current, false));
  panes.addEventListener('click', e => {
    const h = e.target.closest('.hero-match'); if(h) return openCard(+h.dataset.id, () => t('openingMatch'));
    if(e.target.closest('.next-btn')){ days.classList.add('animate'); return showPane(2); }
    const r = e.target.closest('.row'); if(!r) return;
    const pane = +r.closest('.pane').id.slice(-1);
    openCard(+r.closest('.match').dataset.id, () => t(TABS[pane]));
  });
}
/* after a page switch back to Scores, line the panes up again */
export const realignScores = () => current != null && requestAnimationFrame(() => showPane(current, false));
