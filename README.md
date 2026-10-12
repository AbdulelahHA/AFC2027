# AFC Asian Cup 2027 — live scores

Score site for the AFC Asian Cup Saudi Arabia 2027
(7 Jan – 5 Feb 2027, 24 teams, 51 matches, Riyadh · Jeddah · Al Khobar).
English/Arabic (RTL), all times in Mecca time. Static site, no build step,
native ES modules. Apple-Sports-style layout in four Saudi regional styles
(Najdi, Hejazi, Asiri, Hasawi), one per visit — see [DESIGN.md](DESIGN.md).

Built on the same engine as WC26 (`js/logic/` is shared code).

## Run

```
npx serve .     # ES modules don't load from file://
npm test
```

## Layout

```
index.html              markup + a tiny head script (regional style, theme) that runs before paint
css/regions.css         the four regional styles: colour tokens (light/dark), bands, patterns, emblem plaques
css/app.css             layout and components shared by every style
assets/flags/           24 flags, 4:3 SVG (flag-icons); assets/emblem/ tournament emblem cut-outs
js/main.js              boot
js/store.js             state + saved preferences (language, theme)
js/live.js              loads tournament files; polls feeds (15s near kickoffs, 60s otherwise)
js/logic/               pure, tested: feed adapter, names, status, standings, model, stats
js/views/               shell (menu, routing), scores, card (match card + lineup), groups, knockout, stats
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
