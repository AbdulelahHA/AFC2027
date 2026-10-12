# Design hand-off

This site ships **unstyled on purpose**: semantic HTML, no CSS, no design
decisions. Everything below is a stable hook for a design layer. Add
stylesheets in `<head>` of `index.html` (e.g. `css/*.css`); you should not
need to touch the JS. If you need different markup, the views are in
`js/views/` — one file per page, each a plain template string.

## Page structure

```
header#site-header
  h1#t-title, p#t-subtitle
  p#lang-switch > button[data-lang="en|ar"][aria-pressed]
  nav#pages > a[data-page][aria-current="page" on the active one]
p#feed-status[data-feed="loading|ok|err|none"]   (contains span#feed-updated when ok)
main
  section#page-schedule  [data-page][hidden when inactive]
  section#page-groups
  section#page-knockout
  section#page-stats
  section#page-my-teams
footer#t-footer
```
Pages switch with the URL hash: `#schedule`, `#groups`, `#knockout`, `#stats`, `#my-teams`.
Arabic sets `<html lang="ar" dir="rtl">` — use logical CSS properties (`margin-inline-start`, etc.).
Digits stay Western (0–9) in both languages.

## Schedule (`#schedule`)
```
section.day[data-date][data-day="past|today|future"]   (today's also has id="today")
  h3 > time + small (match count)
  p.countdown[hidden]                      next kick-off countdown (today only)
  ol.matches > li.match
```
`li.match` attributes:
| attribute | values |
|---|---|
| `data-state` | `upcoming` `live` `ht` `finished` |
| `data-stage` | `group` `r16` `qf` `sf` `final` |
| `data-group` | `A`–`F` (group matches) |
| `data-winner` | `home` `away` (finished, decided) |
| `data-goal` | `home` `away` — present for 30 s after that side scores (celebration hook) |
| `data-fav` | present if a followed team plays |
| `data-spotlight` | present if Saudi Arabia plays (configurable in tournament.json) |

Inside: `details > summary` holds `time.kickoff`, `span.team.home`, `span.score`,
`span.team.away`, `span.status` (minute / HT / FT…), `span.stage`.
Unknown knockout teams render as `span.team-name[data-tbd]` with text like "Winner Group A".
`div.match-details` (filled when opened): `p.venue`, `p.broadcast`, `ul.goals > li[data-side]`,
`table.shootout tr[data-side][data-scored]`, `ul.bookings > li[data-card="yellow|second-yellow|red"]`,
`div.lineup[data-team]`.

## Groups (`#groups`)
`table.group-table[data-group]#group-X` with `caption`; rows
`tr[data-team][data-position][data-qualification="top1|top2|third|out"][data-confirmed][data-live][data-fav]`.
`data-qualification` is the projection from the current table; `data-confirmed` is present once it is
certain (group finished; for third places, all groups finished).
Form column: `abbr[data-result="w|d|l"][data-live]`.
Then `table.thirds-table#third-placed` ranking all third-placed teams.

## Knockout (`#knockout`)
`p.champion[data-team]` (once decided), then `section.round[data-round]` > `h3` + `ol > li.tie`
with `[data-id][data-state][data-winner]`, `span.match-no`, `span.team[data-side][data-team|data-tbd]`,
`span.score`, `span.status`.

## Stats (`#stats`)
`dl#totals`, `section#top-scorers`, `#top-assists`, `#clean-sheets` (tables, rows `tr[data-team]`),
`section#past-winners`, `section#all-time-scorers`.

## My teams (`#my-teams`)
`form#team-picker` (checkboxes, max 5), then `article.my-team[data-team]` per followed team.

## Images
Flags: `img.flag` from flagcdn.com (`height="16"`). No other assets.
