/* Page chrome: labels, the top-right menu (pages, language, appearance), hash routing
   (#scores default, #groups, #knockout, #stats) and the regional style credit. */
import { state, update } from '../store.js';
import { t } from '../i18n.js';

const $ = id => document.getElementById(id);
const root = document.documentElement;
export const PAGES = ['scores', 'groups', 'knockout', 'stats', 'alerts'];

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
  /* The menu is a manual popover so its close is animated by us in every browser: Safari can't animate a
     popover leaving the top layer, so the browser's own close (light dismiss, hidePopover) was instant.
     It shrinks back into the Home button, then hides; a chosen page opens only after that. */
  const menu = $('menu'), btn = $('menu-btn');
  const isOpen = () => menu.matches(':popover-open');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let closing = null;
  const open = () => { if(isOpen()) return; menu.classList.remove('closing'); menu.showPopover(); btn.setAttribute('aria-expanded', 'true'); };
  const close = then => {
    if(!isOpen()){ then?.(); return; }
    if(closing) return;
    btn.setAttribute('aria-expanded', 'false');
    const done = () => { if(!closing) return; clearTimeout(closing); closing = null; menu.hidePopover(); menu.classList.remove('closing'); then?.(); };
    if(reduced()){ closing = -1; return done(); }
    menu.classList.add('closing');
    closing = setTimeout(done, 210);                 /* hide right after the 0.2 s shrink */
  };
  btn.addEventListener('click', () => isOpen() ? close() : open());
  /* a page link: close first, then switch page, so the two never fight for the same frames */
  menu.addEventListener('click', e => {
    const a = e.target.closest('[data-go]'); if(!a) return;
    e.preventDefault();
    close(() => { if(location.hash !== a.hash) location.hash = a.hash; else update({ page: pageFromHash() }); });
  });
  /* light dismiss, done by hand: a tap outside the menu and the button, or Esc */
  document.addEventListener('pointerdown', e => { if(isOpen() && !menu.contains(e.target) && !btn.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && isOpen()){ close(); btn.focus(); } });
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
