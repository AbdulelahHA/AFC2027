/* Text lookups in the current language + small HTML helpers shared by views. */
import strings from './strings.js';
import { state } from './store.js';

export const ar = () => state.lang === 'ar';

/* UI string first, then the tournament's own text, then English */
export function t(key){
  const own = state.data?.tournament.text;
  return strings[state.lang][key] ?? own?.[state.lang]?.[key] ?? strings.en[key] ?? own?.en?.[key] ?? key;
}

export const teamName = code => state.data.teams[code]?.[state.lang] || state.data.teams[code]?.en || code;
export const dayName = weekday => strings[state.lang].weekdays[weekday] || weekday;
export const monthName = mo => t('months')[mo];
export const roundLabel = r => state.data.tournament.roundLabel[r][state.lang];

/* "King Fahd Sports City Stadium, Riyadh" in the current language */
export function venueText(code){
  const v = state.data.tournament.venues[code];
  if(!v) return '';
  return ar() ? `${v.nameAr || v.name}، ${v.cityAr || v.city}` : `${v.name}, ${v.city}`;
}

/* a knockout slot before its team is known: "1A" → "Winner Group A" */
export function slotText(code){
  const a = ar(), rest = code.slice(1);
  switch(code[0]){
    case '1': return a ? `متصدر المجموعة ${rest}` : `Winner Group ${rest}`;
    case '2': return a ? `وصيف المجموعة ${rest}` : `Runner-up Group ${rest}`;
    case '3': return a ? `ثالث المجموعات ${rest.slice(1).split('').join('/')}` : `3rd Group ${rest.slice(1).split('').join('/')}`;
    case 'W': return a ? `الفائز في المباراة ${rest}` : `Winner match ${rest}`;
    case 'L': return a ? `الخاسر في المباراة ${rest}` : `Loser match ${rest}`;
    default: return code;
  }
}
/* the same slot as a short code for the compact bracket chips: "3:BEF" → "3BEF" */
export const slotShort = code => code.replace(':', '');

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* every flag is a 4:3 vector drawing (assets/flags, from flag-icons), so flags at one height match in size */
export const flagImg = (iso, alt = '') => iso ? `<img class="flag" src="assets/flags/${iso}.svg" alt="${esc(alt)}" loading="lazy" onerror="this.remove()">` : '';
export const flag = (code, alt = '') => flagImg(state.data.teams[code]?.flag, alt);
