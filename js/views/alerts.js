/* Goal alerts page: turn push notifications on/off, send a test, pick teams (none = every goal).
   The phone subscribes through the browser's Push API; the Cloudflare Worker in workers/goal-alerts
   keeps the list and sends the alerts. */
import { state, update } from '../store.js';
import { t, teamName, flag } from '../i18n.js';

const $ = id => document.getElementById(id);
const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
let note = '', busy = false;

const cfg = () => state.data.tournament.alerts || {};
const configured = () => !!(cfg().worker && cfg().vapidPublicKey);
const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const keyBytes = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const post = (path, body) => fetch(cfg().worker.replace(/\/$/, '') + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  .then(r => r.json().catch(() => ({})).then(j => ({ ok: r.ok, ...j })));

async function currentSub(){
  if(!supported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}
/* tell the Worker which teams and which language, whenever either changes */
async function register(sub){
  const r = await post('/subscribe', { subscription: sub.toJSON(), teams: state.follow, lang: state.lang });
  if(r.ok) put('afc27_alert_lang', state.lang);
  return r.ok;
}

async function turnOn(){
  const perm = await Notification.requestPermission();
  if(perm !== 'granted'){ note = t('alertsDenied'); return; }
  const reg = await navigator.serviceWorker.register('sw.js');
  await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(cfg().vapidPublicKey) });
  note = await register(sub) ? '' : t('alertsError');
}
async function turnOff(){
  const sub = await currentSub(); if(!sub) return;
  await post('/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe();
  note = '';
}
async function sendTest(){
  const sub = await currentSub(); if(!sub) return;
  const r = await post('/test', { endpoint: sub.endpoint }).catch(() => ({ ok: false }));
  note = r.ok ? t('alertsTestSent') : t('alertsError');
}

/* one list, alphabetical in the current language, with the host nation first */
function chipsHTML(){
  const host = state.data.tournament.spotlight;
  const codes = Object.keys(state.data.teams).sort((a, b) => (b === host) - (a === host) || teamName(a).localeCompare(teamName(b), state.lang));
  return `<div class="chips">${codes.map(c => `<button type="button" class="chip" data-team="${c}" aria-pressed="${state.follow.includes(c)}">${flag(c)}${teamName(c)}</button>`).join('')}</div>`;
}

export async function renderAlerts(){
  if(state.page !== 'alerts' || !state.data) return;
  const bell = '<span class="al-bell"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span>';
  let card;
  if(!configured()) card = `${bell}<p class="al-msg">${t('alertsNotReady')}</p>`;
  else if(isIOS() && !standalone()) card = `${bell}<p class="al-msg">${t('alertsInstall')}</p>`;
  else if(!supported()) card = `${bell}<p class="al-msg">${t('alertsUnsupported')}</p>`;
  else {
    const sub = await currentSub();
    if(sub && get('afc27_alert_lang') !== state.lang) register(sub);           /* language changed: re-send */
    card = sub
      ? `${bell}<p class="al-state on">${t('alertsOn')}</p><div class="al-actions"><button type="button" class="btn" data-act="test">${t('alertsTest')}</button><button type="button" class="btn ghost" data-act="off">${t('alertsOff')}</button></div>`
      : `${bell}<p class="al-state">${t('alertsIntro')}</p><div class="al-actions"><button type="button" class="btn" data-act="on">${t('alertsTurnOn')}</button></div><p class="al-msg">${t('alertsAsk')}</p>`;
  }
  $('alerts-page').innerHTML = `<section class="panel al-card" aria-live="polite">${card}${note ? `<p class="al-note">${note}</p>` : ''}</section>
    <section class="sec"><h3>${t('alertsFollow')}</h3><p class="note">${t('alertsFollowHint')}</p>${chipsHTML()}</section>`;
}

export function initAlerts(){
  $('alerts-page').addEventListener('click', async e => {
    const chip = e.target.closest('.chip');
    if(chip){
      const c = chip.dataset.team;
      chip.setAttribute('aria-pressed', !state.follow.includes(c));
      update({ follow: state.follow.includes(c) ? state.follow.filter(x => x !== c) : [...state.follow, c] });   /* stars everywhere follow */
      const sub = configured() && await currentSub(); if(sub) register(sub);
      return;
    }
    const b = e.target.closest('[data-act]'); if(!b || busy) return;
    busy = true; b.disabled = true;
    try { await { on: turnOn, off: turnOff, test: sendTest }[b.dataset.act](); }
    catch { note = t('alertsError'); }
    busy = false; renderAlerts();
  });
}
