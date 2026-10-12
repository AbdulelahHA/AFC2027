/* Groups: six tables (live matches count provisionally) and the ranking of third-placed teams.
   A green edge marks the top two, a gold edge third place; the best thirds qualify. */
import { state } from '../store.js';
import { t, teamName, flag } from '../i18n.js';

const $ = id => document.getElementById(id);
const gd = n => (n > 0 ? '+' : '') + n;

export function renderGroups(){
  if(state.page !== 'groups' || !state.model) return;
  const { tables, pic } = state.model, h = t('table'), f = t('form'), n = state.data.tournament.thirdPlace.qualify;
  const cols = [['#'], [h.team], [h.p], [h.w], [h.d], [h.l], [h.gf, 1], [h.ga, 1], [h.gd], [h.pts], [h.form, 1]];
  const head = `<tr>${cols.map(([c, wide]) => `<th${wide ? ' class="wide"' : ''}>${c}</th>`).join('')}</tr>`;
  const groups = Object.entries(tables).map(([g, rows]) => {
    const live = rows.some(r => r.live);
    return `<section class="sec"><h3>${t('group')} ${g}${live ? ` <small class="live-dot">${t('live')}</small>` : ''}</h3>
      <div class="panel tablewrap"><table class="gt full"><thead>${head}</thead><tbody>${rows.map((r, i) => `
        <tr data-team="${r.code}" data-q="${i < 2 ? 'top2' : i === 2 ? 'third' : 'out'}"${r.live ? ' class="live"' : ''}><td>${i + 1}</td>
          <td><span class="tn">${flag(r.code)}${teamName(r.code)}</span></td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td>
          <td class="wide">${r.GF}</td><td class="wide">${r.GA}</td><td>${gd(r.GD)}</td><td class="pts">${r.Pts}</td>
          <td class="wide">${r.seq.length ? `<span class="form">${r.seq.map(s => `<abbr data-r="${s[0]}"${s.length > 1 ? ' data-live' : ''}>${f[s[0]]}</abbr>`).join('')}</span>` : '<span class="dash">–</span>'}</td></tr>`).join('')}
      </tbody></table></div></section>`;
  }).join('');
  const thirds = `<section class="sec"><h3>${t('thirds')}</h3><div class="panel tablewrap"><table class="gt full">
      <thead><tr><th>#</th><th>${h.team}</th><th>${h.grp}</th><th>${h.p}</th><th>${h.gd}</th><th>${h.gf}</th><th>${h.pts}</th></tr></thead>
      <tbody>${pic.thirds.map((x, i) => `<tr data-team="${x.code}" data-q="${i < n ? 'top2' : 'out'}"><td>${i + 1}</td>
        <td><span class="tn">${flag(x.code)}${teamName(x.code)}</span></td><td>${x.grp}</td>
        <td>${tables[x.grp].find(r => r.code === x.code)?.P ?? 0}</td><td>${gd(x.GD)}</td><td>${x.GF}</td><td class="pts">${x.Pts}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">${t('thirdsNote')}</p></section>`;
  $('groups-page').innerHTML = `<div class="legend"><span><i></i>${t('top2')}</span><span><i class="third"></i>${t('thirdQ')(n)}</span></div>${groups}${thirds}`;
}
