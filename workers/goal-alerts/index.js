/* AFC2027 goal alerts — a Cloudflare Worker.
   HTTP:  POST /subscribe {subscription, teams, lang}   remember a phone (KV)
          POST /unsubscribe {endpoint}                  forget it
          POST /test {endpoint}                         send that phone a test alert
   Cron (every minute): read the scores feed, find new goals, push them to everyone following either team.
   Config (wrangler.toml): SITE_URL, FEED_URL, VAPID_PUBLIC, VAPID_SUBJECT; secret VAPID_PRIVATE; KV binding SUBS. */
import { sendPush } from './push.js';
import { resolver, detectGoals, message, wants } from './goals.js';

const json = (body, status = 200, origin = '*') => new Response(JSON.stringify(body), { status, headers: {
  'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
const subKey = async endpoint => 'sub:' + [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint)))].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
const vapidOf = env => ({ publicKey: env.VAPID_PUBLIC, privateKey: env.VAPID_PRIVATE, subject: env.VAPID_SUBJECT });
const validSub = s => s && typeof s.endpoint === 'string' && /^https:\/\//.test(s.endpoint) && s.keys?.p256dh && s.keys?.auth;

async function teamsOf(env){
  const base = env.SITE_URL.replace(/\/?$/, '/') + 'tournaments/afc2027/';
  const [teams, aliases] = await Promise.all(['teams.json', 'aliases.json'].map(f => fetch(base + f).then(r => r.json()).catch(() => ({}))));
  return { teams, aliases };
}

export default {
  async fetch(req, env){
    const allow = new URL(env.SITE_URL).origin;          /* only the site itself may call us from a browser */
    if(req.method === 'OPTIONS') return json({}, 204, allow);
    if(req.method !== 'POST') return json({ ok: true, service: 'afc27 goal alerts' }, 200, allow);
    const path = new URL(req.url).pathname;
    let body; try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400, allow); }

    if(path === '/subscribe'){
      if(!validSub(body.subscription)) return json({ error: 'bad subscription' }, 400, allow);
      const teams = Array.isArray(body.teams) ? body.teams.filter(c => /^[A-Z]{3}$/.test(c)).slice(0, 24) : [];
      await env.SUBS.put(await subKey(body.subscription.endpoint), JSON.stringify({ sub: body.subscription, teams, lang: body.lang === 'ar' ? 'ar' : 'en', at: Date.now() }));
      return json({ ok: true, teams }, 200, allow);
    }
    if(path === '/unsubscribe'){
      if(typeof body.endpoint !== 'string') return json({ error: 'bad endpoint' }, 400, allow);
      await env.SUBS.delete(await subKey(body.endpoint));
      return json({ ok: true }, 200, allow);
    }
    if(path === '/test'){
      const rec = typeof body.endpoint === 'string' && await env.SUBS.get(await subKey(body.endpoint), 'json');
      if(!rec) return json({ error: 'not subscribed' }, 404, allow);
      const ar = rec.lang === 'ar';
      const status = await sendPush(rec.sub, { title: ar ? 'تنبيهات الأهداف تعمل' : 'Goal alerts are on',
        body: ar ? 'ستصلك الأهداف هنا أثناء البطولة.' : 'Goals will arrive here during the tournament.', tag: 'test', url: './#alerts' }, vapidOf(env));
      return json({ ok: status < 300, status }, 200, allow);
    }
    return json({ error: 'not found' }, 404, allow);
  },

  async scheduled(_event, env){
    if(!env.FEED_URL) return;                                   /* no live feed configured yet */
    const feed = await fetch(env.FEED_URL + (env.FEED_URL.includes('?') ? '&' : '?') + '_=' + Date.now()).then(r => r.ok ? r.json() : null).catch(() => null);
    if(!feed) return;
    const { teams, aliases } = await teamsOf(env);
    const prev = await env.SUBS.get('state:scores', 'json') || {};
    const { events, scores } = detectGoals(prev, feed, resolver(teams, aliases));
    await env.SUBS.put('state:scores', JSON.stringify(scores));
    if(!events.length) return;
    let cursor;
    do {
      const page = await env.SUBS.list({ prefix: 'sub:', cursor });
      for(const k of page.keys){
        const rec = await env.SUBS.get(k.name, 'json'); if(!rec) continue;
        for(const ev of events.filter(e => wants(rec, e))){
          const status = await sendPush(rec.sub, message(ev, teams, rec.lang), vapidOf(env)).catch(() => 0);
          if(status === 404 || status === 410){ await env.SUBS.delete(k.name); break; }   /* the phone unsubscribed */
        }
      }
      cursor = page.list_complete ? null : page.cursor;
    } while(cursor);
  }
};
