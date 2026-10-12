/* Knockout: a two-sided bracket, R16 · QF · SF on each side approaching the final in the middle.
   The tree is derived from the fixtures' W-slots (final ← two semi-finals ← …), so it fits any
   tournament with a single final. Chips show flags once teams are known, slot codes until then. */
import { state } from '../store.js';
import { t, teamName, flag, slotShort, dayName, monthName } from '../i18n.js';
import { local } from '../time.js';
import { matchStatus } from './match-status.js';
import { openCard } from './card.js';

const $ = id => document.getElementById(id);
const fixtureOf = id => state.data.fixtures.find(f => f.id === id);
const feeders = id => { const f = fixtureOf(id); return [f.home, f.away].filter(s => /^W\d+$/.test(s)).map(s => +s.slice(1)); };

/* columns: [stage, side, pairs] from the outside in, then the final, then the other side */
function columns(){
  const final = state.data.tournament.bracket.final, [l, r] = feeders(final);
  const half = (sf, side) => {
    const cols = [[fixtureOf(sf).stage, side + ' in', [[sf]]]];
    let level = [sf];
    for(;;){
      const pairs = level.map(feeders).filter(p => p.length === 2);
      if(!pairs.length) break;
      level = pairs.flat();
      cols.unshift([fixtureOf(level[0]).stage, side, pairs]);
    }
    cols[0][1] = side;                                   /* the outermost column only sends */
    for(let i = 1; i < cols.length; i++) cols[i][1] = side + ' in';
    return cols;
  };
  return [...half(l, 'L'), ['final', 'F', [[final]]], ...half(r, 'R').reverse()];
}

function tieHTML(id, now){
  const m = state.model.byId.get(id), f = fixtureOf(id), s = matchStatus(m, now);
  const [hs, as] = s.score ? s.score.split('–').map(x => x.trim()) : ['', ''];
  const line = (code, slot, sc) => `<span class="tl">${code ? `${flag(code)}<span class="code">${code}</span>` : `<span class="slot">${slotShort(slot)}</span>`}${sc !== '' ? `<b class="sc">${sc}</b>` : ''}</span>`;
  return `<button type="button" class="tie" data-id="${id}" data-stage="${m.stage}" data-state="${s.phase}"${s.winner ? ` data-winner="${s.winner === 'h' ? 'home' : 'away'}"` : ''}
      aria-label="${t('match')} ${id}: ${m.home ? teamName(m.home) : slotShort(f.home)} – ${m.away ? teamName(m.away) : slotShort(f.away)}">
    <span class="no">${id}</span>${line(m.home, f.home, hs)}${line(m.away, f.away, as)}</button>`;
}

export function renderKnockout(){
  if(state.page !== 'knockout' || !state.model) return;
  const now = Date.now(), cols = columns(), short = t('short');
  const cup = `<span class="cup"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 4h12v8a6 6 0 0 1-12 0zM10 7H5v2a5 5 0 0 0 5 5M22 7h5v2a5 5 0 0 1-5 5M16 18v5M11 28h10M13 23h6v5h-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></span>`;
  const final = state.model.byId.get(state.data.tournament.bracket.final), p = local(final.kickoff);
  const champ = state.model.champion
    ? `<span class="f-when champ-team">${flag(state.model.champion)}${teamName(state.model.champion)}</span>`
    : `<span class="f-when">${dayName(p.weekday)} ${p.d} ${monthName(p.mo)}</span>`;
  $('knockout-page').innerHTML = `<div class="bk">${cols.map(([st]) => `<div class="bk-h${st === 'final' ? ' f' : ''}">${short[st] || st}</div>`).join('')}
    ${cols.map(([st, side, pairs]) => `<div class="col ${side}">${st === 'final'
      ? `${cup}${tieHTML(pairs[0][0], now)}${champ}`
      : pairs.map(pr => `<div class="pair${pr.length === 1 ? ' solo' : ''}">${pr.map(id => tieHTML(id, now)).join('')}</div>`).join('')}</div>`).join('')}</div>
    <p class="bk-key">${t('key').map(([k, v]) => `<span><b>${k}</b>${v}</span>`).join('')}</p>`;
}

export function initKnockout(){
  $('knockout-page').addEventListener('click', e => {
    const b = e.target.closest('.tie'); if(!b) return;
    const st = b.dataset.stage;
    openCard(+b.dataset.id, () => state.data.tournament.roundLabel[st][state.lang]);
  });
}
