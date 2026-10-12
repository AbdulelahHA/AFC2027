/* Stats: four totals, tournament leaders (goals · assists · clean sheets), past winners
   and the all-time scorers list (topped up live for active players). */
import { state } from '../store.js';
import { t, teamName, flag, flagImg, esc } from '../i18n.js';
import { IN_PLAY, FINISHED } from '../logic/status.js';
import { topScorers, topAssists, cleanSheets, goalTotals, allTimeScorers } from '../logic/stats.js';
import { setPill } from './shell.js';

const $ = id => document.getElementById(id);
let leadTab = 0;

function leadersHTML(){
  const { model } = state;
  const [rows, key, empty] = [[topScorers(model), 'goals', 'noGoals'], [topAssists(model), 'assists', 'noAssists'], [cleanSheets(model), 'sheets', 'noSheets']][leadTab];
  if(!rows.length) return `<li class="none">${t(empty)}</li>`;
  return rows.map((r, i) => `<li><span class="rank">${i + 1}</span>${flag(r.team)}<span class="who"><b>${esc(r.name)}</b><span>${teamName(r.team)}</span></span><span class="val">${r[key]}</span></li>`).join('');
}

export function renderStats(){
  if(state.page !== 'stats' || !state.model) return;
  const { model, data } = state;
  const played = model.matches.filter(m => m.result && (IN_PLAY.has(m.state) || FINISHED.has(m.state)));
  const { total, pens } = goalTotals(model, () => false);
  const clean = played.filter(m => FINISHED.has(m.state)).reduce((n, m) => n + !(m.result.awayScore > 0) + !(m.result.homeScore > 0), 0);
  const tiles = [total, played.length ? (total / played.length).toFixed(2) : '0', pens, clean];
  const h = data.history;
  $('stats-page').innerHTML = `<dl class="tiles">${t('totals').map((x, i) => `<div class="tile"><dt>${x}</dt><dd>${tiles[i]}</dd></div>`).join('')}</dl>
    <section class="sec"><h3>${t('leadersTitle')}</h3>
      <div class="seg three" id="lead-seg" role="tablist" style="--n:3"><span class="seg-pill" aria-hidden="true"></span>
        ${['goals', 'assists', 'cleanSheets'].map((k, i) => `<button type="button" role="tab" data-i="${i}">${t(k)}</button>`).join('')}</div>
      <ol class="panel leaders" id="leaders">${leadersHTML()}</ol></section>
    ${h.winners?.length ? `<section class="sec"><h3>${t('winnersTitle')}</h3><ol class="panel winners">${h.winners.map(w =>
      `<li>${flagImg(w.flag)}<span class="who"><b>${esc(w[state.lang] || w.en)}</b></span><span class="val">${w.titles}<small>${(w.years || []).join(' · ')}</small></span></li>`).join('')}</ol></section>` : ''}
    ${h.scorers?.length ? `<section class="sec"><h3>${t('scorersTitle')}</h3><ol class="panel alltime">${allTimeScorers(h, topScorers(model, Infinity), data.teams).map((p, i) =>
      `<li><span class="rank">${i + 1}</span>${flagImg(p.flag)}<span class="who"><b>${esc(p.name)}</b></span><span class="val">${p.goals}</span></li>`).join('')}</ol>
      <p class="note">${t('scorersNote')}</p></section>` : ''}`;
  setPill($('lead-seg'), leadTab);
}

export function initStats(){
  $('stats-page').addEventListener('click', e => {
    const b = e.target.closest('#lead-seg button'); if(!b) return;
    leadTab = +b.dataset.i; const seg = $('lead-seg'); seg.classList.add('animate'); setPill(seg, leadTab);
    $('leaders').innerHTML = leadersHTML();
  });
}
