/* Boot: load the tournament, wire the views, start the feeds and the clock.
   Another tournament folder can be opened with ?t=<folder>. */
import { state, subscribe } from './store.js';
import { setTimezone } from './time.js';
import { loadTournament, startFeeds } from './live.js';
import { initShell, applyChrome, showPage, feedStatus } from './views/shell.js';
import { initSchedule, renderSchedule, tick } from './views/schedule.js';
import { renderGroups } from './views/groups.js';
import { renderKnockout } from './views/knockout.js';
import { renderStats } from './views/stats.js';
import { initMyTeams, renderMyTeams } from './views/my-teams.js';

const id = new URLSearchParams(location.search).get('t') || 'afc2027';
state.data = await loadTournament(id);
setTimezone(state.data.tournament.timezone);

function render(){
  if(!state.model) return;
  renderSchedule();
  renderGroups();
  renderKnockout();
  renderStats();
  renderMyTeams();
}

let scrolled = false;
subscribe(patch => {
  if('lang' in patch) applyChrome();
  if('page' in patch) showPage();
  if('feed' in patch || 'lang' in patch) feedStatus();
  render();
  /* first render: bring today's matches into view during the tournament */
  if(!scrolled && state.model && state.page === 'schedule'){
    scrolled = true;
    document.getElementById('today')?.scrollIntoView({ block: 'start' });
  }
});

initShell();
applyChrome();
showPage();
initSchedule();
initMyTeams();
startFeeds();
setInterval(tick, 1000);
