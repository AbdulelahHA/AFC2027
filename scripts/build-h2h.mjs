/* Rebuilds tournaments/afc2027/h2h.json for the group-stage pairs, node scripts/build-h2h.mjs
   Counts competitive men's senior meetings only: Asian Cup, Arab Cup, Gulf Cup, World Cup, World Cup qualifiers.
   Each match comes from eloratings.net and must be confirmed by the martj42/international_results dataset
   (same score, date within a day). Any other disagreement stops the build; resolve it against a reference page
   and record the decision in h2h-overrides.json. Existing "approved" flags are kept. */
import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('../tournaments/afc2027/', import.meta.url);
const read = f => JSON.parse(readFileSync(new URL(f, dir)));
const teams = read('teams.json'), overrides = read('h2h-overrides.json');
let previous = {}; try { previous = read('h2h.json').pairs; } catch {}

const ELO = { KSA: 'SA', KUW: 'KW', OMA: 'OM', PLE: 'PS', UZB: 'UZ', BHR: 'BH', PRK: 'KP', JOR: 'JO', IRN: 'IR', SYR: 'SY', KGZ: 'KG', CHN: 'CN',
  AUS: 'AU', TJK: 'TJ', IRQ: 'IQ', SGP: 'SG', KOR: 'KR', UAE: 'AE', VIE: 'VN', YEM: 'YE', JPN: 'JP', QAT: 'QA', THA: 'TH', IDN: 'ID' };
const ELO_COMP = { AC: 'asian-cup', ARC: 'arab-cup', PGC: 'arab-cup', GLF: 'gulf-cup', WC: 'world-cup',
  WQ: 'wc-qualifiers', WQT: 'wc-qualifiers', WQS: 'wc-qualifiers', WQP: 'wc-qualifiers', ACQ: 'wc-qualifiers', AFQ: 'wc-qualifiers', AOQ: 'wc-qualifiers' };
const MJ_COMP = { 'FIFA World Cup': 'world-cup', 'FIFA World Cup qualification': 'wc-qualifiers', 'AFC Asian Cup': 'asian-cup', 'Gulf Cup': 'gulf-cup', 'Arab Cup': 'arab-cup' };
const MJ_NAME = Object.fromEntries(Object.entries(teams).map(([c, t]) => [t.en, c]).concat([['China PR', 'CHN']]));

const text = async url => { const r = await fetch(url); if(!r.ok) throw new Error(`${r.status} ${url}`); return r.text(); };
const day = iso => Date.parse(iso + 'T00:00:00Z') / 864e5;

/* martj42: every international since 1872 as CSV (no quoted commas in the columns we read) */
const mj = {};
for(const line of (await text('https://raw.githubusercontent.com/martj42/international_results/master/results.csv')).split('\n').slice(1)){
  const [date, home, away, hg, ag, tournament] = line.split(',');
  const a = MJ_NAME[home], b = MJ_NAME[away], competition = MJ_COMP[tournament];
  if(a && b && competition) (mj[[a, b].sort().join('-')] ??= []).push({ date, competition, goals: { [a]: +hg, [b]: +ag } });
}

const eloRows = {};
const rowsOf = async code => eloRows[code] ??= (await text(`https://www.eloratings.net/${teams[code].en.replaceAll(' ', '_')}.tsv`)).split('\n').filter(Boolean).map(l => l.split('\t'));

const groups = {};
for(const [c, t] of Object.entries(teams)) (groups[t.group] ??= []).push(c);

const pairs = {}, problems = [];
for(const [group, codes] of Object.entries(groups).sort()){
  for(const [a, b] of codes.flatMap((x, i) => codes.slice(i + 1).map(y => [x, y].sort()))){
    const key = `${a}-${b}`, matches = [];
    for(const r of await rowsOf(a)){
      if(![r[3], r[4]].every(x => x === ELO[a] || x === ELO[b]) || r[3] === r[4] || !ELO_COMP[r[7]]) continue;
      const [home, away] = r[3] === ELO[a] ? [a, b] : [b, a];
      matches.push({ date: `${r[0]}-${r[1]}-${r[2]}`, competition: ELO_COMP[r[7]], home, away, score: `${+r[5]}-${+r[6]}` });
    }
    /* cross-check with the second dataset */
    const other = [...(mj[key] || [])], mine = [];
    for(const m of matches){
      const goals = { [m.home]: +m.score.split('-')[0], [m.away]: +m.score.split('-')[1] };
      const i = other.findIndex(o => o.goals[m.home] === goals[m.home] && o.goals[m.away] === goals[m.away] && Math.abs(day(o.date) - day(m.date)) <= 1);
      if(i >= 0){ other.splice(i, 1); mine.push(m); continue; }
      const ok = overrides.accept.some(o => o.pair === key && o.date === m.date), cut = overrides.exclude.some(o => o.pair === key && o.date === m.date);
      if(ok){ const j = other.findIndex(o => o.goals[m.home] === goals[m.home] && o.goals[m.away] === goals[m.away]); if(j >= 0) other.splice(j, 1); mine.push(m); }   /* accepted: the other dataset has the same score under another date */
      else if(!cut) problems.push(`${key}: eloratings only  ${m.date} ${m.competition} ${m.home} ${m.score} ${m.away}`);
    }
    for(const o of other) problems.push(`${key}: martj42 only   ${o.date} ${o.competition} ${JSON.stringify(o.goals)}`);

    mine.sort((x, y) => x.date.localeCompare(y.date));
    const wins = { [a]: 0, [b]: 0 }, goals = { [a]: 0, [b]: 0 }; let draws = 0;
    for(const m of mine){
      const [h, g] = m.score.split('-').map(Number); goals[m.home] += h; goals[m.away] += g;
      if(h === g) draws++; else wins[h > g ? m.home : m.away]++;
    }
    pairs[key] = { group, played: mine.length, wins, draws, goals, matches: mine,
      sources: ['https://www.eloratings.net/' + teams[a].en.replaceAll(' ', '_'), 'https://github.com/martj42/international_results'],
      official: false, crossChecked: true, approved: previous[key]?.approved ?? false };
  }
}
if(problems.length){ console.error('Unresolved disagreements (check a reference page, then add to h2h-overrides.json):\n' + problems.join('\n')); process.exit(1); }

writeFileSync(new URL('h2h.json', dir), JSON.stringify({
  note: 'Competitive meetings only: Asian Cup, Arab Cup, Gulf Cup, World Cup, World Cup qualifiers. Every match is in two independent datasets (eloratings.net, martj42/international_results); decisions on disputed matches are in h2h-overrides.json. A pair shows in the app only when approved is true and it has at least one meeting. Rebuild: node scripts/build-h2h.mjs',
  pairs }, null, 1) + '\n');
console.log(`h2h.json written: ${Object.keys(pairs).length} pairs, ${Object.values(pairs).reduce((n, p) => n + p.played, 0)} matches`);
