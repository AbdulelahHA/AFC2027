/* Head-to-head between two teams, from tournaments/<id>/h2h.json ("pairs", keyed "AAA-BBB" with the codes sorted).
   A pair shows only once its "approved" flag is true (or in review mode) and it has at least one meeting. */
export const pairKey = (a, b) => [a, b].sort().join('-');

/* → null, or the record oriented to (a, b): wins/goals per side, draws, and the newest `n` meetings first */
export function h2hOf(pairs, a, b, { review = false, n = 5 } = {}){
  const p = a && b && pairs?.[pairKey(a, b)];
  if(!p || !p.matches?.length || !(p.approved || review)) return null;
  return {
    a, b, played: p.matches.length, draws: p.draws,
    wins: [p.wins[a], p.wins[b]], goals: [p.goals[a], p.goals[b]],
    last: p.matches.slice(-n).reverse().map(m => ({ ...m, hg: +m.score.split('-')[0], ag: +m.score.split('-')[1] }))
  };
}
