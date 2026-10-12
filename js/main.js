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

const id = new URLSearchParams(location.search).get('t') || 'afc2027';
state.data = await loadTournament(id);
setTimezone(state.data.tournament.timezone);

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
