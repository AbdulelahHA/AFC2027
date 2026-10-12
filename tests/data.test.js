/* Checks the hand-collected tournament data, then plays a full simulated
   tournament through the real pipeline. `npm test` */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildResults } from '../js/logic/feed.js';
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
