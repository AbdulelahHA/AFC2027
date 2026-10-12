/* The only mutable app state. Views subscribe and re-render from it. */
const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

export const state = {
  data: null,        /* {tournament, teams, fixtures, history, aliases} */
  model: null,       /* built from data + feeds, see logic/model.js */
  feed: 'loading',   /* loading | ok | err | none (no feed configured) */
  lang: get('afc27_lang') === 'ar' ? 'ar' : 'en',
  theme: ['light', 'dark'].includes(get('afc27_theme')) ? get('afc27_theme') : 'auto',
  page: 'scores'     /* scores | groups | knockout | stats */
};

const subs = new Set();
export const subscribe = fn => subs.add(fn);

/* patch state, persist preferences, tell every view what changed */
export function update(patch){
  Object.assign(state, patch);
  if('lang' in patch) put('afc27_lang', state.lang);
  if('theme' in patch) put('afc27_theme', state.theme);
  for(const fn of subs) fn(patch);
}
