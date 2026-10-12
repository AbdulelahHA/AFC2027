/* Web Push encryption checked byte-for-byte against RFC 8291 Appendix A, plus a VAPID signature check. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encrypt, vapidAuth, newVapidKeys, b64u } from '../workers/goal-alerts/push.js';

test('aes128gcm encryption matches the RFC 8291 worked example', async () => {
  const { header, body } = await encrypt(b64u.decode('V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24'),
    'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', 'BTBZMqHH6r4Tts7J_aSIgg',
    { asPublic: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
      asPrivate: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw', salt: 'DGv6ra1nlYgDCS1FRnbzlw' });
  assert.equal(b64u.encode(header), 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8');
  assert.equal(b64u.encode(body), '8pfeW0KbunFT06SuDKoJH9Ql87S1QUrdirN6GcG7sFz1y1sqLgVi1VhjVkHsUoEsbI_0LpXMuGvnzQ');
});

test('VAPID JWT is ES256-signed by our key and names the push service', async () => {
  const keys = await newVapidKeys();
  const auth = await vapidAuth('https://web.push.apple.com/abc', keys.publicKey, keys.privateKey, 'mailto:test@example.com');
  const [, jwt, k] = auth.match(/^vapid t=([^,]+), k=(.+)$/);
  assert.equal(k, keys.publicKey);
  const [h, c, s] = jwt.split('.');
  const claims = JSON.parse(new TextDecoder().decode(b64u.decode(c)));
  assert.equal(claims.aud, 'https://web.push.apple.com');
  assert.ok(claims.exp > Date.now() / 1000);
  const pub = await crypto.subtle.importKey('raw', b64u.decode(keys.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, b64u.decode(s), new TextEncoder().encode(`${h}.${c}`)));
});
