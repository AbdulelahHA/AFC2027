/* Boot: load the tournament, wire the views, start the feeds and the clock.
   Another tournament folder can be opened with ?t=<folder>. */
import { state, subscribe } from './store.js';
import { setTimezone } from './time.js';
import { loadTournament, startFeeds } from './live.js';
import { initShell, applyChrome, applyTheme, showPage } from './views/shell.js';
import { initScores, renderScores, tick, realignScores } from './views/scores.js';
import { initCard, refreshCard, tickCard } from './views/card.js';
import { renderGroups } from './views/groups.js';
import { initKnockout, renderKnockout } from './views/knockout.js';
import { initStats, renderStats } from './views/stats.js';

const params = new URLSearchParams(location.search);
state.data = await loadTournament(params.get('t') || 'afc2027');
setTimezone(state.data.tournament.timezone);

/* testing: ?now=2027-01-08T12:40:00+03:00 (or a test tournament's "demoNow") runs the clock from that moment */
const testNow = params.get('now') || state.data.tournament.demoNow;
if(testNow && !isNaN(Date.parse(testNow))){
  const off = Date.parse(testNow) - Date.now(), real = Date.now.bind(Date);
  Date.now = () => real() + off;
}

function render(){
  if(!state.model) return;
  renderScores();
  renderGroups();
  renderKnockout();
  renderStats();
  refreshCard();
}

subscribe(patch => {
  if('lang' in patch) applyChrome();
  if('theme' in patch){ applyTheme(); applyChrome(); }
  if('page' in patch){ showPage(); if(state.page === 'scores') realignScores(); }
  if('model' in patch || 'lang' in patch || 'page' in patch) render();
});

initShell();
applyTheme();
applyChrome();
showPage();
initScores();
initCard();
initKnockout();
initStats();
startFeeds();
setInterval(() => { tick(); tickCard(); }, 1000);
