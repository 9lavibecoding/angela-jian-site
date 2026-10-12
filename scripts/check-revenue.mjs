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

// ── 5. 電子報 API ──────────────────────────────────────────────
// default export 只實跑不碰資料庫的分支（405、honeypot、格式錯誤）。
// 會碰資料庫的流程（限流、搶位、Kit 同步、LINE 節流）改用 createHandler 注入記憶體內的假 Supabase
// 與計數用的假 callKit／notifyLine 實跑，斷言的是真正的 handler 邏輯，不是複製品。
section('5. 電子報 API（api/subscribe.ts）');
{
  const mod = await import('../api/subscribe.ts');
  // 併發請求共用同一組靜音狀態：以計數器決定何時還原，避免交錯的 save/restore 把 console 永久吞掉
  const realError = console.error;
  let quietDepth = 0;
  const quiet = (fn) => async (...a) => {
    if (quietDepth++ === 0) { console.log = () => {}; console.error = () => {}; }
    try { return await fn(...a); } finally { if (--quietDepth === 0) { console.log = realLog; console.error = realError; } }
  };
  const runWith = async (handler, req) => { const { res, out } = mockRes(); await quiet(handler)({ headers: {}, ...req }, res); return out; };

  const subscribe = mod.default;
  const get = await runWith(subscribe, { method: 'GET', body: {} });
  assert(get.status === 405, '非 POST 回 405', `實際 ${get.status}`);

  // honeypot 分支必須在建立 Supabase client 之前就返回；這裡刻意用不合法的 email，
  // 若 honeypot 沒先擋，會走到格式檢查回 400
  const bot = await runWith(subscribe, { method: 'POST', body: { email: 'not-an-email', website: 'http://spam.example', source: 'article-end' } });
  assert(bot.status === 200 && bot.body?.ok === true, 'honeypot 有值時直接回 ok、不處理', `實際 ${bot.status} ${JSON.stringify(bot.body)}`);

  for (const bad of ['', 'abc', 'a@b', 'a b@example.com', `${'x'.repeat(250)}@example.com`]) {
    const r = await runWith(subscribe, { method: 'POST', body: { email: bad, website: '', source: 'article-end' } });
    assert(r.status === 400 && r.body?.ok === false, `格式錯誤回 400（${bad.length > 20 ? `${bad.length} 字元` : JSON.stringify(bad)}）`, `實際 ${r.status}`);
  }

  assert(mod.normalizeEmail('  Foo@Example.COM ') === 'foo@example.com', 'normalizeEmail 會 trim + lowercase');
  assert(mod.resolveSource('article-end') === 'article-end' && mod.resolveSource('evil') === 'unknown' && mod.resolveSource(undefined) === 'unknown', 'resolveSource 白名單外一律 unknown');

  const base = { vercelEnv: 'production', hasKitCredentials: true, claimed: true };
  assert(mod.shouldSyncKit(base) === true, 'production + 有 key + 搶到同步位 → 同步 Kit');
  assert(mod.shouldSyncKit({ ...base, claimed: false }) === false, '沒搶到同步位不同步', '這條失守＝灌同一個 email 會一直重寄確認信');
  assert(mod.shouldSyncKit({ ...base, vercelEnv: 'preview' }) === false, 'preview 即使有 key 也不同步', '這條失守＝preview 測試會寄確認信給真人');
  assert(mod.shouldSyncKit({ ...base, vercelEnv: undefined }) === false, '本機（無 VERCEL_ENV）不同步');
  assert(mod.shouldSyncKit({ ...base, hasKitCredentials: false }) === false, 'production 缺 key 不同步');

  // ── 記憶體內的假 Supabase：只支援 subscribe.ts 用到的查詢鏈 ──
  // 每個查詢在 await 時先讓出一次事件迴圈再執行，模擬網路往返，讓 Promise.all 的請求真的交錯；
  // 單一查詢本身是原子的，對應 Postgres 單一 UPDATE／INSERT 的語意。
  function fakeSupabase() {
    const rows = [];
    let nextId = 1;
    const SOURCES = ['article-end', 'articles-list', 'newsletter-page', 'unknown'];
    const client = {
      rows,
      from(table) {
        if (table !== 'newsletter_subscribers') throw new Error(`未預期的資料表 ${table}`);
        const q = { op: 'select', filters: [], head: false, wantRows: false };
        const b = {
          select(_cols, opts = {}) { if (q.op === 'select') { q.head = !!opts.head; } else { q.wantRows = true; } return b; },
          upsert(row, opts) { q.op = 'upsert'; q.row = row; q.opts = opts; return b; },
          update(patch) { q.op = 'update'; q.patch = patch; return b; },
          eq(c, v) { q.filters.push((r) => r[c] === v); return b; },
          neq(c, v) { q.filters.push((r) => r[c] !== v); return b; },
          gt(c, v) { q.filters.push((r) => r[c] != null && r[c] > v); return b; },
          is(c, v) { q.filters.push((r) => (v === null ? r[c] == null : r[c] === v)); return b; },
          not(c, op, v) { if (op !== 'is' || v !== null) throw new Error('fake 只支援 not is null'); q.filters.push((r) => r[c] != null); return b; },
          then(resolve, reject) {
            return new Promise((r) => setTimeout(r, 0)).then(() => {
              const match = rows.filter((r) => q.filters.every((f) => f(r)));
              if (q.op === 'select') return { data: q.head ? null : match, count: match.length, error: null };
              if (q.op === 'upsert') {
                const { email, source, env } = q.row;
                if (!SOURCES.includes(source) || !['prod', 'preview'].includes(env)) return { data: null, error: { message: 'check constraint' } };
                if (rows.some((r) => r.email === email)) {
                  if (q.opts?.ignoreDuplicates) return { data: [], error: null };
                  return { data: null, error: { message: 'duplicate' } };
                }
                const row = { id: nextId++, email, source, env, kit_sync_attempted_at: null, kit_synced_at: null, created_at: new Date().toISOString() };
                rows.push(row);
                return { data: [{ id: row.id }], error: null };
              }
              if (q.op === 'update') {
                match.forEach((r) => Object.assign(r, q.patch));
                return { data: q.wantRows ? match.map((r) => ({ id: r.id })) : null, error: null };
              }
            }).then(resolve, reject);
          },
        };
        return b;
      },
    };
    return client;
  }

  const KEYS = { KIT_API_KEY: 'test-key', KIT_FORM_ID: '123' };
  function harness({ vercelEnv = 'production', keys = KEYS, kitFails = false } = {}) {
    const sb = fakeSupabase();
    const calls = { kit: 0, line: 0 };
    const handler = mod.createHandler({
      getSupabase: () => sb,
      callKit: async () => { calls.kit++; await new Promise((r) => setTimeout(r, 5)); if (kitFails) throw new Error('Kit HTTP 500'); },
      notifyLine: async () => { calls.line++; },
      getEnv: () => ({ VERCEL_ENV: vercelEnv, ...keys }),
    });
    const post = (body) => runWith(handler, { method: 'POST', body });
    return { sb, calls, post };
  }

  // a. 同一新 email 同時送 5 次 → Kit 只呼叫 1 次，回應全部相同
  {
    const h = harness();
    const outs = await Promise.all(Array.from({ length: 5 }, () => h.post({ email: 'race@example.com', website: '', source: 'article-end' })));
    const same = outs.every((o) => o.status === 200 && JSON.stringify(o.body) === JSON.stringify(outs[0].body));
    assert(h.calls.kit === 1, 'a. 同一 email 併發 5 次，Kit 只被呼叫 1 次', `實際 ${h.calls.kit} 次；失守＝同一人收到多封確認信`);
    assert(same, 'a. 5 個回應都是 200 且內容相同', outs.map((o) => `${o.status}:${JSON.stringify(o.body)}`).join(' '));
    assert(h.sb.rows.length === 1 && !!h.sb.rows[0].kit_synced_at, 'a. 只有 1 列且已標記 kit_synced_at', `rows=${h.sb.rows.length}`);
  }

  // b. Kit 失敗後同一 email 再送 → 不再呼叫 Kit
  {
    const h = harness({ kitFails: true });
    await h.post({ email: 'retry@example.com', website: '', source: 'article-end' });
    const again = await h.post({ email: 'retry@example.com', website: '', source: 'article-end' });
    assert(h.calls.kit === 1 && again.status === 200, 'b. Kit 失敗後同一 email 重送，不再呼叫 Kit', `Kit 共 ${h.calls.kit} 次、重送回 ${again.status}`);
    const r = h.sb.rows[0];
    assert(!!r?.kit_sync_attempted_at && r.kit_synced_at == null, 'b. 失敗列保留 attempted、synced 為 null（可手動補）');
  }

  // c. preview 有 key → 不呼叫 Kit，但資料有寫入且 env=preview
  {
    const h = harness({ vercelEnv: 'preview' });
    const out = await h.post({ email: 'preview@example.com', website: '', source: 'newsletter-page' });
    assert(out.status === 200 && h.calls.kit === 0, 'c. preview 有 key 也不呼叫 Kit', `status ${out.status}、Kit ${h.calls.kit} 次`);
    assert(h.sb.rows.length === 1 && h.sb.rows[0].env === 'preview' && h.sb.rows[0].kit_sync_attempted_at == null, 'c. preview 仍寫入名單且 env=preview');
  }
  {
    const h = harness({ keys: {} });
    await h.post({ email: 'nokey@example.com', website: '', source: 'article-end' });
    assert(h.calls.kit === 0 && h.sb.rows.length === 1, 'c2. production 缺 key 只寫名單不呼叫 Kit');
  }

  // d. 10 分鐘內已有 30 列 → 429，不寫入、不呼叫 Kit
  {
    const h = harness();
    const t = new Date().toISOString();
    for (let i = 0; i < mod.RATE_LIMIT_MAX; i++) h.sb.rows.push({ id: 1000 + i, email: `flood${i}@example.com`, source: 'unknown', env: 'prod', kit_sync_attempted_at: null, kit_synced_at: null, created_at: t });
    const out = await h.post({ email: 'late@example.com', website: '', source: 'article-end' });
    assert(out.status === 429 && out.body?.message === '目前訂閱的人比較多，請稍後再試。', `d. 10 分鐘內已有 ${mod.RATE_LIMIT_MAX} 列時回 429`, `實際 ${out.status} ${JSON.stringify(out.body)}`);
    assert(h.sb.rows.length === mod.RATE_LIMIT_MAX && h.calls.kit === 0, 'd. 限流時不寫入、不呼叫 Kit', `rows=${h.sb.rows.length}、Kit ${h.calls.kit} 次`);
  }
  {
    const h = harness();
    const t = new Date().toISOString();
    for (let i = 0; i < mod.RATE_LIMIT_MAX; i++) h.sb.rows.push({ id: 1000 + i, email: `pv${i}@example.com`, source: 'unknown', env: 'preview', kit_sync_attempted_at: null, kit_synced_at: null, created_at: t });
    const out = await h.post({ email: 'prod@example.com', website: '', source: 'article-end' });
    assert(out.status === 200, 'd2. 限流只算當前 env（preview 的列不擋 prod）', `實際 ${out.status}`);
  }

  // e. body 為 null、陣列、字串、數字 → 400，不丟例外
  for (const [label, body] of [['null', null], ['陣列', [1, 2]], ['字串', 'hello'], ['JSON 字串 null', 'null'], ['數字', 42]]) {
    const h = harness();
    let out, thrown = null;
    try { out = await h.post(body); } catch (e) { thrown = e; }
    assert(!thrown && out?.status === 400, `e. body 為${label}時回 400`, thrown ? `丟出例外：${thrown.message}` : `實際 ${out?.status}`);
  }

  // f. 兩個不同 email 連續 Kit 失敗 → LINE 只推 1 次
  {
    const h = harness({ kitFails: true });
    await h.post({ email: 'fail1@example.com', website: '', source: 'article-end' });
    await h.post({ email: 'fail2@example.com', website: '', source: 'article-end' });
    assert(h.calls.kit === 2 && h.calls.line === 1, 'f. 10 分鐘內連續兩次 Kit 失敗，LINE 只通知 1 次', `Kit ${h.calls.kit} 次、LINE ${h.calls.line} 次；失守＝連續失敗洗版`);
  }
}

// ── 6. Supabase 存活 ───────────────────────────────────────────
section('6. Supabase 存活（免費方案會自動暫停）');
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
