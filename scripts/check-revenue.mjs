#!/usr/bin/env node
// L2：營收路徑實跑檢查。動到 api/、src/pages/exam/ 時跑。
//
// 做法：Node 25 已預設支援直接 import TypeScript，所以這裡把真正的 Vercel handler
// import 進來，餵假的 req/res 實際執行，斷言它的行為 —— 不是讀原始碼猜，也不是測複製品。
//
// 需要 .env 的 ECPAY_* 與 SUPABASE_*。缺哪個就跳過對應項目並警告，不會假裝通過。
import crypto from 'node:crypto';
import fs from 'node:fs';
import { section, pass, fail, warn, assert, finish, loadEnv } from './lib/check.mjs';

loadEnv();
const ORIGIN = 'https://aipm-insider.com';

// 綠界 CheckMacValue：與 api/ecpay-return.ts:4 同式，用來「產生」合法的假回呼。
// handler 會自己重算並比對，所以這裡只是在造測試輸入，不是在測試複製品。
function ecpayMac(params, hashKey, hashIV) {
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  const encoded = encodeURIComponent(raw).toLowerCase()
    .replace(/%2d/g, '-').replace(/%5f/g, '_').replace(/%2e/g, '.')
    .replace(/%21/g, '!').replace(/%2a/g, '*').replace(/%28/g, '(')
    .replace(/%29/g, ')').replace(/%20/g, '+');
  return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}
const expectedToken = (tradeNo, key) =>
  crypto.createHmac('sha256', key).update(tradeNo).digest('hex').substring(0, 32);

// handler 內部有 console.log，會把檢查結果淹掉
const realLog = console.log;
const silence = (fn) => async (...a) => { console.log = () => {}; try { return await fn(...a); } finally { console.log = realLog; } };

function mockRes() {
  const out = { status: null, body: null, headers: {} };
  const res = {
    setHeader(k, v) { out.headers[k] = v; return res; },
    status(c) { out.status = c; return res; },
    send(b) { out.body = b; return res; },
    json(b) { out.body = b; return res; },
    end(b) { out.body = b ?? out.body; return res; },
    redirect(...a) { out.status = 302; out.body = a[a.length - 1]; return res; },
  };
  return { res, out };
}

const REAL_TOKEN = /token=[0-9a-f]{32}/;
// 價格一律從原始碼推導，不在檢查腳本裡寫死第二份 —— 否則改價就會誤報
const EXPECTED_PRICE = fs.readFileSync('api/create-order.ts', 'utf8').match(/TotalAmount:[^\n]*?'(\d+)'/)?.[1];
const HASH_KEY = process.env.ECPAY_HASH_KEY;
const HASH_IV = process.env.ECPAY_HASH_IV;

// ── 1. 綠界導回：token 只能在真的收到錢時發出 ────────────────────
section('1. 綠界導回 — 開通 token 的發放條件（api/ecpay-return.ts）');

if (!HASH_KEY || !HASH_IV) {
  warn('跳過 ecpay-return 實跑', '.env 缺 ECPAY_HASH_KEY / ECPAY_HASH_IV');
} else {
  const ecpayReturn = silence((await import('../api/ecpay-return.ts')).default);

  const runReturn = async (body) => {
    const withMac = { ...body, CheckMacValue: ecpayMac(body, HASH_KEY, HASH_IV) };
    const { res, out } = mockRes();
    await ecpayReturn({ query: { trade_no: body.MerchantTradeNo }, body: withMac, headers: {} }, res);
    return String(out.body || '');
  };

  // (a) ATM 取號成功：綠界配發了虛擬帳號，但客人還沒付錢。發 token 等同免費開通。
  const atmHtml = await runReturn({
    MerchantTradeNo: 'TEST' + Date.now(), RtnCode: '2', RtnMsg: 'Get VirtualAccount Succeeded',
    vAccount: '9990012345678', BankCode: '806', TradeAmt: '199', ExpireDate: '2026/12/31',
  });
  assert(!REAL_TOKEN.test(atmHtml), 'ATM 取號（RtnCode=2）不發開通 token', '這條若失守＝客人沒付錢就拿到題庫');
  assert(atmHtml.includes('9990012345678'), 'ATM 取號頁有顯示虛擬帳號');

  // (b) 超商代碼取號：同上
  const cvsHtml = await runReturn({
    MerchantTradeNo: 'TEST' + Date.now(), RtnCode: '2', RtnMsg: 'Get CVS Code Succeeded',
    PaymentNo: 'LLL22334455', TradeAmt: '199', ExpireDate: '2026/12/31',
  });
  assert(!REAL_TOKEN.test(cvsHtml), '超商取號（RtnCode=2）不發開通 token');

  // (c) 條碼取號：同上
  const barcodeHtml = await runReturn({
    MerchantTradeNo: 'TEST' + Date.now(), RtnCode: '2', RtnMsg: 'Get Barcode Succeeded',
    Barcode1: '2612180A', Barcode2: '1234567890', Barcode3: '099999', TradeAmt: '199',
  });
  assert(!REAL_TOKEN.test(barcodeHtml), '條碼取號（RtnCode=2）不發開通 token');

  // (d) 真的付款成功：必須發 token，否則客人付了錢開不了通
  const paidTradeNo = 'TEST' + Date.now();
  const paidHtml = await runReturn({
    MerchantTradeNo: paidTradeNo, RtnCode: '1', RtnMsg: 'Succeeded', TradeAmt: '199',
    PaymentDate: '2026/09/03 12:00:00', PaymentType: 'Credit_CreditCard',
  });
  const issued = paidHtml.match(/token=([0-9a-f]{32})/)?.[1];
  assert(!!issued, '付款成功（RtnCode=1）有發出開通 token', issued ? '' : '客人付了錢卻拿不到開通連結');
  assert(issued === expectedToken(paidTradeNo, HASH_KEY), '發出的 token 與 HMAC 期望值相符');

  // (e) 偽造回呼：簽章不對就算宣稱付款成功也不能發 token
  const { res: fr, out: fo } = mockRes();
  await ecpayReturn({
    query: { trade_no: 'FORGED123' },
    body: { MerchantTradeNo: 'FORGED123', RtnCode: '1', TradeAmt: '199', CheckMacValue: 'DEADBEEF'.repeat(8) },
    headers: {},
  }, fr);
  assert(!REAL_TOKEN.test(String(fo.body || '')), '簽章錯誤的偽造回呼不發 token', '這條失守＝任何人可自行開通');
}

// ── 2. 建立訂單 ────────────────────────────────────────────────
section('2. 建立訂單（api/create-order.ts）');
if (!HASH_KEY || !process.env.ECPAY_MERCHANT_ID) {
  warn('跳過 create-order 實跑', '.env 缺 ECPAY_MERCHANT_ID / ECPAY_HASH_KEY');
} else {
  const createOrder = silence((await import('../api/create-order.ts')).default);
  const { res, out } = mockRes();
  await createOrder({ method: 'POST', headers: { origin: ORIGIN }, body: { email: 'qa@example.com' } }, res);

  assert(out.status === 200, '題庫訂單建立成功', `HTTP ${out.status} ${JSON.stringify(out.body).slice(0, 120)}`);
  const { params = {}, actionUrl = '' } = out.body || {};
  assert(params.TotalAmount === EXPECTED_PRICE, `送給綠界的金額是 ${EXPECTED_PRICE}`, `實際 ${params.TotalAmount}`);
  assert(!!params.CheckMacValue, '訂單有帶 CheckMacValue');
  assert(params.CheckMacValue === ecpayMac(Object.fromEntries(Object.entries(params).filter(([k]) => k !== 'CheckMacValue')), HASH_KEY, HASH_IV), '訂單簽章可被獨立重算驗證');

  const isTest = process.env.ECPAY_TEST_MODE === 'true';
  assert(
    isTest ? actionUrl.includes('payment-stage.ecpay.com.tw') : actionUrl.includes('payment.ecpay.com.tw'),
    `結帳網址符合 ECPAY_TEST_MODE=${process.env.ECPAY_TEST_MODE}`,
    actionUrl
  );
  if (isTest) assert(!actionUrl.includes('//payment.ecpay'), '測試模式下不會打到正式金流');
}

// ── 3. 權限 API 的未授權防線 ────────────────────────────────────
section('3. 權限 API 未授權時的行為');
for (const [name, path] of [['get-questions', '../api/get-questions.ts'], ['save-purchase', '../api/save-purchase.ts']]) {
  const handler = silence((await import(path)).default);
  const { res, out } = mockRes();
  await handler({ method: 'POST', headers: { origin: ORIGIN }, body: {} }, res);
  assert(out.status === 401, `${name} 無 Bearer token 時回 401`, `實際 ${out.status}`);
}

// ── 4. 權限判定的靜態迴歸守衛 ──────────────────────────────────
// expires_at 為 NULL 代表永久有效。要實跑得有真實 Supabase session，
// 這裡退而求其次守住那行判斷式不被改成 `expires_at < now()`（會擋掉永久權限帳號）。
section('4. 權限判定（靜態守衛，非實跑）');
const gq = fs.readFileSync('api/get-questions.ts', 'utf8');
assert(/if\s*\(\s*purchase\.expires_at\s*&&/.test(gq), 'get-questions 仍以 `expires_at &&` 判斷（NULL＝永久有效）', '改掉會讓永久權限帳號被誤擋');
assert(/order\([^)]*created_at[^)]*\)/.test(gq) && /limit\(1\)/.test(gq), 'get-questions 仍取最新一筆 purchases');

// ── 5. Supabase 存活 ───────────────────────────────────────────
section('5. Supabase 存活（免費方案會自動暫停）');
const SB_URL = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SB_URL || !SB_KEY) {
  warn('跳過 Supabase 檢查', '.env 缺 SUPABASE_URL / SUPABASE_SECRET_KEY');
} else {
  for (const table of ['purchases', 'pending_purchases', 'questions']) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/${table}?select=*&limit=1`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      assert(r.ok, `${table} 可查詢`, r.ok ? '' : `HTTP ${r.status} ${(await r.text()).slice(0, 120)}`);
    } catch (e) {
      fail(`${table} 可查詢`, `${e.name}: ${e.message}（DNS 查不到＝專案已被暫停，去 Dashboard 按 Restore）`);
    }
  }
}

finish('L2 — 營收路徑實跑檢查');
