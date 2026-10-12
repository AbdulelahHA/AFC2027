/* Goal alerts: detection from the scores feed, who gets which alert, and the message text. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolver, detectGoals, message, wants } from '../workers/goal-alerts/goals.js';

const load = f => JSON.parse(readFileSync(new URL('../tournaments/afc2027/' + f + '.json', import.meta.url)));
const teams = load('teams'), codeOf = resolver(teams, load('aliases'));
const feed = (h, a, state, goals = []) => ({ matches: [{ home: 'Saudi Arabia', away: 'Palestine', homeScore: h, awayScore: a, state, homeGoals: goals, awayGoals: [] }] });

test('first sighting of a match never alerts; a live score that rises does, with the scorer', () => {
  let r = detectGoals({}, feed(1, 0, 'LIVE'), codeOf);
  assert.equal(r.events.length, 0, 'no alert for goals we never saw happen');
  r = detectGoals(r.scores, feed(2, 0, 'LIVE', [{ name: 'A' }, { name: 'Saudi Ten', minute: "71'", pen: true }]), codeOf);
  assert.equal(r.events.length, 1);
  assert.deepEqual([r.events[0].home, r.events[0].away, r.events[0].side, r.events[0].score, r.events[0].scorer], ['KSA', 'PLE', 'h', [2, 0], 'Saudi Ten']);
  assert.equal(detectGoals(r.scores, feed(2, 0, 'LIVE'), codeOf).events.length, 0, 'same score, no repeat alert');
  assert.equal(detectGoals({ 'KSA-PLE': [2, 0] }, feed(3, 0, 'FT'), codeOf).events.length, 0, 'a late correction after full time does not alert');
});

test('alerts go to followers of either team, or to everyone who follows no team', () => {
  const ev = { home: 'KSA', away: 'PLE' };
  assert.ok(wants({ teams: [] }, ev));
  assert.ok(wants({ teams: ['PLE'] }, ev));
  assert.ok(!wants({ teams: ['JPN'] }, ev));
});

test('the alert reads naturally in English and Arabic', () => {
  const ev = { key: 'KSA-PLE', home: 'KSA', away: 'PLE', side: 'h', score: [2, 0], scorer: 'Saudi Ten', minute: "71'", pen: true, og: false };
  assert.deepEqual(message(ev, teams, 'en'), { title: 'GOAL · Saudi Arabia 2–0 Palestine', body: "Saudi Ten 71' (pen) · Saudi Arabia", tag: 'goal-KSA-PLE', url: './#scores' });
  assert.equal(message(ev, teams, 'ar').title, 'هدف · السعودية 2–0 فلسطين');
});
