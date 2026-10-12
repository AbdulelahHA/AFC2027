/* The only mutable app state. Views subscribe and re-render from it. */
const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const json = (k, d) => { try { return JSON.parse(get(k)) ?? d; } catch { return d; } };

export const state = {
  data: null,        /* {tournament, teams, fixtures, history, aliases} */
  model: null,       /* built from data + feeds, see logic/model.js */
  feed: 'loading',   /* loading | ok | err | none (no feed configured) */
  lang: get('afc27_lang') === 'ar' ? 'ar' : 'en',
  favs: Array.isArray(json('afc27_favs', [])) ? json('afc27_favs', []) : [],
  page: 'schedule'
};

const subs = new Set();
export const subscribe = fn => subs.add(fn);

/* patch state, persist preferences, tell every view what changed */
export function update(patch){
  Object.assign(state, patch);
  if('lang' in patch) put('afc27_lang', state.lang);
  if('favs' in patch) put('afc27_favs', JSON.stringify(state.favs));
  for(const fn of subs) fn(patch);
}
