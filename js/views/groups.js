/* Group tables + the ranking of third-placed teams. */
import { state } from '../store.js';
import { t, teamName, flag } from '../i18n.js';

const $ = id => document.getElementById(id);
const FORM = { w: 'W', d: 'D', l: 'L' };

/* data-qualification is the projection from the current table; the
   "Qualified" label only appears once it's certain (group finished,
   and for thirds, every group finished) */
function row(r, i, qualified, confirmed, cols){
  const q = i < 2 ? `top${i + 1}` : qualified ? 'third' : 'out';
  const form = r.seq.map(s => `<abbr data-result="${s[0]}"${s.length > 1 ? ' data-live' : ''}>${FORM[s[0]]}</abbr>`).join(' ');
  return `<tr data-team="${r.code}" data-position="${i + 1}" data-qualification="${q}"${confirmed ? ' data-confirmed' : ''}${r.live ? ' data-live' : ''}${state.favs.includes(r.code) ? ' data-fav' : ''}>
    <td>${i + 1}</td><th scope="row">${flag(r.code)} ${teamName(r.code)}${confirmed && q !== 'out' ? ` <small>(${t('qualified')})</small>` : ''}</th>
    ${cols.map(c => `<td>${c === 'GD' && r.GD > 0 ? '+' : ''}${r[c]}</td>`).join('')}<td>${form}</td></tr>`;
}

export function renderGroups(){
  if(state.page !== 'groups') return;
  const { tables, pic } = state.model, h = t('table');
  const cols = ['P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'];
  const head = `<thead><tr><th scope="col">#</th><th scope="col">${h.team}</th>${cols.map(c => `<th scope="col">${h[c.toLowerCase()]}</th>`).join('')}<th scope="col">${h.form}</th></tr></thead>`;
  const groups = Object.entries(tables).map(([g, rows]) => `<table class="group-table" data-group="${g}" id="group-${g}">
      <caption>${t('group')} ${g}${rows.some(r => r.live) ? ` — ${t('live')}` : ''}</caption>${head}
      <tbody>${rows.map((r, i) => {
        const third = i === 2 && pic.qualifiedThirds.has(r.code);
        const confirmed = i < 2 ? pic.winners[g].settled : i === 2 ? !!pic.thirdSlots : pic.winners[g].settled;
        return row(r, i, third, confirmed, cols);
      }).join('')}</tbody>
    </table>`).join('');

  /* third-placed teams compared across groups; the best N go through */
  const n = state.data.tournament.thirdPlace.qualify;
  const thirds = pic.thirds.map((x, i) => `<tr data-team="${x.code}" data-qualification="${i < n ? 'third' : 'out'}">
      <td>${i + 1}</td><th scope="row">${flag(x.code)} ${teamName(x.code)}</th><td>${x.grp}</td><td>${x.Pts}</td><td>${x.GD > 0 ? '+' : ''}${x.GD}</td><td>${x.GF}</td></tr>`).join('');
  $('groups').innerHTML = groups + `<table class="thirds-table" id="third-placed">
      <caption>${state.lang === 'ar' ? `ترتيب أصحاب المركز الثالث (يتأهل أفضل ${n})` : `Third-placed teams (best ${n} qualify)`}</caption>
      <thead><tr><th scope="col">#</th><th scope="col">${h.team}</th><th scope="col">${t('group')}</th><th scope="col">${h.pts}</th><th scope="col">${h.gd}</th><th scope="col">${h.gf}</th></tr></thead>
      <tbody>${thirds}</tbody></table>`;
}
