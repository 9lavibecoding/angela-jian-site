#!/usr/bin/env node
// L3：線上煙霧測試。跑在 `vercel --prod` 之後。
// 確認「真的部署上去了」而且「客人現在買得到」。不改任何東西，純讀取。
import fs from 'node:fs';
import { section, pass, fail, warn, assert, finish, loadEnv } from './lib/check.mjs';

loadEnv();
const SITE = process.env.CHECK_SITE || 'https://aipm-insider.com';
const get = async (path) => {
  const r = await fetch(SITE + path, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
  return { status: r.status, text: await r.text() };
};

section(`線上站台（${SITE}）`);

// ── 營收路徑優先 ───────────────────────────────────────────────
const price = fs.readFileSync('api/create-order.ts', 'utf8').match(/TotalAmount:[^\n]*?'(\d+)'/)?.[1];
try {
  const { status, text } = await get('/exam/');
  assert(status === 200, '購買頁可以打開', `HTTP ${status}`);
  assert(text.includes(`NT$${price}`), '線上顯示的價格與程式碼一致', `程式碼是 NT$${price}；不一致代表這次沒部署成功`);
  assert(/立即購買|前往購買|開始購買/.test(text), '購買 CTA 還在');
  assert(text.length > 20000, '購買頁內容完整', `${(text.length / 1000).toFixed(1)} KB`);
} catch (e) {
  fail('購買頁可以打開', `${e.name}: ${e.message}`);
}

for (const [name, path] of [['題庫練習頁', '/exam/app'], ['文章列表', '/articles/'], ['iPAS 課程列表', '/ipas/'], ['首頁', '/']]) {
  try {
    const { status } = await get(path);
    assert(status === 200, `${name}回 200`, `HTTP ${status}`);
  } catch (e) {
    fail(`${name}回 200`, `${e.name}: ${e.message}`);
  }
}

// ── 空白頁抽查 ────────────────────────────────────────────────
// 全站掃描太慢，這裡抽最容易出事的幾頁；完整掃描已經在 L1 對 dist 做過了。
section('空白頁抽查（完整掃描在 L1 已對 dist 做過）');
const samples = fs.existsSync('dist/ipas')
  ? fs.readdirSync('dist/ipas', { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).slice(0, 3)
  : [];
if (!samples.length) warn('沒有 dist/ipas 可供抽樣', '略過');
for (const slug of samples) {
  try {
    const { status, text } = await get(`/ipas/${slug}`);
    const paras = (text.match(/<\/p>/g) || []).length;
    assert(status === 200 && paras >= 5, `/ipas/${slug} 有內文`, `HTTP ${status}, ${paras} 段`);
  } catch (e) {
    fail(`/ipas/${slug} 有內文`, `${e.name}: ${e.message}`);
  }
}

// ── Supabase：登入與題庫權限的命脈 ─────────────────────────────
section('Supabase（掛了就沒人能登入、沒人拿得到題庫）');
const SB = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
if (!SB) warn('跳過 Supabase 檢查', '.env 缺 PUBLIC_SUPABASE_URL');
else {
  try {
    const r = await fetch(`${SB}/auth/v1/health`, { signal: AbortSignal.timeout(10000) });
    assert(r.status < 500, 'Supabase 有回應', `HTTP ${r.status}`);
  } catch (e) {
    fail('Supabase 有回應', `${e.message} — DNS 查不到代表免費方案已被自動暫停，去 Dashboard 按 Restore`);
  }
}

finish('L3 — 線上煙霧測試');
