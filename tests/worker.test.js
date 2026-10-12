/* The goal-alerts Worker end to end, with Cloudflare and the push service faked:
   a phone subscribes, the feed goes 1–0 → 2–0 live, and the push the Worker sends is decrypted
   with the phone's private key (as a phone would) to check what it says. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../workers/goal-alerts/index.js';
import { newVapidKeys, b64u } from '../workers/goal-alerts/push.js';

const subtle = crypto.subtle, enc = new TextEncoder();
const repo = f => readFileSync(new URL('../tournaments/afc2027/' + f, import.meta.url), 'utf8');
const hmac = async (k, d) => new Uint8Array(await subtle.sign('HMAC', await subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), d));
const cat = (...p) => { const o = new Uint8Array(p.reduce((n, x) => n + x.length, 0)); let i = 0; for(const x of p){ o.set(x, i); i += x.length; } return o; };

/* what the phone does with an incoming push (RFC 8291, receiving side) */
async function decrypt(payload, uaKeys, uaPublic, auth){
  const salt = payload.slice(0, 16), idlen = payload[20], asPublic = payload.slice(21, 21 + idlen), body = payload.slice(21 + idlen);
  const asKey = await subtle.importKey('raw', asPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: asKey }, uaKeys.privateKey, 256));
  const ikm = await hmac(await hmac(auth, ecdh), cat(enc.encode('WebPush: info\0'), uaPublic, asPublic, [1]));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(enc.encode('Content-Encoding: aes128gcm\0'), [1]))).slice(0, 16);
  const nonce = (await hmac(prk, cat(enc.encode('Content-Encoding: nonce\0'), [1]))).slice(0, 12);
  const plain = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: nonce }, await subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']), body));
  return JSON.parse(new TextDecoder().decode(plain.slice(0, plain.lastIndexOf(2))));
}

test('a goal in the feed reaches a subscribed phone, encrypted, and only once', async () => {
  /* a fake phone */
  const uaKeys = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const uaPublic = new Uint8Array(await subtle.exportKey('raw', uaKeys.publicKey)), auth = crypto.getRandomValues(new Uint8Array(16));
  const sub = { endpoint: 'https://push.example.test/send/abc', keys: { p256dh: b64u.encode(uaPublic), auth: b64u.encode(auth) } };
  /* fake Cloudflare KV + env */
  const kv = new Map();
  const vapid = await newVapidKeys();
  const env = { SITE_URL: 'https://site.example.test/AFC2027/', FEED_URL: 'https://feed.example.test/scores.json',
    VAPID_PUBLIC: vapid.publicKey, VAPID_PRIVATE: vapid.privateKey, VAPID_SUBJECT: 'mailto:test@example.test',
    SUBS: { get: async (k, type) => kv.has(k) ? (type === 'json' ? JSON.parse(kv.get(k)) : kv.get(k)) : null,
      put: async (k, v) => { kv.set(k, v); }, delete: async k => { kv.delete(k); },
      list: async ({ prefix }) => ({ keys: [...kv.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }) } };
  /* fake network: the site's team files, a feed we control, and a push service that records what it receives */
  let feed, pushes = [];
  globalThis.fetch = async (url, opts = {}) => {
    url = String(url);
    if(url.startsWith(env.SITE_URL)) return new Response(repo(url.endsWith('teams.json') ? 'teams.json' : 'aliases.json'));
    if(url.startsWith(env.FEED_URL)) return new Response(JSON.stringify(feed));
    if(url === sub.endpoint){ pushes.push(opts); return new Response('', { status: 201 }); }
    throw new Error('unexpected fetch ' + url);
  };
  const live = (h, a, goals) => ({ matches: [{ home: 'Saudi Arabia', away: 'Palestine', homeScore: h, awayScore: a, state: 'LIVE', homeGoals: goals, awayGoals: [] },
                                             { home: 'Japan', away: 'Qatar', homeScore: 1, awayScore: 0, state: 'LIVE', homeGoals: [], awayGoals: [] }] });

  /* the browser's pre-flight must succeed and allow the site, or "Turn on" fails in every browser */
  const pre = await worker.fetch(new Request('https://w.test/subscribe', { method: 'OPTIONS', headers: { Origin: 'https://site.example.test' } }), env);
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('Access-Control-Allow-Origin'), 'https://site.example.test');
  assert.match(pre.headers.get('Access-Control-Allow-Headers'), /Content-Type/);
  /* the phone subscribes for Saudi Arabia only, in Arabic */
  const res = await worker.fetch(new Request('https://w.test/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub, teams: ['KSA'], lang: 'ar' }) }), env);
  assert.equal(res.status, 200);
  feed = live(1, 0, [{ name: 'Saudi Nine', minute: "23'" }]);
  await worker.scheduled({}, env);
  assert.equal(pushes.length, 0, 'first look at the feed only records the scores');
  feed = live(2, 0, [{ name: 'Saudi Nine', minute: "23'" }, { name: 'Saudi Ten', minute: "71'", pen: true }]);
  feed.matches[1].homeScore = 2;                       /* Japan score too, but this phone only follows KSA */
  await worker.scheduled({}, env);
  assert.equal(pushes.length, 1, 'one alert, for the followed team only');
  assert.equal(pushes[0].headers['Content-Encoding'], 'aes128gcm');
  assert.match(pushes[0].headers.Authorization, /^vapid t=.+, k=/);
  const msg = await decrypt(new Uint8Array(pushes[0].body), uaKeys, uaPublic, auth);
  assert.equal(msg.title, 'هدف · السعودية 2–0 فلسطين');
  assert.match(msg.body, /Saudi Ten 71' \(جزاء\)/);
  await worker.scheduled({}, env);
  assert.equal(pushes.length, 1, 'no repeat on the next minute');
});
