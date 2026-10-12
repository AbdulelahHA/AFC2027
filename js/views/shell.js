/* Page chrome: static labels, language switch, page switching via the URL
   hash (#schedule, #groups, …), and the feed status line. */
import { state, update } from '../store.js';
import { t } from '../i18n.js';

const $ = id => document.getElementById(id);
const PAGES = ['schedule', 'groups', 'knockout', 'stats', 'my-teams'];
const KEY = { schedule: 'schedule', groups: 'groups', knockout: 'knockout', stats: 'stats', 'my-teams': 'myTeams' };

export function applyChrome(){
  const ar = state.lang === 'ar';
  document.documentElement.lang = state.lang;
  document.documentElement.dir = ar ? 'rtl' : 'ltr';
  document.title = t('title');
  $('t-title').textContent = t('h1');
  $('t-subtitle').textContent = t('subtitle');
  $('t-footer').textContent = t('footer');
  $('lbl-lang').textContent = t('language');
  for(const p of PAGES){
    document.querySelector(`#pages a[data-page="${p}"]`).textContent = t(KEY[p]);
    $('h-' + p).textContent = t(KEY[p]);
  }
  for(const b of document.querySelectorAll('#lang-switch button')) b.setAttribute('aria-pressed', b.dataset.lang === state.lang);
}

export function showPage(){
  for(const p of PAGES) $('page-' + p).hidden = p !== state.page;
  for(const a of document.querySelectorAll('#pages a')){
    if(a.dataset.page === state.page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
}

export function feedStatus(){
  const el = $('feed-status');
  el.dataset.feed = state.feed;
  el.hidden = false;
  if(state.feed === 'ok'){
    el.innerHTML = state.lang === 'ar' ? 'آخر تحديث قبل <span id="feed-updated"></span>' : 'Updated <span id="feed-updated"></span> ago';
    return;
  }
  el.textContent = t({ loading: 'feedLoading', err: 'feedError', none: 'feedNone' }[state.feed]);
}

const pageFromHash = () => { const h = location.hash.slice(1); return PAGES.includes(h) ? h : 'schedule'; };

export function initShell(){
  $('lang-switch').addEventListener('click', e => { const b = e.target.closest('button'); if(b) update({ lang: b.dataset.lang }); });
  addEventListener('hashchange', () => update({ page: pageFromHash() }));
  state.page = pageFromHash();
}
