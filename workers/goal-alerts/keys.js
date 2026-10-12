/* Makes a new VAPID key pair for goal alerts. Run once: node workers/goal-alerts/keys.js
   Put the public key in wrangler.toml (VAPID_PUBLIC) and tournament.json (alerts.vapidPublicKey);
   keep the private key out of git: `npx wrangler secret put VAPID_PRIVATE` and paste it. */
import { newVapidKeys } from './push.js';
const k = await newVapidKeys();
console.log('VAPID_PUBLIC  =', k.publicKey);
console.log('VAPID_PRIVATE =', k.privateKey, '  (secret: never commit)');
