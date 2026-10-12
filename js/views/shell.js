/* Page chrome: labels, the top-right menu (pages, language, appearance), hash routing
   (#scores default, #groups, #knockout, #stats) and the regional style credit. */
import { state, update } from '../store.js';
import { t } from '../i18n.js';

const $ = id => document.getElementById(id);
const root = document.documentElement;
export const PAGES = ['scores', 'groups', 'knockout', 'stats'];

/* a segmented switch: the pill sits under button `pos` (fractional while a swipe is in progress) */
export function setPill(seg, pos){
  seg.style.setProperty('--pos', pos);
  seg.querySelectorAll('[role="tab"],[role="radio"]').forEach((b, k) => {
    const on = k === Math.round(pos);
    b.setAttribute(b.getAttribute('role') === 'tab' ? 'aria-selected' : 'aria-checked', on);
    if(b.getAttribute('role') === 'tab') b.tabIndex = on ? 0 : -1;
  });
}

export function applyChrome(){
  root.lang = state.lang;
  root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  document.title = t('title');
  $('t-title').textContent = t('brand');
  $('emblem-full').alt = t('emblemAlt');
  $('menu-btn').setAttribute('aria-label', t('menu'));
  for(const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  $('style-credit').textContent = t('credit')[root.dataset.variant] || '';
  setPill($('lang-seg'), state.lang === 'ar' ? 1 : 0);
  setPill($('theme-seg'), ['light', 'dark', 'auto'].indexOf(state.theme));
}

export function applyTheme(){
  if(state.theme === 'auto') delete root.dataset.theme; else root.dataset.theme = state.theme;
}

export function showPage(){
  for(const p of PAGES) $('view-' + p).hidden = p !== state.page;
  for(const a of document.querySelectorAll('#menu [data-go]'))
    a.dataset.go === state.page ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
}

const pageFromHash = () => { const h = location.hash.slice(1); return PAGES.includes(h) ? h : 'scores'; };

export function initShell(){
  const menu = $('menu');
  menu.addEventListener('toggle', e => $('menu-btn').setAttribute('aria-expanded', e.newState === 'open'));
  /* page links: the hash change does the routing; the menu just closes */
  menu.addEventListener('click', e => { if(e.target.closest('[data-go]')) menu.hidePopover(); });
  $('lang-seg').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b || b.dataset.v === state.lang) return;
    $('lang-seg').classList.add('animate'); update({ lang: b.dataset.v });
  });
  $('theme-seg').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    $('theme-seg').classList.add('animate'); update({ theme: b.dataset.v });
  });
  addEventListener('hashchange', () => { update({ page: pageFromHash() }); scrollTo({ top: 0, behavior: 'instant' }); });
  state.page = pageFromHash();
}
