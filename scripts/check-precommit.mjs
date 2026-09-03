#!/usr/bin/env node
// L0：秒級檢查，每次 commit 前跑。不連網、不 build。
// 擋的是「一眼看不出來但會直接影響營收」的漂移：金流開關、憑證外洩、價格不一致、題庫資料壞掉。
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { section, pass, fail, warn, assert, finish, loadEnv } from './lib/check.mjs';

const read = (p) => fs.readFileSync(p, 'utf8');
const hasEnv = loadEnv();

// ── 1. 金流開關 ────────────────────────────────────────────────
section('1. 金流開關');
if (!hasEnv) {
  warn('.env 不存在', '略過本機測試模式檢查');
} else {
  assert(
    process.env.ECPAY_TEST_MODE === 'true',
    '.env 的 ECPAY_TEST_MODE 為 true',
    `目前是 ${JSON.stringify(process.env.ECPAY_TEST_MODE)}；開發時設成 false 會打到正式金流`
  );
}
// 正式綠界網址必須永遠與測試網址成對出現（代表它在三元判斷裡，不是被寫死的）
for (const f of ['api/create-order.ts', 'api/save-purchase.ts', 'api/verify-order.ts']) {
  const src = read(f);
  const prod = src.includes('payment.ecpay.com.tw') || src.includes('payment.ecpay.com.tw'.replace('payment', 'payment'));
  const stage = src.includes('payment-stage.ecpay.com.tw');
  if (!prod && !stage) { pass(`${f} 未直接寫綠界網址`); continue; }
  assert(prod && stage, `${f} 綠界網址在測試/正式之間切換`, prod && !stage ? '只找到正式網址，可能被寫死' : '');
}

// ── 2. 憑證外洩 ────────────────────────────────────────────────
section('2. 憑證外洩');
const tracked = execSync('git ls-files', { encoding: 'utf8' }).trim().split('\n');
const envFiles = tracked.filter((f) => /(^|\/)\.env($|\.)/.test(f) && !f.endsWith('.example'));
assert(envFiles.length === 0, '沒有 .env 檔被 git 追蹤', envFiles.join(', '));

// 只抓「有值」的賦值，避免誤判文件裡列出的空白變數清單
const SECRET_PATTERNS = [
  ['NOTION_SECRET', /NOTION_SECRET\s*=[ \t]*\S/],
  ['SUPABASE_SECRET_KEY', /SUPABASE_SECRET_KEY\s*=[ \t]*\S/],
  ['ECPAY_HASH_KEY', /ECPAY_HASH_KEY\s*=[ \t]*\S/],
  ['ECPAY_HASH_IV', /ECPAY_HASH_IV\s*=[ \t]*\S/],
  ['CRON_SECRET', /CRON_SECRET\s*=[ \t]*\S/],
  ['LINE_CHANNEL_ACCESS_TOKEN', /LINE_CHANNEL_ACCESS_TOKEN\s*=[ \t]*\S/],
  ['Notion token 字面值', /\b(ntn_|secret_)[A-Za-z0-9]{30,}/],
  ['Supabase secret 字面值', /\bsb_secret_[A-Za-z0-9_-]{20,}/],
];
const scanTargets = tracked.filter((f) => /\.(ts|js|mjs|astro|json|md|ya?ml)$/.test(f) && fs.existsSync(f));
const leaks = [];
for (const f of scanTargets) {
  const src = read(f);
  for (const [label, re] of SECRET_PATTERNS) {
    if (re.test(src)) leaks.push(`${f}: ${label}`);
  }
}
assert(leaks.length === 0, '追蹤中的檔案沒有帶值的憑證', leaks.slice(0, 5).join(' | '));

// ── 3. 價格一致性 ──────────────────────────────────────────────
section('3. 價格一致性');
const orderSrc = read('api/create-order.ts');
const saveSrc = read('api/save-purchase.ts');
const examSrc = read('src/pages/exam/index.astro');

const orderAmount = orderSrc.match(/TotalAmount:[^\n]*?'(\d+)'/)?.[1];
const savedAmount = saveSrc.match(/amount:\s*(\d+)/)?.[1];
const jsonLdPrice = examSrc.match(/"price":\s*"(\d+)"/)?.[1];
const displayed = [...new Set([...examSrc.matchAll(/NT\$([\d,]+)/g)].map((m) => m[1].replace(/,/g, '')))];

assert(!!orderAmount, 'create-order.ts 取得結帳金額', orderAmount ? `NT$${orderAmount}` : '正則沒抓到 TotalAmount，請檢查本腳本');
assert(orderAmount === savedAmount, '結帳金額 == save-purchase 寫入的 amount', `create-order=${orderAmount} / save-purchase=${savedAmount}`);
assert(orderAmount === jsonLdPrice, '結帳金額 == 購買頁 JSON-LD price', `結帳=${orderAmount} / JSON-LD=${jsonLdPrice}`);
assert(displayed.includes(orderAmount), '購買頁有顯示實際結帳金額', `頁面出現的金額：${displayed.map((d) => 'NT$' + d).join(', ')}`);
const strays = displayed.filter((d) => d !== orderAmount);
if (strays.length) warn('購買頁還有其他金額', `${strays.map((d) => 'NT$' + d).join(', ')}（原價／劃線價請確認是刻意的）`);

// ── 4. 題庫資料 ────────────────────────────────────────────────
section('4. 題庫資料（付費內容）');
const EXPECTED_UNIQUE = 1000;   // 對外宣稱的題數
// 2026-09-03 已清乾淨：刪掉空檔 L11-101-200.json 與內容完全重複的 L11-251-300.json。
// 這兩個門檻維持 0，往後任何重複或空檔都會直接擋下 commit。
const KNOWN_DUP_IDS = 0;
const KNOWN_EMPTY_FILES = 0;

const dir = 'src/data/exam';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
const all = [];
const emptyFiles = [];
let parseError = null;
for (const f of files) {
  let arr;
  try { arr = JSON.parse(read(`${dir}/${f}`)); } catch (e) { parseError = `${f}: ${e.message}`; break; }
  if (!Array.isArray(arr)) { parseError = `${f}: 不是陣列`; break; }
  if (arr.length === 0) emptyFiles.push(f);
  all.push(...arr.map((q) => ({ ...q, _file: f })));
}
assert(!parseError, `${files.length} 個題庫檔都能解析成陣列`, parseError || '');

if (!parseError) {
  const counts = new Map();
  for (const q of all) counts.set(q.id, (counts.get(q.id) || 0) + 1);
  const dupIds = [...counts.entries()].filter(([, c]) => c > 1).map(([id]) => id);

  assert(counts.size === EXPECTED_UNIQUE, `去重後題數 == ${EXPECTED_UNIQUE}`, `實際 ${counts.size} 題（載入 ${all.length} 筆）`);

  const badAnswer = all.filter((q) => !Array.isArray(q.options) || q.options.length < 2 || !q.answer || !q.options.some((o) => String(o).trim().startsWith(q.answer)));
  assert(badAnswer.length === 0, '每題的答案都對應到實際選項', badAnswer.slice(0, 5).map((q) => `${q.id}@${q._file}`).join(', '));

  const noExplain = all.filter((q) => !q.explanation || !String(q.explanation).trim());
  assert(noExplain.length === 0, '每題都有解析', noExplain.slice(0, 5).map((q) => `${q.id}@${q._file}`).join(', '));

  const noChapter = all.filter((q) => !['L11', 'L12', 'MIX'].includes(q.chapter));
  assert(noChapter.length === 0, '每題的 chapter 都是 L11/L12/MIX', noChapter.slice(0, 5).map((q) => `${q.id}@${q._file}`).join(', '));

  // 棘輪：現況的問題不擋 commit，但不准變更糟
  assert(dupIds.length <= KNOWN_DUP_IDS,
    KNOWN_DUP_IDS === 0 ? '題庫檔之間沒有重複 id' : `重複 id 沒有增加（現況 ${KNOWN_DUP_IDS} 個）`,
    dupIds.length ? `目前 ${dupIds.length} 個：${dupIds.slice(0, 8).join(', ')}` : '');
  if (dupIds.length) warn('已知重複 id', `${dupIds.length} 個（${Math.min(...dupIds)}～${Math.max(...dupIds)}），下游靠 Set 去重才沒出事`);
  assert(emptyFiles.length <= KNOWN_EMPTY_FILES,
    KNOWN_EMPTY_FILES === 0 ? '沒有空的題庫檔' : `空題庫檔沒有增加（現況 ${KNOWN_EMPTY_FILES} 個）`,
    emptyFiles.join(', '));
  if (emptyFiles.length) warn('空題庫檔', emptyFiles.join(', '));
}

finish('L0 — commit 前檢查');
