/* Launch screen: stays at least 2 s from the moment the page started (and until the app has its data
   and fonts), then the cup plaque flies into its place in the header while the background fades away. */
const MIN_MS = 2000, FLY_MS = 700;
const wait = ms => new Promise(r => setTimeout(r, ms));
let done = false;

export async function hideSplash(){
  const sp = document.getElementById('splash');
  if(done || !sp) return;
  done = true;
  await Promise.race([document.fonts?.ready, wait(1500)]);         /* the phrase in its own font, not a fallback */
  const left = MIN_MS - performance.now();                          /* performance.now() counts from page start */
  if(left > 0) await wait(left);

  const root = document.documentElement, plq = document.getElementById('sp-plq');
  const target = document.querySelector('#site-header .emblem');
  const finish = () => { sp.remove(); root.classList.remove('splashing'); if(target) target.style.visibility = ''; };
  if(matchMedia('(prefers-reduced-motion: reduce)').matches || !target){
    sp.classList.add('leaving', 'fade'); return setTimeout(finish, 320);
  }
  /* the plaque lands exactly on the header emblem (same element shape, so the swap is seamless) */
  const a = plq.getBoundingClientRect(), b = target.getBoundingClientRect();
  const dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
  target.style.visibility = 'hidden';
  sp.classList.add('leaving');
  plq.style.transform = `translate(${dx}px, ${dy}px) scale(${b.width / a.width})`;
  setTimeout(finish, FLY_MS + 40);
}
