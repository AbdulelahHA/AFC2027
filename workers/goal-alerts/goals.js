/* Goal detection, pure: last seen scores + the current scores feed → goal events + new scores.
   Team names are resolved to codes the same way the site does (teams.json names + aliases.json). */
const IN_PLAY = new Set(['LIVE', 'HT', 'ET', 'PEN']);
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

export function resolver(teams, aliases = {}){
  const map = new Map();
  for(const [code, t] of Object.entries(teams)) for(const n of [t.en, t.ar, code]) if(n) map.set(norm(n), code);
  for(const [alias, name] of Object.entries(aliases)){ const c = map.get(norm(name)); if(c) map.set(norm(alias), c); }
  return name => map.get(norm(name)) || null;
}

/* prev: {"KSA-PLE": [1, 0], …} keyed home-away as the feed lists them */
export function detectGoals(prev, feed, codeOf){
  const now = {}, events = [];
  for(const m of feed?.matches || []){
    const home = codeOf(m.home), away = codeOf(m.away);
    if(!home || !away) continue;
    const key = `${home}-${away}`, score = [m.homeScore ?? 0, m.awayScore ?? 0];
    now[key] = score;
    const was = prev[key];
    if(!was || !IN_PLAY.has(m.state)) continue;          /* first sighting or not live: remember, don't alert */
    for(const [i, side] of [[0, 'h'], [1, 'a']]){
      if(score[i] <= was[i]) continue;
      const list = (side === 'h' ? m.homeGoals : m.awayGoals) || [];
      const g = list[list.length - 1] || {};
      events.push({ key, home, away, side, score, scorer: g.name || '', minute: g.minute || '', pen: !!g.pen, og: !!g.og });
    }
  }
  return { events, scores: now };
}

/* the notification for one subscriber, in their language */
export function message(ev, teams, lang = 'en'){
  const n = c => teams[c]?.[lang] || teams[c]?.en || c, ar = lang === 'ar';
  const team = n(ev.side === 'h' ? ev.home : ev.away);
  const tags = [ev.pen && (ar ? 'جزاء' : 'pen'), ev.og && (ar ? 'هدف عكسي' : 'own goal')].filter(Boolean).join(', ');
  return {
    title: `${ar ? 'هدف' : 'GOAL'} · ${n(ev.home)} ${ev.score[0]}–${ev.score[1]} ${n(ev.away)}`,
    body: [ev.scorer && `${ev.scorer}${ev.minute ? ' ' + ev.minute : ''}${tags ? ` (${tags})` : ''}`, team].filter(Boolean).join(' · '),
    tag: `goal-${ev.key}`, url: './#scores'
  };
}

/* does this subscriber want this match? no teams chosen = every match */
export const wants = (sub, ev) => !sub.teams?.length || sub.teams.includes(ev.home) || sub.teams.includes(ev.away);
