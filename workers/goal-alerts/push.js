/* Web Push without a library: payload encryption (RFC 8291, aes128gcm) and VAPID sender
   authentication (RFC 8292), on the Web Crypto API only, so it runs in a Cloudflare Worker
   and in Node (tests/push.test.js checks it against the RFC 8291 worked example). */
const enc = new TextEncoder();
const subtle = globalThis.crypto.subtle;

export const b64u = {
  decode: s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0)),
  encode: b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
};
const concat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let i = 0; for(const p of parts){ out.set(p, i); i += p.length; } return out; };
const hmac = async (key, data) => new Uint8Array(await subtle.sign('HMAC', await subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), data));

/* a P-256 key from its raw public point (65 bytes) and, optionally, the private scalar d */
function jwk(pub, d){
  const k = { kty: 'EC', crv: 'P-256', x: b64u.encode(pub.slice(1, 33)), y: b64u.encode(pub.slice(33, 65)), ext: true };
  if(d) k.d = b64u.encode(d);
  return k;
}

/* RFC 8291 §3–4: encrypt `plaintext` for one subscription. `fixed` ({asPublic, asPrivate, salt}) is for the test vectors only. */
export async function encrypt(plaintext, uaPublicB64u, authB64u, fixed = null){
  const uaPublic = b64u.decode(uaPublicB64u), auth = b64u.decode(authB64u);
  let asPublic, asPrivateKey;
  if(fixed){
    asPublic = b64u.decode(fixed.asPublic);
    asPrivateKey = await subtle.importKey('jwk', jwk(asPublic, b64u.decode(fixed.asPrivate)), { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  } else {
    const kp = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    asPublic = new Uint8Array(await subtle.exportKey('raw', kp.publicKey)); asPrivateKey = kp.privateKey;
  }
  const salt = fixed ? b64u.decode(fixed.salt) : crypto.getRandomValues(new Uint8Array(16));
  const uaKey = await subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: uaKey }, asPrivateKey, 256));
  const prkKey = await hmac(auth, ecdh);
  const ikm = await hmac(prkKey, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic, [1]));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(enc.encode('Content-Encoding: aes128gcm\0'), [1]))).slice(0, 16);
  const nonce = (await hmac(prk, concat(enc.encode('Content-Encoding: nonce\0'), [1]))).slice(0, 12);
  const key = await subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const body = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, concat(plaintext, [2])));
  const rs = 4096, header = concat(salt, [rs >>> 24 & 255, rs >>> 16 & 255, rs >>> 8 & 255, rs & 255], [asPublic.length], asPublic);
  return { header, body, payload: concat(header, body) };
}

/* RFC 8292: a signed JWT naming us to the push service */
export async function vapidAuth(endpoint, publicB64u, privateB64u, subject){
  const pub = b64u.decode(publicB64u);
  const key = await subtle.importKey('jwk', jwk(pub, b64u.decode(privateB64u)), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u.encode(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u.encode(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const sig = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${head}.${claims}`));
  return `vapid t=${head}.${claims}.${b64u.encode(sig)}, k=${publicB64u}`;
}

/* send one notification; returns the push service's HTTP status (404/410 = subscription gone) */
export async function sendPush(sub, data, vapid){
  const { payload } = await encrypt(enc.encode(JSON.stringify(data)), sub.keys.p256dh, sub.keys.auth);
  const res = await fetch(sub.endpoint, { method: 'POST', body: payload, headers: {
    Authorization: await vapidAuth(sub.endpoint, vapid.publicKey, vapid.privateKey, vapid.subject),
    'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '3600', Urgency: 'high'
  } });
  return res.status;
}

/* a new VAPID key pair (run once: node workers/goal-alerts/keys.js) */
export async function newVapidKeys(){
  const kp = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = new Uint8Array(await subtle.exportKey('raw', kp.publicKey)), priv = await subtle.exportKey('jwk', kp.privateKey);
  return { publicKey: b64u.encode(pub), privateKey: priv.d };
}
