/* One description of "where is this match right now", shared by every view. */
import { t } from '../i18n.js';
import { local } from '../time.js';
import { IN_PLAY, FINISHED, MATCH_LEN, effectiveState, winnerSide, clockFromKickoff, secondHalfLabel } from '../logic/status.js';

/* second-half anchors: when we saw HT turn back into LIVE, per match id */
const read = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
const half2 = read('afc27_half2'), prevState = read('afc27_prev');
export const saveClock = () => { try { localStorage.setItem('afc27_half2', JSON.stringify(half2)); localStorage.setItem('afc27_prev', JSON.stringify(prevState)); } catch {} };

/* "19:00", or "Time TBC" until AFC publishes the kickoff time */
export const kickoffText = m => m.timeTBC ? t('timeTBC') : local(m.kickoff).hm;

/* → {phase: upcoming|live|ht|finished, score: "1 – 0"|null, label, winner: 'h'|'a'|null} */
export function matchStatus(m, now){
  const st = effectiveState(m.result, m.kickoff, now), r = m.result;
  if(r){
    if(st === 'LIVE' && prevState[m.id] === 'HT' && !half2[m.id]) half2[m.id] = now;
    if(FINISHED.has(st)) delete half2[m.id];
    prevState[m.id] = st;
  }
  const score = r && (IN_PLAY.has(st) || FINISHED.has(st)) ? `${r.homeScore ?? 0} – ${r.awayScore ?? 0}` : null;

  if(FINISHED.has(st)){
    const pens = st === 'AP' && r.penHome != null ? ` (${r.penHome}–${r.penAway} ${t('pens')})` : '';
    return { phase: 'finished', score, label: (st === 'AP' ? t('pensTag') : st === 'AET' ? t('aet') : t('ft')) + pens, winner: winnerSide(r) };
  }
  if(st === 'HT') return { phase: 'ht', score, label: t('halfTime'), winner: null };
  if(st === 'ET') return { phase: 'live', score, label: t('extraTime'), winner: null };
  if(st === 'PEN') return { phase: 'live', score, label: t('penalties'), winner: null };
  if(st === 'LIVE'){
    const label = half2[m.id] || now - m.kickoff >= 60 * 60e3 ? secondHalfLabel(half2[m.id], m.kickoff, now) : clockFromKickoff(m.kickoff, now).label;
    return { phase: 'live', score, label, winner: null };
  }
  if(m.timeTBC && !r) return { phase: 'upcoming', score: null, label: t('timeTBC'), winner: null };
  /* no feed data: after kickoff, show an estimated clock rather than a stale time */
  if(!r && m.home && now >= m.kickoff && now < m.kickoff + MATCH_LEN){
    const clk = clockFromKickoff(m.kickoff, now);
    return { phase: clk.ht ? 'ht' : 'live', score: null, label: clk.ht ? t('halfTime') : clk.label, winner: null };
  }
  return { phase: 'upcoming', score: null, label: kickoffText(m), winner: null };
}
