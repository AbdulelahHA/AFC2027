/* My teams: pick up to 5 teams (checkboxes), then a summary per team:
   matches, group standing, scorers. */
import { state, update } from '../store.js';
import { t, teamName, flag, esc } from '../i18n.js';
import { local } from '../time.js';
import { matchesOf } from '../logic/model.js';
import { teamScorers } from '../logic/stats.js';
import { matchStatus } from './match-status.js';

const MAX = 5;
const $ = id => document.getElementById(id);

function picker(){
  const { teams } = state.data;
  const byGroup = {};
  for(const [code, tm] of Object.entries(teams)) (byGroup[tm.group || '?'] ||= []).push(code);
  return `<form id="team-picker"><fieldset><legend>${t('pickTeams')} (${state.favs.length}/${MAX})</legend>
    ${Object.keys(byGroup).sort().map(g => `<fieldset data-group="${g}"><legend>${t('group')} ${g}</legend>
      ${byGroup[g].sort((a, b) => teamName(a).localeCompare(teamName(b))).map(c => {
        const on = state.favs.includes(c);
        return `<label><input type="checkbox" name="team" value="${c}"${on ? ' checked' : ''}${!on && state.favs.length >= MAX ? ' disabled' : ''}> ${flag(c)} ${teamName(c)}</label>`;
      }).join(' ')}</fieldset>`).join('')}
  </fieldset></form>`;
}

function summary(code){
  const now = Date.now();
  const matches = matchesOf(state.model, code).map(m => {
    const s = matchStatus(m, now), opp = m.home === code ? m.away : m.home, p = local(m.kickoff);
    const result = s.score ? `${s.score} ${s.label}` : `${p.d}/${p.mo + 1} · ${s.label}`;
    return `<li data-state="${s.phase}">${t('vs')} ${flag(opp)} ${teamName(opp)} — ${result}</li>`;
  }).join('');
  const group = Object.entries(state.model.tables).find(([, r]) => r.some(x => x.code === code));
  const pos = group ? group[1].findIndex(x => x.code === code) : -1;
  const scorers = teamScorers(state.model, code);
  return `<article class="my-team" data-team="${code}">
    <h3>${flag(code)} ${teamName(code)}</h3>
    ${pos >= 0 ? `<p class="standing">${t('group')} ${group[0]} — ${t('position')} ${pos + 1}, ${t('points')} ${group[1][pos].Pts}</p>` : ''}
    <h4>${t('schedule')}</h4><ul>${matches || `<li>${t('noData')}</li>`}</ul>
    <h4>${t('scorers')}</h4>${scorers.length ? `<ul>${scorers.map(s => `<li>${esc(s.name)} — ${s.goals}</li>`).join('')}</ul>` : `<p>${t('noData')}</p>`}
  </article>`;
}

export function renderMyTeams(){
  if(state.page !== 'my-teams') return;
  $('my-teams').innerHTML = picker() + (state.favs.length ? state.favs.map(summary).join('') : `<p>${t('noFavs')}</p>`);
}

export function initMyTeams(){
  $('my-teams').addEventListener('change', e => {
    if(e.target.name !== 'team') return;
    const favs = [...$('my-teams').querySelectorAll('input[name=team]:checked')].map(i => i.value).slice(0, MAX);
    update({ favs });
  });
}
