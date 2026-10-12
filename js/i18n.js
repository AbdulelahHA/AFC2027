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
export const roundShort = r => state.data.tournament.roundShort[r][state.lang];
export const plural = (n, one, many) => n === 1 ? t(one) : t(many);

/* "King Fahd Sports City, Riyadh" in the current language */
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
    case 'W': return a ? `الفائز من المباراة ${rest}` : `Winner match ${rest}`;
    case 'L': return a ? `الخاسر من المباراة ${rest}` : `Loser match ${rest}`;
    default: return code;
  }
}

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const flagCode = code => state.data.teams[code]?.flag || '';
export const flag = (code, size = 'h24', alt = '') =>
  code && flagCode(code) ? `<img class="flag" src="https://flagcdn.com/${size}/${flagCode(code)}.png" alt="${esc(alt)}" height="16" loading="lazy" onerror="this.remove()">` : '';
