/* Loads a tournament's data files, polls its score feeds and rebuilds the
   model. Feeds are optional: with none configured the site still shows the
   full fixture list, tables and bracket slots.
   Polling adapts: every 15s from 10 min before a kickoff until 3h after it,
   every 60s otherwise (the live-score research put FotMob/Kooora at 10–15s). */
import { buildResults } from './logic/feed.js';
import { buildModel } from './logic/model.js';
import { IN_PLAY } from './logic/status.js';
import { state, update } from './store.js';

const FAST = 15e3, SLOW = 60e3, EXTRA_EVERY = 120e3;
const WINDOW_BEFORE = 10 * 60e3, WINDOW_AFTER = 3 * 3600e3;
export const GOAL_FX_MS = 30e3;
/* "<matchId>|h" -> when that side scored; views mark the side for 30s */
export const goalFx = new Map();

let base = '', scores = null, extra = null;
export let lastUpdate = null;      /* when scores last arrived, for "updated N s ago" */

const getJSON = async url => {
  const res = await fetch(url, { cache: 'no-store' });
  if(!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};
const fresh = url => url + (url.includes('?') ? '&' : '?') + '_=' + Date.now();

export async function loadTournament(id){
  base = `tournaments/${id}/`;
  const [tournament, teams, fixtures, history, aliases] = await Promise.all(
    ['tournament', 'teams', 'fixtures', 'history', 'aliases'].map(f => getJSON(base + f + '.json')));
  return { tournament, teams, fixtures, history, aliases };
}

function rebuild(){
  const { data } = state;
  const feed = buildResults(scores, extra, data.teams, data.aliases);
  if(feed.unmatched.length) console.warn('[AFC27] Unmatched team names from feed:', feed.unmatched);
  const model = buildModel(data, feed, Date.now());
  detectGoals(state.model, model);
  update({ model });
}

function detectGoals(prev, next){
  if(!prev) return;
  for(const m of next.matches){
    const was = prev.byId.get(m.id)?.result;
    if(!was || !m.result || !IN_PLAY.has(m.state)) continue;
    if((m.result.homeScore ?? 0) > (was.homeScore ?? 0)) goalFx.set(m.id + '|h', Date.now());
    if((m.result.awayScore ?? 0) > (was.awayScore ?? 0)) goalFx.set(m.id + '|a', Date.now());
  }
}

const nearKickoff = now => state.data.fixtures.some(f => {
  const ko = Date.parse(f.kickoff);
  return now > ko - WINDOW_BEFORE && now < ko + WINDOW_AFTER;
});

async function pollScores(){
  const { feeds } = state.data.tournament;
  try{
    scores = await getJSON(fresh(feeds.scores));
    lastUpdate = Date.now();
    update({ feed: 'ok' });
  }catch{
    if(!scores && feeds.archive){
      try{ scores = await getJSON(base + feeds.archive); update({ feed: 'ok' }); }
      catch{ update({ feed: 'err' }); }
    }else if(!scores) update({ feed: 'err' });
  }
  if(scores) rebuild();
  setTimeout(pollScores, nearKickoff(Date.now()) ? FAST : SLOW);
}

async function pollExtra(){
  try{ extra = await getJSON(fresh(state.data.tournament.feeds.extra)); }
  catch{ return; }              /* optional layer: failing never affects scores */
  if(scores) rebuild();
}

export function startFeeds(){
  rebuild();                    /* render fixtures straight away */
  const { feeds = {} } = state.data.tournament;
  if(!feeds.scores){ update({ feed: 'none' }); return; }
  pollScores();
  if(feeds.extra){ pollExtra(); setInterval(pollExtra, EXTRA_EVERY); }
}
