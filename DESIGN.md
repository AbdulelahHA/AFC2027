# Design

Apple-Sports-style score site in four Saudi regional styles. The reasoning behind every
choice is in the owner's vault: `AFC2027/Decisions`, `AFC2027/Saudi Design Research`,
`AFC2027/Apple Sports Study`.

## Regional styles
One per visit, picked by the head script in `index.html` (never the same twice in a row,
remembered in `localStorage.afc27_style`) and set as `<html data-variant="najdi|hejazi|asiri|hasawi">`.
Each style in `css/regions.css` defines the same tokens, light and dark:

| token | used for |
|---|---|
| `--bg --wall --surface --ink --muted --line` | page, panels, text, rules |
| `--accent --accent-2 --live --win --ok --spot-bg` | highlights, live, winners, qualification, host match |
| `--p1 … --p5` | the region's own palette (bands, plaques, heading marks) |
| `--head-bg --head-ink` | header |
| `--band --band-h` | the header band (Sadu weave, roshan crest, Qatt wall band, zari braid), reused in the match card |
| `--pat --pat-svg --pat-size` | the faint wall pattern behind every page |
| `--plq` | the emblem plaque |

Theme: `html[data-theme="light|dark"]` from the menu, else the system setting.
Arabic: `<html lang="ar" dir="rtl">`; all CSS uses logical properties. Digits stay Western.

## Structure
```
header#site-header   .emblem (trophy) · h1#t-title · button#menu-btn → div#menu[popover]
#view-scores         .daybar > .seg#days (Yesterday · Today · Upcoming) · main#panes > .pane × 3
                     .day > h3 + ol.matches > li.match[data-state|winner|goal|stage|spotlight] > button.row
#view-groups         .sec × 6 (table.gt.full) + best thirds
#view-knockout       .bk: 7 columns (R16 · QF · SF · Final · SF · QF · R16), .tie chips, .bk-key
#view-stats          dl.tiles · leaders (.seg#lead-seg) · past winners · all-time scorers
footer#t-footer      .emblem.lg (full emblem) · regional style credit
dialog#sheet         the match card (.card): score, scorers, tabs Stats (+ .lineup pitch) | Group or Knockout
```
Pages: `#scores` (default), `#groups`, `#knockout`, `#stats`. Old `#schedule` links land on Scores.

## Feed fields the design can use
Beyond the scores feed documented in `js/logic/feed.js`, two optional fields light up more of the card:
- `matches[i].stats`: `{possession:[h,a], shots:[h,a], shotsOnTarget, corners, fouls, yellow, red, offsides}`.
  Without it, yellow/red cards are counted from the extra feed's bookings.
- extra feed `lineups[side]`: `{formation:"4-2-3-1", xi:[{name,number,pos,off?}], subs:[{name,number,on?}]}`.
  The XI is drawn in formation rows (keeper first in `xi`); `off` shows ↓ on the player, `on` shows ↑ minute on the bench.

## Not designed yet
Penalty shootout (knockout only) — the data is already in `result.kicks`.
