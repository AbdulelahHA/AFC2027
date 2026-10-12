/* Knockout bracket as plain lists, one per round. */
import { state } from '../store.js';
import { t, teamName, flag, roundLabel, slotText } from '../i18n.js';
import { local } from '../time.js';
import { matchStatus } from './match-status.js';

const $ = id => document.getElementById(id);

function tie(m, f){
  const s = matchStatus(m, Date.now());
  const team = (code, slot, w) => `<span class="team" data-side="${w}"${code ? ` data-team="${code}"` : ' data-tbd'}>${code ? `${flag(code)} ${teamName(code)}` : slotText(slot)}</span>`;
  const p = local(m.kickoff);
  return `<li class="tie" data-id="${m.id}" data-state="${s.phase}"${s.winner ? ` data-winner="${s.winner === 'h' ? 'home' : 'away'}"` : ''}>
    <span class="match-no">#${m.id}</span>
    ${team(m.home, f.home, 'home')} <span class="score">${s.score || t('vs')}</span> ${team(m.away, f.away, 'away')}
    <span class="status">${s.phase === 'upcoming' ? `${p.d}/${p.mo + 1} · ${s.label}` : s.label}</span>
  </li>`;
}

export function renderKnockout(){
  if(state.page !== 'knockout') return;
  const { model, data } = state;
  const fx = new Map(data.fixtures.map(f => [f.id, f]));
  const rounds = data.tournament.rounds.map(r => {
    const ties = model.matches.filter(m => m.stage === r).sort((a, b) => a.id - b.id);
    return ties.length ? `<section class="round" data-round="${r}"><h3>${roundLabel(r)}</h3><ol>${ties.map(m => tie(m, fx.get(m.id))).join('')}</ol></section>` : '';
  }).join('');
  const champ = model.champion ? `<p class="champion" data-team="${model.champion}">${t('champion')}: ${flag(model.champion)} ${teamName(model.champion)}</p>` : '';
  $('knockout').innerHTML = champ + rounds;
}
