# AFC Asian Cup 2027 — live scores

Plain, **unstyled** score site for the AFC Asian Cup Saudi Arabia 2027
(7 Jan – 5 Feb 2027, 24 teams, 51 matches, Riyadh · Jeddah · Al Khobar).
English/Arabic (RTL), all times in Mecca time. Static site, no build step,
native ES modules. Design is a separate layer — see [DESIGN.md](DESIGN.md).

Built on the same engine as WC26 (`js/logic/` is shared code).

## Run

```
npx serve .     # ES modules don't load from file://
npm test
```

## Layout

```
index.html              semantic markup only
js/main.js              boot
js/store.js             state + saved preferences (language, followed teams)
js/live.js              loads tournament files; polls feeds (15s near kickoffs, 60s otherwise)
js/logic/               pure, tested: feed adapter, names, status, standings, model, stats
js/views/               schedule, groups, knockout, stats, my-teams, shell
tournaments/afc2027/    all tournament data (JSON)
tests/                  data validator + full simulated tournament
docs/data-sources.md    where every fact came from
```

## Data status (as of 12 Oct 2026)

Confirmed from AFC's official post-draw schedule (5 June 2026): groups,
all 51 fixtures with dates and venues, knockout slots, the 8 stadiums.
Best-third table and tie-breakers are from the 2023 regulations (same format;
the 2027 edition isn't public).

Still open — update `tournaments/afc2027/` when announced:
- **Kickoff times**: not published. Fixtures have `"kickoff": null` and the
  site shows "Time TBC". Set `kickoff` (UTC ISO) per match when AFC publishes.
- **Live score feed**: none connected. Set `feeds.scores` (and optionally
  `feeds.extra`) in `tournament.json` to a Worker URL returning the same JSON
  shape as WC26's Workers (see `js/logic/feed.js`).
- **Where to watch**: Saudi/MENA rights holder for 2027 unconfirmed. Set
  `broadcast.default` to `{"en": "...", "ar": "..."}` once known.
