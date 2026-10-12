/* Schedule: one <section> per day, one <li> per match with a native
   <details> for the match info. A 1-second tick updates only the
   time-dependent parts (state, score, clock, countdown). */
import { state } from '../store.js';
import { t, teamName, dayName, monthName, roundLabel, flag, slotText, plural } from '../i18n.js';
import { local, countdown } from '../time.js';
import { MATCH_LEN } from '../logic/status.js';
import { goalFx, GOAL_FX_MS, lastUpdate } from '../live.js';
import { matchStatus, saveClock, kickoffText } from './match-status.js';
import { matchDetailsHTML } from './match-details.js';

const $ = id => document.getElementById(id);
let renderedSig = '';

const fixtureOf = id => state.data.fixtures.find(f => f.id === id);
const side = (m, which) => {
  const code = m[which];
  if(code) return `${flag(code)} <span class="team-name">${teamName(code)}</span>`;
  return `<span class="team-name" data-tbd>${slotText(fixtureOf(m.id)[which])}</span>`;
};
const stageText = m => m.stage === 'group' ? `${t('group')} ${m.group}` : roundLabel(m.stage);

function matchHTML(m){
  const spot = state.data.tournament.spotlight;
  return `<li class="match" data-id="${m.id}" data-stage="${m.stage}"${m.group ? ` data-group="${m.group}"` : ''}${spot && (m.home === spot || m.away === spot) ? ' data-spotlight' : ''}>
    <details>
      <summary>
        <time class="kickoff"${m.timeTBC ? ' data-tbc' : ` datetime="${new Date(m.kickoff).toISOString()}"`}>${kickoffText(m)}</time>
        <span class="team home">${side(m, 'home')}</span>
        <span class="score"></span>
        <span class="team away">${side(m, 'away')}</span>
        <span class="status"></span>
        <span class="stage">${stageText(m)}</span>
      </summary>
      <div class="match-details"></div>
    </details>
  </li>`;
}

function dayHTML(key, list){
  const p = local(list[0].kickoff);
  return `<section class="day" data-date="${key}">
    <h3><time datetime="${new Date(list[0].kickoff).toISOString().slice(0, 10)}">${dayName(p.weekday)} ${p.d} ${monthName(p.mo)}</time>
      <small>(${list.length} ${plural(list.length, 'match', 'matches')})</small></h3>
    <p class="countdown" hidden></p>
    <ol class="matches">${list.map(matchHTML).join('')}</ol>
  </section>`;
}

/* rebuild only when teams on the cards or the language change; keep open details */
export function renderSchedule(){
  const { model } = state;
  const sig = state.lang + model.matches.map(m => `${m.id}:${m.home}>${m.away}`).join('|');
  const host = $('schedule');
  if(sig !== renderedSig){
    renderedSig = sig;
    const open = new Set([...host.querySelectorAll('details[open]')].map(d => d.closest('.match').dataset.id));
    const days = new Map();
    for(const m of model.matches){
      const key = local(m.kickoff).key;
      if(!days.has(key)) days.set(key, []);
      days.get(key).push(m);
    }
    host.innerHTML = [...days].map(([k, l]) => dayHTML(k, l)).join('');
    for(const id of open) host.querySelector(`.match[data-id="${id}"] details`)?.setAttribute('open', '');
  }
  /* refresh the content of open matches with the new data */
  for(const d of host.querySelectorAll('details[open]')) fill(d);
  tick();
}

function fill(details){
  const m = state.model.byId.get(+details.closest('.match').dataset.id);
  details.querySelector('.match-details').innerHTML = matchDetailsHTML(m);
}

export function tick(){
  const { model } = state;
  if(!model) return;
  const now = Date.now(), todayKey = local(now).key;
  let first = true;
  for(const day of document.querySelectorAll('#schedule .day')){
    const els = [...day.querySelectorAll('.match')];
    const ms = els.map(el => model.byId.get(+el.dataset.id));
    const today = day.dataset.date === todayKey;
    const past = !today && now > Math.max(...ms.map(m => m.kickoff)) + MATCH_LEN;
    day.dataset.day = today ? 'today' : past ? 'past' : 'future';

    let next = null;
    els.forEach((el, i) => {
      const m = ms[i], s = matchStatus(m, now);
      el.dataset.state = s.phase;
      if(s.winner) el.dataset.winner = s.winner === 'h' ? 'home' : 'away'; else delete el.dataset.winner;
      el.toggleAttribute('data-fav', state.favs.includes(m.home) || state.favs.includes(m.away));
      el.querySelector('.score').textContent = s.score || '';
      el.querySelector('.status').textContent = s.phase === 'upcoming' ? '' : s.label;
      /* a side that just scored is flagged for 30s */
      const g = ['h', 'a'].find(x => now - (goalFx.get(m.id + '|' + x) || 0) < GOAL_FX_MS);
      if(g) el.dataset.goal = g === 'h' ? 'home' : 'away'; else delete el.dataset.goal;
      if(today && !next && s.phase === 'upcoming' && !m.timeTBC) next = m;
    });

    const cd = day.querySelector('.countdown');
    cd.hidden = !next;
    if(next){ const c = countdown(next.kickoff - now); cd.textContent = `${t('nextKickoff')} ${c.d ? c.d + 'd ' : ''}${c.clock}`; }
    if(today && first){ day.id = 'today'; first = false; }
  }
  const fs = $('feed-updated');
  if(fs && lastUpdate) fs.textContent = Math.round((now - lastUpdate) / 1000) + 's';
  saveClock();
}

export function initSchedule(){
  /* fill a match's details the moment it is opened */
  $('schedule').addEventListener('toggle', e => { if(e.target.open) fill(e.target); }, true);
}
