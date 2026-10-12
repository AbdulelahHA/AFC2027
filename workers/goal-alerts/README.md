# Goal alerts (Cloudflare Worker)

Sends a push notification to phones when a followed team scores. Free tier is plenty.

```
site (Goal alerts page) ──POST /subscribe──▶ Worker ──▶ KV "SUBS"
scores feed ──(cron, every minute)──▶ Worker: new goal? ──▶ Apple / Google push ──▶ phone
```

- `push.js` — Web Push encryption (RFC 8291) + VAPID (RFC 8292) on Web Crypto, no dependencies. Tested against the RFC's worked example (`tests/push.test.js`).
- `goals.js` — goal detection from the scores feed, who wants which match, the message (EN/AR). Tested in `tests/goals.test.js`.
- `index.js` — the Worker: `/subscribe`, `/unsubscribe`, `/test`, and the cron.

## Deploy (once)
```
cd workers/goal-alerts
npx wrangler login                          # opens the browser, Cloudflare account
npx wrangler kv namespace create SUBS       # copy the id into wrangler.toml
npx wrangler secret put VAPID_PRIVATE       # paste the private key from Desktop\AFC2027-secrets\goal-alerts-vapid.txt
npx wrangler deploy                         # prints https://afc27-goal-alerts.<you>.workers.dev
```
Then put that URL in `tournaments/afc2027/tournament.json` → `alerts.worker`. The Goal alerts page switches on.

When a live scores feed exists, set `FEED_URL` in `wrangler.toml` to it and deploy again.

## Notes
- iPhone: web push only works for the app **added to the Home Screen** (iOS 16.4+); the page explains this.
- New keys: `node workers/goal-alerts/keys.js` (then update `VAPID_PUBLIC` here, `alerts.vapidPublicKey` in tournament.json, and the secret). Old subscriptions stop working.
- Subscriptions the push service reports gone (404/410) are deleted automatically.
