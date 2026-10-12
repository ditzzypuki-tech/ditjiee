// DITZ MARKET — backend asli (Netlify Functions v2 + Netlify Blobs).
// Admin HANYA ditentukan oleh variabel lingkungan ADMIN_USERNAME + ADMIN_PASSWORD.
// Pembayaran TIDAK PERNAH disetujui otomatis: hanya sesi admin yang bisa mengubah status pesanan.
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';
import { P as BASE_P, F, ML_FLAT } from './catalog.mjs';

export const config = { path: '/api/*' };

const FEE = 1500, PAY = 15 * 60000, DAY = 86400000;
const U = 'Menunggu Pembayaran', V = 'Menunggu Verifikasi', PD = 'Dibayar - Diproses', D = 'Berhasil', X = 'Kedaluwarsa', C = 'Dibatalkan';
const STAT = [U, V, PD, D, X, C];
const METHODS = ['QRIS', 'GoPay', 'DANA'];
const ADMIN_USER = () => String(process.env.ADMIN_USERNAME || '').trim().toLowerCase();
const SECRET = () => process.env.SESSION_SECRET || '';

const store = () => getStore({ name: 'ditz-market', consistency: 'strong' });
const rp = n => 'Rp' + Number(n).toLocaleString('id-ID');
const hex = n => crypto.randomBytes(n).toString('hex').slice(0, n).toUpperCase();
const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const same = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
class HttpErr extends Error { constructor(m, s = 400) { super(m); this.status = s; } }
const bad = (m, s) => { throw new HttpErr(m, s); };

/* ---------- penyimpanan ---------- */
const getJ = async k => { try { return await store().get(k, { type: 'json' }); } catch { return null; } };
const setJ = (k, v) => store().setJSON(k, v);
async function listKeys(prefix) { const out = []; for await (const pg of store().list({ prefix, paginate: true })) out.push(...pg.blobs.map(b => b.key)); return out; }
async function allOrders() {
  const now = Date.now(), list = (await Promise.all((await listKeys('orders/')).map(getJ))).filter(Boolean);
  for (const o of list) if (o.status === U && now > o.expiresAt) { o.status = X; await setJ('orders/' + o.id, o); }
  return list;
}
const defSettings = () => ({ paymentDisabled: false, products: {}, skus: {}, promos: { HEMAT10: { type: 'percent', value: 10, maxDiscount: 5000, minPrice: 0, maxUses: 0, expires: 0, active: true } } });
const getSettings = async () => (await getJ('settings')) || defSettings();

/* ---------- sesi (cookie bertanda tangan HMAC) ---------- */
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const sign = p => crypto.createHmac('sha256', SECRET()).update(p).digest('base64url');
function makeCookie(user, admin) {
  const ttl = admin ? 12 * 3600000 : 7 * DAY, p = b64({ u: user, a: admin ? 1 : 0, e: Date.now() + ttl });
  return `ditz_s=${p}.${sign(p)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(ttl / 1000)}`;
}
const clearCookie = 'ditz_s=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
function session(req) {
  const m = /(?:^|;\s*)ditz_s=([^;]+)/.exec(req.headers.get('cookie') || ''); if (!m || !SECRET()) return null;
  const [p, s] = m[1].split('.'); if (!p || !s || !same(sign(p), s)) return null;
  try {
    const d = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (Date.now() > d.e) return null;
    // admin hanya sah jika nama akunnya = ADMIN_USERNAME saat ini
    return { user: d.u, admin: !!d.a && !!ADMIN_USER() && d.u === ADMIN_USER() };
  } catch { return null; }
}

/* ---------- password pengguna biasa (scrypt) ---------- */
const hashPw = pw => { const s = crypto.randomBytes(16).toString('hex'); return s + ':' + crypto.scryptSync(pw, s, 32).toString('hex'); };
function checkPw(pw, st) { const [s, h] = String(st || '').split(':'); if (!s || !h) return false; const x = crypto.scryptSync(pw, s, 32); const y = Buffer.from(h, 'hex'); return x.length === y.length && crypto.timingSafeEqual(x, y); }

/* ---------- pembatas percobaan login ---------- */
async function throttle(key, ok) {
  const k = 'throttle/' + crypto.createHash('sha1').update(key).digest('hex'), t = (await getJ(k)) || { n: 0, until: 0 }, now = Date.now();
  if (t.until > now) bad('Terlalu banyak percobaan. Coba lagi ' + Math.ceil((t.until - now) / 60000) + ' menit lagi.', 429);
  if (ok === undefined) return;
  if (ok) { if (t.n) await store().delete(k); return; }
  t.n++; if (t.n >= 5) { t.until = now + 15 * 60000; t.n = 0; } await setJ(k, t);
}

/* ---------- logika bisnis ---------- */
const validPrices = p => Array.isArray(p) && p.length === 6 && p.every(v => Number.isInteger(v) && v >= 1000 && v <= 10000000);
const priceOf = (S, p, i) => { const o = S.products[p], a = o && validPrices(o.prices) ? o.prices : BASE_P[p]; return a ? a[i] || 0 : 0; };
function promoCalc(S, orders, code, user, price) {
  const c = String(code || '').trim().toUpperCase(); if (!c) return { discount: 0 };
  const p = S.promos[c]; if (!p || !p.active) return { err: 'Kode promo tidak valid.' };
  if (p.expires && Date.now() > p.expires) return { err: 'Kode promo sudah kedaluwarsa.' };
  if (p.minPrice && price < p.minPrice) return { err: 'Kode ini berlaku untuk paket minimal ' + rp(p.minPrice) + '.' };
  const live = orders.filter(o => o.promo === c && o.status !== X && o.status !== C);
  if (p.maxUses && live.length >= p.maxUses) return { err: 'Kuota kode promo sudah habis.' };
  if (live.some(o => o.user === user)) return { err: 'Kode promo ini sudah kamu pakai.' };
  let d = p.type === 'percent' ? Math.floor(price * p.value / 100) : p.value;
  if (p.maxDiscount && d > p.maxDiscount) d = p.maxDiscount;
  d = Math.min(d, price - 1000);
  return d <= 0 ? { err: 'Kode promo tidak berlaku untuk paket ini.' } : { discount: d, code: c };
}
const mlSold = orders => { const r = {}; orders.forEach(o => { if (o.product === 'Mobile Legends' && o.status !== X && o.status !== C) r[o.pkgIdx] = (r[o.pkgIdx] || 0) + 1; }); return r; };
const catalog = (S, orders) => ({ serverTime: Date.now(), paymentDisabled: !!S.paymentDisabled, products: S.products, fields: F, mlSold: mlSold(orders), autoMethods: [] });
const adminSettings = (S, orders) => Object.assign(catalog(S, orders), { skus: S.skus, integrations: { midtrans: false, xendit: false, digiflazz: false, digiflazzWebhook: false, telegram: false } });

/* ---------- rute ---------- */
const routes = [];
const R = (m, re, fn, admin) => routes.push({ m, re, fn, admin: !!admin });

R('GET', /^\/catalog$/, async () => { const [S, o] = await Promise.all([getSettings(), allOrders()]); return catalog(S, o); });
R('GET', /^\/me$/, async (c) => ({ user: c.s?.user || '', admin: !!c.s?.admin, serverTime: Date.now() }));

R('POST', /^\/register$/, async (c, b) => {
  const u = String(b.username || '').trim().toLowerCase(), p = String(b.password || '');
  if (!/^[a-z0-9_]{3,20}$/.test(u)) bad('Username 3–20 karakter: huruf kecil, angka, _');
  if (p.length < 8 || p.length > 100) bad('Password minimal 8 karakter.');
  if (u === ADMIN_USER() || await getJ('users/' + u)) bad('Username sudah dipakai.', 409);
  await setJ('users/' + u, { pw: hashPw(p), created: Date.now() });
  c.cookie = makeCookie(u, false); return { user: u, admin: false, serverTime: Date.now() };
});
R('POST', /^\/login$/, async (c, b) => {
  const u = String(b.username || '').trim().toLowerCase(), p = String(b.password || '');
  await throttle(c.ip + '|' + u);
  let ok = false, admin = false;
  if (ADMIN_USER() && u === ADMIN_USER()) { ok = !!process.env.ADMIN_PASSWORD && same(p, process.env.ADMIN_PASSWORD); admin = ok; }
  else { const r = await getJ('users/' + u); ok = !!r && checkPw(p, r.pw); }
  await throttle(c.ip + '|' + u, ok);
  if (!ok) bad('Username atau password salah.', 401);
  c.cookie = makeCookie(u, admin); return { user: u, admin, serverTime: Date.now() };
});
R('POST', /^\/logout$/, async (c) => { c.cookie = clearCookie; return { ok: true }; });
R('POST', /^\/reset-password$/, async (c, b) => {
  const u = String(b.username || '').trim().toLowerCase(), code = String(b.code || '').trim().toUpperCase(), r = await getJ('users/' + u);
  await throttle(c.ip + '|reset|' + u);
  if (!r || !r.reset || Date.now() > r.reset.exp || !same(r.reset.code, code)) { await throttle(c.ip + '|reset|' + u, false); bad('Kode reset salah atau sudah kedaluwarsa.'); }
  if (String(b.password || '').length < 8) bad('Password baru minimal 8 karakter.');
  r.pw = hashPw(String(b.password)); delete r.reset; await setJ('users/' + u, r); return { ok: true };
});
R('POST', /^\/promo\/check$/, async (c, b) => {
  const need = c.need(); const [S, o] = await Promise.all([getSettings(), allOrders()]);
  const price = priceOf(S, b.product, Number(b.pkg)); if (!price) bad('Paket tidak valid.');
  const pr = promoCalc(S, o, b.code, need, price); if (pr.err) bad(pr.err); return { code: pr.code || '', discount: pr.discount };
});
R('GET', /^\/orders$/, async (c) => { const u = c.need(); return { serverTime: Date.now(), orders: (await allOrders()).filter(o => o.user === u).sort((a, b) => b.createdAt - a.createdAt) }; });
R('POST', /^\/orders$/, async (c, b) => {
  const user = c.need(), [S, orders] = await Promise.all([getSettings(), allOrders()]);
  if (S.paymentDisabled) bad('Pembayaran sedang dinonaktifkan sementara.', 503);
  if (!BASE_P[b.product]) bad('Produk tidak ditemukan.');
  const ov = S.products[b.product]; if (ov && ov.disabled) bad('Produk sedang tidak tersedia.');
  const pk = Number(b.pkg), base = priceOf(S, b.product, pk); if (!base) bad('Paket tidak valid.');
  if (b.product === 'Mobile Legends') { const mi = ML_FLAT[pk]; if (mi && mi.stock && (mlSold(orders)[pk] || 0) >= mi.stock) bad('Stok paket ini sudah habis.', 409); }
  if (!METHODS.includes(b.method)) bad('Metode pembayaran tidak valid.');
  if (orders.filter(o => o.user === user && o.status === U).length >= 5) bad('Terlalu banyak pesanan yang belum dibayar. Selesaikan atau batalkan dulu.', 429);
  const fd = F[b.product] || {}, player = String(b.player || '').trim().slice(0, 60), wa = String(b.whatsapp || '').replace(/[\s-]/g, '');
  let z = '';
  if (!player) bad((fd.label || 'ID Player') + ' wajib diisi.');
  if (fd.re && !new RegExp(fd.re).test(player)) bad(fd.err || 'Format ID tidak valid.');
  if (fd.zone) { z = String(b.zone || '').trim(); if (!/^\d{3,6}$/.test(z)) bad('Zone ID wajib diisi (3–6 angka).'); }
  if (wa && !/^(\+?62|0)8\d{7,12}$/.test(wa)) bad('Nomor WhatsApp tidak valid.');
  if (fd.needWa && !wa) bad('Nomor WhatsApp wajib diisi untuk produk voucher.');
  if (b.agree !== true) bad('Setujui Syarat & Ketentuan terlebih dahulu.');
  const pr = promoCalc(S, orders, b.promo, user, base); if (pr.err) bad(pr.err);
  const disc = pr.discount || 0, pay = base - disc, open = orders.filter(o => o.status === U || o.status === V).map(o => o.amount);
  let uniq = 0, amt = pay + FEE;
  for (let i = 0; i < 40; i++) { uniq = 10 + crypto.randomInt(90); amt = pay + FEE + uniq; if (!open.includes(amt)) break; }
  const n = Date.now(), o = { id: 'DM' + hex(10), user, product: b.product, item: String(b.item || '').slice(0, 60), player: z ? player + ' (' + z + ')' : player, pid: player, zone: z, pkgIdx: pk, whatsapp: wa, price: pay, listPrice: base, discount: disc, promo: disc ? pr.code : '', fee: FEE, uniqueCode: uniq, amount: amt, method: b.method, status: U, date: new Date(n).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }), createdAt: n, expiresAt: n + PAY };
  await setJ('orders/' + o.id, o); return { serverTime: n, order: o };
});
const myOrder = async (c, id) => { const u = c.need(), o = await getJ('orders/' + id); if (!o || o.user !== u) bad('Pesanan tidak ditemukan.', 404); return o; };
R('POST', /^\/orders\/(DM[A-Z0-9]+)\/(paid|cancel)$/, async (c, b, m) => {
  const o = await myOrder(c, m[1]);
  if (o.status === U && Date.now() > o.expiresAt) { o.status = X; await setJ('orders/' + o.id, o); }
  if (o.status !== U) bad('Status pesanan sudah ' + o.status + '.', 409);
  if (m[2] === 'paid') { o.status = V; o.paidAt = Date.now(); } else o.status = C;   // "paid" HANYA menandai menunggu verifikasi admin
  await setJ('orders/' + o.id, o); return { serverTime: Date.now(), order: o };
});
R('POST', /^\/orders\/(DM[A-Z0-9]+)\/proof$/, async (c, b, m) => {
  const o = await myOrder(c, m[1]);
  if (o.status !== U && o.status !== V) bad('Bukti tidak bisa diunggah untuk status ini.', 409);
  const img = String(b.image || ''); if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(img) || img.length > 400000) bad('Gambar tidak valid (JPEG, maks 300 KB).');
  await setJ('proofs/' + o.id, { image: img }); o.proof = true; await setJ('orders/' + o.id, o); return { serverTime: Date.now(), order: o };
});

/* ---- admin (semua rute di bawah ini ditolak 403 bila bukan sesi admin) ---- */
R('GET', /^\/admin\/orders$/, async () => ({ orders: (await allOrders()).sort((a, b) => b.createdAt - a.createdAt) }), true);
R('GET', /^\/admin\/orders\/(DM[A-Z0-9]+)\/proof$/, async (c, b, m) => { const p = await getJ('proofs/' + m[1]); if (!p) bad('Bukti tidak ada.', 404); c.raw = new Response(Buffer.from(p.image.split(',')[1], 'base64'), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' } }); }, true);
R('POST', /^\/admin\/orders\/(DM[A-Z0-9]+)$/, async (c, b, m) => {
  const o = await getJ('orders/' + m[1]); if (!o) bad('Pesanan tidak ditemukan.', 404);
  if (!STAT.includes(b.status)) bad('Status tidak valid.');
  o.status = b.status; if (b.status === D) o.doneAt = Date.now(); if (b.status === PD) o.paidAt = Date.now(); o.handledBy = c.s.user;
  await setJ('orders/' + o.id, o); return { order: o };
}, true);
R('DELETE', /^\/admin\/orders\/(DM[A-Z0-9]+)$/, async (c, b, m) => { await store().delete('orders/' + m[1]); await store().delete('proofs/' + m[1]); return { ok: true }; }, true);
R('DELETE', /^\/admin\/orders$/, async () => { for (const k of [...await listKeys('orders/'), ...await listKeys('proofs/')]) await store().delete(k); return { ok: true }; }, true);
R('GET', /^\/admin\/users$/, async () => {
  const [keys, orders] = [await listKeys('users/'), await allOrders()], users = (await Promise.all(keys.map(getJ))).map((r, i) => ({ username: keys[i].slice(6), role: 'user', created: r.created, orders: 0 }));
  users.forEach(x => x.orders = orders.filter(o => o.user === x.username).length);
  return { users: [{ username: ADMIN_USER(), role: 'admin', created: 0, orders: orders.filter(o => o.user === ADMIN_USER()).length }, ...users] };
}, true);
R('POST', /^\/admin\/users\/([a-z0-9_]{3,20})\/reset$/, async (c, b, m) => {
  const r = await getJ('users/' + m[1]); if (!r) bad('Akun tidak ditemukan.', 404);
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code = ''; for (let i = 0; i < 8; i++) code += a[crypto.randomInt(a.length)];
  r.reset = { code, exp: Date.now() + 30 * 60000 }; await setJ('users/' + m[1], r); return { code, minutes: 30 };
}, true);
R('POST', /^\/admin\/password$/, async () => bad('Password admin diatur lewat variabel lingkungan ADMIN_PASSWORD di Netlify (Site configuration → Environment variables).'), true);
R('GET', /^\/admin\/settings$/, async () => { const [S, o] = await Promise.all([getSettings(), allOrders()]); return adminSettings(S, o); }, true);
R('PUT', /^\/admin\/settings$/, async (c, b) => {
  const S = await getSettings();
  if ('paymentDisabled' in b) S.paymentDisabled = !!b.paymentDisabled;
  Object.keys(b.products || {}).forEach(n => { if (!BASE_P[n]) return; const v = b.products[n] || {}; if (n === 'Mobile Legends') { S.products[n] = { disabled: !!v.disabled }; return; } if (!validPrices(v.prices)) return; S.products[n] = { prices: v.prices, disabled: !!v.disabled }; });
  (b.reset || []).forEach(n => { delete S.products[n]; });
  Object.keys(b.skus || {}).forEach(n => { if (BASE_P[n] && Array.isArray(b.skus[n])) S.skus[n] = b.skus[n].map(x => String(x).trim().slice(0, 40)); });
  await setJ('settings', S); return adminSettings(S, await allOrders());
}, true);
R('GET', /^\/admin\/promos$/, async () => { const [S, o] = await Promise.all([getSettings(), allOrders()]); return { promos: Object.keys(S.promos).map(k => Object.assign({ code: k, used: o.filter(x => x.promo === k && x.status !== X && x.status !== C).length }, S.promos[k])) }; }, true);
R('PUT', /^\/admin\/promos$/, async (c, b) => {
  const code = String(b.code || '').trim().toUpperCase(), n = v => Math.max(0, Math.round(Number(v) || 0));
  if (!/^[A-Z0-9]{3,20}$/.test(code)) bad('Kode 3–20 karakter: huruf besar/angka.');
  const t = b.type === 'flat' ? 'flat' : 'percent', v = n(b.value);
  if (t === 'percent' && (v < 1 || v > 90)) bad('Persen diskon 1–90.');
  if (t === 'flat' && v < 500) bad('Diskon nominal minimal Rp500.');
  const S = await getSettings(); S.promos[code] = { type: t, value: v, maxDiscount: n(b.maxDiscount), minPrice: n(b.minPrice), maxUses: n(b.maxUses), expires: b.expires ? Number(b.expires) || 0 : 0, active: b.active !== false };
  await setJ('settings', S); return { ok: true };
}, true);
R('DELETE', /^\/admin\/promos\/([A-Z0-9]{3,20})$/, async (c, b, m) => { const S = await getSettings(); delete S.promos[m[1]]; await setJ('settings', S); return { ok: true }; }, true);

/* ---------- pintu masuk ---------- */
const J = (body, status = 200, h = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...h } });
export default async (req) => {
  try {
    if (!SECRET() || SECRET().length < 24) return J({ error: 'Server belum dikonfigurasi (SESSION_SECRET).' }, 500);
    const url = new URL(req.url), path = url.pathname.replace(/^\/api/, '') || '/', method = req.method.toUpperCase();
    // anti-CSRF: permintaan yang mengubah data harus dari origin yang sama
    if (method !== 'GET') { const og = req.headers.get('origin'); if (og && new URL(og).host !== url.host) return J({ error: 'Permintaan ditolak.' }, 403); }
    for (const r of routes) {
      const m = r.m === method && r.re.exec(path); if (!m) continue;
      const s = session(req), c = { s, ip: (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim(), cookie: '', raw: null, need() { if (!s) bad('Silakan masuk terlebih dahulu.', 401); return s.user; } };
      if (r.admin && !(s && s.admin)) return J({ error: 'Khusus admin.' }, s ? 403 : 401);
      let b = {}; if (method !== 'GET' && method !== 'DELETE') { try { b = await req.json(); } catch { b = {}; } if (!b || typeof b !== 'object') b = {}; }
      const out = await r.fn(c, b, m);
      if (c.raw) return c.raw;
      return J(out ?? {}, 200, c.cookie ? { 'Set-Cookie': c.cookie } : {});
    }
    return J({ error: 'Tidak ditemukan.' }, 404);
  } catch (e) {
    if (e instanceof HttpErr) return J({ error: e.message }, e.status);
    console.error(e); return J({ error: 'Terjadi kesalahan di server.' }, 500);
  }
};
