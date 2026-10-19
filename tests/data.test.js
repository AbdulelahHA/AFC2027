/* Checks the hand-collected tournament data, then plays a full simulated
   tournament through the real pipeline. `npm test` */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildResults, orient } from '../js/logic/feed.js';
import { buildModel } from '../js/logic/model.js';

const load = f => JSON.parse(readFileSync(new URL('../tournaments/afc2027/' + f + '.json', import.meta.url)));
const data = { tournament: load('tournament'), teams: load('teams'), fixtures: load('fixtures'), aliases: load('aliases') };
const { tournament: T, teams, fixtures } = data;
const groupFx = fixtures.filter(f => f.stage === 'group');
const koFx = fixtures.filter(f => f.stage !== 'group');
const groupLetters = [...new Set(groupFx.map(f => f.group))].sort();

test('24 teams, each complete', () => {
  assert.equal(Object.keys(teams).length, 24);
  for(const [code, t] of Object.entries(teams)){
    assert.match(code, /^[A-Z]{3}$/, code);
    for(const k of ['en', 'ar', 'flag', 'group']) assert.ok(t[k], `${code}.${k}`);
  }
});

test('6 groups of 4, every pairing played once', () => {
  assert.deepEqual(groupLetters, ['A', 'B', 'C', 'D', 'E', 'F']);
  for(const g of groupLetters){
    const members = Object.keys(teams).filter(c => teams[c].group === g).sort();
    assert.equal(members.length, 4, `group ${g}`);
    const pairs = groupFx.filter(f => f.group === g).map(f => [f.home, f.away].sort().join('-')).sort();
    const expected = members.flatMap((a, i) => members.slice(i + 1).map(b => `${a}-${b}`)).sort();
    assert.deepEqual(pairs, expected, `group ${g} pairings`);
  }
});

test('51 matches, unique ids, inside the tournament dates, at known venues', () => {
  assert.equal(fixtures.length, 51);
  assert.equal(new Set(fixtures.map(f => f.id)).size, 51);
  const start = Date.parse(T.dates.start + 'T00:00:00+03:00'), end = Date.parse(T.dates.end + 'T23:59:59+03:00');
  for(const f of fixtures){
    /* kickoff times may still be TBC (null); the date is always known */
    const ko = f.kickoff ? Date.parse(f.kickoff) : Date.parse(f.date + 'T12:00:00+03:00');
    assert.ok(ko >= start && ko <= end, `match ${f.id} on ${f.date}`);
    assert.ok(T.venues[f.venue], `match ${f.id} venue ${f.venue}`);
  }
});

test('knockout slots point at real groups and earlier matches', () => {
  const ids = new Set(fixtures.map(f => f.id));
  for(const f of koFx) for(const s of [f.home, f.away]){
    if(/^[12][A-F]$/.test(s)) continue;
    if(/^3:[A-F]{2,}$/.test(s)){ assert.ok(T.thirdPlace.slotMatches.includes(f.id), `match ${f.id} third slot`); continue; }
    const m = s.match(/^[WL](\d+)$/);
    assert.ok(m && ids.has(+m[1]) && +m[1] < f.id, `match ${f.id} slot ${s}`);
  }
  assert.ok(ids.has(T.bracket.final));
});

test('best-third table covers all 15 combinations consistently', () => {
  const { table, slotMatches, qualify } = T.thirdPlace;
  assert.equal(qualify, 4);
  assert.equal(Object.keys(table).length, 15);
  for(const [key, val] of Object.entries(table)){
    assert.equal(val.length, slotMatches.length, key);
    assert.deepEqual([...val].sort().join(''), key, `${key} assigns each qualifying group once`);
    /* each assigned group must be one the slot allows */
    slotMatches.forEach((id, i) => {
      const f = fixtures.find(x => x.id === id);
      const slot = [f.home, f.away].find(s => s.startsWith('3:'));
      assert.ok(slot.slice(2).includes(val[i]), `${key}: match ${id} gets 3rd of ${val[i]}, slot ${slot}`);
    });
  }
});

test('a simulated tournament resolves to a champion', () => {
  /* every group: lower team code wins by its index, so tables have no ties */
  const feed = [];
  const name = c => teams[c].en;
  for(const f of groupFx){
    const h = Object.keys(teams).indexOf(f.home), a = Object.keys(teams).indexOf(f.away);
    feed.push({ home: name(f.home), away: name(f.away), homeScore: h % 4, awayScore: (a + 1) % 3, state: 'FT', type: 'group' });
  }
  let model;
  /* play knockout rounds one at a time: the home side wins 2–1 */
  for(let round = 0; round < 5; round++){
    model = buildModel(data, buildResults({ matches: feed }, null, teams, data.aliases), Date.parse('2027-03-01'));
    for(const m of model.matches.filter(x => x.stage !== 'group' && x.home && x.away && !x.result))
      feed.push({ home: name(m.home), away: name(m.away), homeScore: 2, awayScore: 1, state: 'FT', type: m.stage });
  }
  const r16 = model.matches.filter(m => m.stage === 'r16');
  assert.equal(r16.length, 8);
  assert.ok(r16.every(m => m.home && m.away), 'every Round of 16 tie has two teams');
  assert.equal(new Set(r16.flatMap(m => [m.home, m.away])).size, 16, 'sixteen different teams');
  assert.ok(model.champion, 'a champion');
});

test('the demo tournament (?t=demo) resolves every feed team and scorer', () => {
  const demo = f => JSON.parse(readFileSync(new URL('../tournaments/demo/' + f + '.json', import.meta.url)));
  const T2 = demo('tournament');
  assert.equal(T2.dataFrom, 'afc2027');
  assert.ok(!isNaN(Date.parse(T2.demoNow)), 'demoNow is a date');
  const feed = buildResults(demo('scores'), demo('extra'), teams, data.aliases);
  assert.deepEqual(feed.unmatched, [], 'every demo team name matches a real team');
  assert.equal(feed.results.size, 3);
  const model = buildModel({ ...data, tournament: T2 }, feed, Date.parse(T2.demoNow));
  const live = model.matches.find(m => m.home === 'BHR' && m.away === 'PRK');
  assert.equal(live.state, 'LIVE');
  const ksa = model.matches.find(m => m.home === 'KSA' && m.away === 'PLE');
  assert.deepEqual(ksa.result.goals.map(g => g.name), ['Saudi Nine', 'Saudi Ten'], 'scorers keep their own names');
  assert.equal(ksa.extra.lineups.KSA.xi.length, 11);
});

test('match stats follow the fixture home side when the feed lists the teams the other way round', () => {
  const name = c => teams[c].en;
  const { results } = buildResults({ matches: [{ home: name('PLE'), away: name('KSA'), homeScore: 0, awayScore: 2, state: 'FT', type: 'group',
    stats: { possession: [36, 64], shots: [6, 15] } }] }, null, teams, data.aliases);
  const r = orient([...results.values()][0], 'KSA');
  assert.deepEqual(r.stats, { possession: [64, 36], shots: [15, 6] });
  assert.equal(r.homeScore, 2);
});

/* ── head-to-head records (tournaments/afc2027/h2h.json) ── */
import { h2hOf } from '../js/logic/h2h.js';
test('h2h records add up and are keyed by group pair', () => {
  const { pairs } = load('h2h'), teams = load('teams'), fx = load('fixtures');
  for(const f of fx.filter(f => f.stage === 'group')){
    const k = [f.home, f.away].sort().join('-');
    assert.ok(pairs[k], `missing h2h pair ${k}`);
  }
  for(const [k, p] of Object.entries(pairs)){
    const [a, b] = k.split('-');
    assert.ok(teams[a] && teams[b], k);
    assert.equal(p.matches.length, p.wins[a] + p.wins[b] + p.draws, `${k}: W+D+L = played`);
    const gf = { [a]: 0, [b]: 0 };
    for(const m of p.matches){ const [h, g] = m.score.split('-').map(Number); gf[m.home] += h; gf[m.away] += g; }
    assert.deepEqual(gf, p.goals, `${k}: goals`);
  }
});
test('h2h shows only approved pairs, newest meeting first, oriented to the card', () => {
  const pair = { 'KSA-PLE': { approved: false, draws: 1, wins: { KSA: 1, PLE: 0 }, goals: { KSA: 3, PLE: 1 },
    matches: [{ date: '2019-10-15', home: 'PLE', away: 'KSA', score: '1-1' }, { date: '2021-03-30', home: 'KSA', away: 'PLE', score: '2-0' }] } };
  assert.equal(h2hOf(pair, 'PLE', 'KSA'), null);
  const r = h2hOf(pair, 'PLE', 'KSA', { review: true });
  assert.deepEqual(r.wins, [0, 1]);
  assert.deepEqual(r.goals, [1, 3]);
  assert.equal(r.last[0].date, '2021-03-30');
  assert.equal(h2hOf({ 'KSA-PLE': { ...pair['KSA-PLE'], approved: true } }, 'KSA', 'PLE').played, 2);
});
