/* The content inside an opened match: venue, where to watch, goals,
   penalty shootout, bookings, lineups. Plain lists and tables. */
import { state } from '../store.js';
import { t, teamName, esc, venueText, ar } from '../i18n.js';
import { surname } from '../logic/names.js';

const minute = mn => (mn || '').toString().replace(/\s+/g, '').replace(/'+$/, '') + "'";

/* assist: match on minute first (reliable), then on surname */
function assistFor(m, scorer, min){
  const list = m.extra?.assists || [];
  const mn = (min || '').replace(/[^0-9+]/g, '');
  const byMin = list.find(a => mn && (a.minute || '').toString().replace(/[^0-9+]/g, '') === mn);
  if(byMin) return byMin.assist;
  const sn = surname(scorer);
  return list.find(a => sn && (a.scorer || '').toLowerCase().includes(sn))?.assist || null;
}

function goals(m){
  const list = m.result?.goals || [];
  if(!list.length) return '';
  const item = g => {
    const as = g.og ? null : assistFor(m, g.name, g.minute);
    const tags = [g.pen && t('pen'), g.og && t('og')].filter(Boolean).join(', ');
    return `<li data-side="${g.side === 'h' ? 'home' : 'away'}"><span class="minute">${minute(g.minute)}</span> ${esc(g.name)}${tags ? ` (${tags})` : ''}${as ? ` — ${t('assist')}: ${esc(as)}` : ''}</li>`;
  };
  return `<h3>${t('goals')}</h3><ul class="goals">${list.map(item).join('')}</ul>`;
}

function shootout(m){
  const r = m.result;
  if(!r || r.state !== 'AP' || !r.kicks.length) return '';
  const rows = r.kicks.map((k, i) => `<tr data-side="${k.side === 'h' ? 'home' : 'away'}" data-scored="${k.scored}">
    <td>${i + 1}</td><td>${teamName(k.side === 'h' ? m.home : m.away)}</td><td>${esc(k.name)}</td><td>${k.scored ? t('scored') : t('missed')}</td></tr>`).join('');
  return `<h3>${t('shootout')} ${r.penHome ?? ''}–${r.penAway ?? ''}</h3><table class="shootout"><tbody>${rows}</tbody></table>`;
}

function bookings(m){
  const cards = [...(m.extra?.cards || [])].filter(c => c.team === m.home || c.team === m.away)
    .sort((x, y) => parseInt(x.minute || 999, 10) - parseInt(y.minute || 999, 10));
  if(!cards.length) return '';
  const kind = c => /red/i.test(c.card) ? 'red' : /second/i.test(c.card) ? 'second-yellow' : 'yellow';
  return `<h3>${t('bookings')}</h3><ul class="bookings">${cards.map(c =>
    `<li data-card="${kind(c)}" data-side="${c.team === m.home ? 'home' : 'away'}"><span class="minute">${minute(c.minute)}</span> ${esc(c.player)} (${teamName(c.team)}) — ${kind(c)}</li>`).join('')}</ul>`;
}

function lineups(m){
  const lu = m.extra?.lineups;
  if(!lu || (!lu[m.home] && !lu[m.away])) return '';
  const col = code => {
    const l = lu[code];
    if(!l) return '';
    const p = x => `<li><span class="shirt">${x.number || ''}</span> ${esc(x.name)}</li>`;
    return `<div class="lineup" data-team="${code}"><h4>${teamName(code)}${l.formation ? ` (${l.formation})` : ''}</h4>
      <ol>${(l.xi || []).map(p).join('')}</ol>
      ${l.subs?.length ? `<details><summary>${t('subs')}</summary><ul>${l.subs.map(p).join('')}</ul></details>` : ''}</div>`;
  };
  return `<h3>${t('lineups')}</h3>${col(m.home)}${col(m.away)}`;
}

/* where to watch: per-match override, else the tournament default */
function broadcast(m){
  const b = m.broadcast || state.data.tournament.broadcast?.default;
  if(!b) return '';
  return `<p class="broadcast">${t('whereToWatch')}: ${esc(ar() ? b.ar || b.en : b.en)}</p>`;
}

export function matchDetailsHTML(m){
  return `<p class="venue">${t('venue')}: ${esc(venueText(m.venue))}</p>${broadcast(m)}${goals(m)}${shootout(m)}${bookings(m)}${lineups(m)}`;
}
