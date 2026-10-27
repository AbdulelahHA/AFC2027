# AFC Asian Cup 2027 — live scores

**Live:** https://abdulelahha.github.io/AFC2027/ · **Demo with fake match data:** https://abdulelahha.github.io/AFC2027/?t=demo

A fan-made live-score site for the **AFC Asian Cup Saudi Arabia 2027**
(7 Jan – 5 Feb 2027 · 24 teams · 51 matches · Riyadh, Jeddah, Al Khobar).
Scores, group tables, a knockout bracket, stats, head-to-head records and goal
alerts — in **English and Arabic (RTL)**, every time shown in **Mecca time**.
Unofficial personal project; not affiliated with the AFC.

## Context

This is the sister site of [WC26](https://github.com/AbdulelahHA/WC26), the World Cup 2026
score site. WC26 was rebuilt in October 2026 into a tournament-agnostic engine: all
tournament facts live in a data folder, and the logic in `js/logic/` is pure and tested.
AFC2027 is that engine pointed at a new tournament, in its own repo so each site can
deploy and evolve on its own.

What makes this one different:

- **A Saudi look.** Four regional styles — **Najdi, Hejazi, Asiri, Hasawi** — one picked
  at random per visit (never the same twice in a row). Ornament sits on the frame
  (header band, wall pattern, emblem plaque); match rows stay plain so they read at a
  glance. Patterns are CSS gradients and SVG masks, no images. See [DESIGN.md](DESIGN.md).
- **Apple-Sports-style navigation.** Yesterday · Today · Upcoming, a menu for Groups,
  Knockout, Stats, Goal alerts, language and appearance. Tapping a match opens a glass
  card with tabs (Group · Head-to-head · Stats, reordered once a match goes live) and
  starting lineups on a pitch.
- **Honest data.** Nothing is guessed: "Qualified" appears only once it's certain, a
  missing broadcaster is hidden, and with no score feed the site says so instead of
  showing fake scores.

## How it works

```
tournaments/afc2027/*.json ──┐
                             ├─► js/live.js ─► js/logic/ (feed → model) ─► store ─► views
score feed (Worker, optional)┘
```

- **Static site, no backend, no build step.** `index.html` + native ES modules + CSS,
  served by GitHub Pages.
- **All tournament data is JSON** in `tournaments/afc2027/`: teams, fixtures (with kickoff
  times and venues), knockout slots, history, head-to-head records. The engine resolves the
  knockout bracket from slot codes (`1A`, `2B`, `3:CDE`, `W37`) and AFC's 15-combination
  best-third table.
- **Matching is by team code, never by name.** A feed's team names are mapped to codes
  once (`aliases.json`); everything after that keys on codes.
- **Polling** every 15 s from 10 min before a kickoff until 3 h after, 60 s otherwise.
  With `feeds.scores: null` (today) nothing is polled and the site runs on fixtures alone.
- **Goal alerts** are web push, sent by a Cloudflare Worker in
  [`workers/goal-alerts`](workers/goal-alerts) (KV for subscriptions, a cron every minute,
  RFC 8291/8292 on Web Crypto, no dependencies). On iPhone it works from the Home Screen
  app only (iOS 16.4+).

## How it was built

1. **Data first** (12 Oct 2026). Groups, all 51 fixtures, venues and knockout slots taken
   from AFC's post-draw schedule; a source for every fact in
   [docs/data-sources.md](docs/data-sources.md). Where AFC and Wikipedia disagree, AFC wins.
   2027 regulations aren't public, so the best-third table and tie-breakers follow the
   2023 edition (same format).
2. **Engine reused, not rewritten.** `js/logic/` copied from WC26, where it was tested on all
   104 real World Cup results and its bracket matched FIFA's official draw.
3. **Plain build, then design.** The site first shipped as unstyled semantic HTML with
   stable hooks; the design was done separately in mockups (Saudi design research, an
   Apple Sports study), approved piece by piece, then ported into the app.
4. **Features, one approved step at a time:** countdown to kickoff, lineups, two-sided
   bracket, goal alerts, head-to-head tab, real kickoff times.
5. **Head-to-head** counts competitive men's senior meetings only (Asian Cup, Arab Cup,
   Gulf Cup, World Cup and its qualifiers). Every match is confirmed by two independent
   datasets (eloratings.net and martj42/international_results); fixes are recorded in
   `h2h-overrides.json`. Rebuild with `npm run h2h`.

Every push to `main` runs the tests in GitHub Actions and deploys to Pages only if they
pass ([.github/workflows/pages.yml](.github/workflows/pages.yml)) — a broken data edit
can't go live.

## Run

```
npx serve .     # ES modules don't load from file://
npm test
```

**Try the design with fake match data:** open the site with `?t=demo`. It runs on the real
teams and fixtures plus the fake feeds in `tournaments/demo/`, with the clock set to
8 Jan 2027 (yesterday's result, today's finished + live matches, lineups, stats).
Any page also takes `?now=2027-01-22T19:00:00+03:00` to try another moment.
The plain address always shows the real tournament.

## Layout

```
index.html              markup + a tiny head script (regional style, theme) that runs before paint
css/regions.css         the four regional styles: colour tokens (light/dark), bands, patterns, emblem plaques
css/app.css             layout and components shared by every style
assets/                 flags (4:3 SVG, flag-icons), tournament emblem cut-outs, app icons
js/main.js              boot
js/store.js             state + saved preferences (language, theme)
js/live.js              loads tournament files; polls feeds
js/logic/               pure, tested: feed adapter, names, status, standings, model, h2h, stats
js/views/               shell (menu, routing), splash, scores, card (match card + lineup), groups, knockout, stats, alerts
sw.js                   service worker for goal-alert push notifications
tournaments/afc2027/    all tournament data (JSON)
tournaments/demo/       fake feeds for ?t=demo
workers/goal-alerts/    Cloudflare Worker that sends goal alerts
scripts/build-h2h.mjs   rebuilds head-to-head data from two datasets
tests/                  data validator, full simulated tournament, goal detection, push, worker
docs/data-sources.md    where every fact came from
```

## Status (Oct 2026)

Done: design, all 51 kickoff times, head-to-head for the 36 group pairs, goal-alerts Worker
deployed.

Still open — update `tournaments/afc2027/` when ready:
- **Live score feed**: not connected yet. Set `feeds.scores` (and optionally `feeds.extra`)
  in `tournament.json` to a Worker URL returning the shape in `js/logic/feed.js`. Goal
  alerts have nothing to send until then.
- **AFC tie-breakers** (head-to-head first, Art. 7.3): decided, not built. Tables currently
  order by points, goal difference, goals scored.
- **Where to watch**: Saudi/MENA rights holder unconfirmed. Set `broadcast.default` to
  `{"en": "...", "ar": "..."}` once known.
- **Knockout head-to-head**: added round by round once the group stage settles the pairs.

Engine fixes in `js/logic/` should also go to WC26.
