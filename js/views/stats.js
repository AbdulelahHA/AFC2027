/* Stats: totals, scorers, assists, clean sheets, history. Plain tables. */
import { state } from '../store.js';
import { t, teamName, flag, esc } from '../i18n.js';
import { isSameDay } from '../time.js';
import { topScorers, topAssists, cleanSheets, goalTotals, totalAssists, allTimeScorers } from '../logic/stats.js';

const $ = id => document.getElementById(id);

function board(id, title, rows, valueKey, valueLabel, empty){
  if(!rows.length) return `<section id="${id}"><h3>${title}</h3><p>${empty}</p></section>`;
  return `<section id="${id}"><h3>${title}</h3><table><thead><tr><th scope="col">#</th><th scope="col">${t('player')}</th><th scope="col">${t('team')}</th><th scope="col">${valueLabel}</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr data-team="${r.team}"><td>${i + 1}</td><th scope="row">${esc(r.name)}</th><td>${flag(r.team)} ${teamName(r.team)}</td><td>${r[valueKey]}${r.pens ? ` (${r.pens} ${t('pen')})` : ''}</td></tr>`).join('')}
  </tbody></table></section>`;
}

export function renderStats(){
  if(state.page !== 'stats') return;
  const { model, data } = state;
  const { total, today, pens } = goalTotals(model, ko => isSameDay(ko, Date.now()));
  const totals = `<dl id="totals">
    <dt>${t('totalGoals')}</dt><dd>${total}</dd>
    <dt>${t('todayGoals')}</dt><dd>${today}</dd>
    <dt>${t('penaltyGoals')}</dt><dd>${pens}</dd>
    <dt>${t('totalAssists')}</dt><dd>${totalAssists(model)}</dd></dl>`;

  const h = data.history;
  const winners = h.winners?.length ? `<section id="past-winners"><h3>${t('winnersTitle')}</h3><table><thead><tr><th scope="col">${t('team')}</th><th scope="col">${t('titles')}</th><th scope="col">${t('years')}</th></tr></thead><tbody>
    ${h.winners.map(w => `<tr><th scope="row">${w.flag ? `<img class="flag" src="https://flagcdn.com/h24/${w.flag}.png" alt="" height="16">` : ''} ${esc(w[state.lang] || w.en)}</th><td>${w.titles}</td><td>${(w.years || []).join(', ')}</td></tr>`).join('')}
  </tbody></table></section>` : '';
  const legends = h.scorers?.length ? `<section id="all-time-scorers"><h3>${t('scorersTitle')}</h3><ol>
    ${allTimeScorers(h, topScorers(model, Infinity), data.teams).map(p => `<li>${esc(p.name)} — ${p.goals}</li>`).join('')}</ol></section>` : '';

  $('stats').innerHTML = totals
    + board('top-scorers', t('goals'), topScorers(model), 'goals', t('goals'), t('noGoals'))
    + board('top-assists', t('assists'), topAssists(model), 'assists', t('assists'), t('noAssists'))
    + board('clean-sheets', t('cleanSheets'), cleanSheets(model), 'sheets', t('cleanSheets'), t('noSheets'))
    + winners + legends;
}
