#!/usr/bin/env node
// L1：build 產物檢查。跑在 `npm run build` 之後、部署之前。
// 主要擋 2026-09-02 那種災情：build exit 0、Vercel 顯示 Ready，線上卻是一排有標題沒內文的空白頁。
// 在 dist 上檢查而不是部署後 curl —— 空白頁要在上線前就擋下來，不是上線後才發現。
import fs from 'node:fs';
import path from 'node:path';
import { section, pass, fail, warn, assert, finish } from './lib/check.mjs';

const DIST = 'dist';
// 門檻取自 2026-09-03 實測的健康值下緣：ipas 最小 25.6 KB、articles 最小 19.2 KB。
// 空白頁會少掉 7 KB 以上的內文，因此下列門檻足以分辨，又不會被正常的短文誤殺。
const LIMITS = { ipas: 22000, articles: 16000 };
const MIN_PARAGRAPHS = 5;

if (!fs.existsSync(DIST)) {
  fail('dist/ 不存在', '先跑 npm run build');
  finish('L1 — build 產物檢查');
}

section('0. 產物新鮮度');
const distAge = (Date.now() - fs.statSync(DIST).mtimeMs) / 3600000;
if (distAge > 2) warn('dist 不是剛剛建的', `距今 ${distAge.toFixed(1)} 小時 — 確認你檢查的是最新的 build`);
else pass('dist 是新鮮的', `${(distAge * 60).toFixed(0)} 分鐘前`);

// ── 內容頁：空白頁掃描 ─────────────────────────────────────────
for (const [dir, limit] of Object.entries(LIMITS)) {
  section(`內容頁 — ${dir}/（門檻 ${(limit / 1000).toFixed(0)} KB）`);
  const base = path.join(DIST, dir);
  if (!fs.existsSync(base)) { fail(`${dir}/ 不存在`); continue; }

  const pages = fs.readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ slug: e.name, file: path.join(base, e.name, 'index.html') }))
    .filter((p) => fs.existsSync(p.file))
    .map((p) => {
      const html = fs.readFileSync(p.file, 'utf8');
      return { ...p, size: Buffer.byteLength(html), paras: (html.match(/<\/p>/g) || []).length };
    });

  assert(pages.length > 0, `${dir}/ 有產生頁面`, `${pages.length} 頁`);

  const thin = pages.filter((p) => p.size < limit);
  assert(thin.length === 0, `${dir}/ 沒有內文疑似遺失的頁面`,
    thin.map((p) => `${p.slug} (${(p.size / 1000).toFixed(1)}KB)`).join(', '));

  const noProse = pages.filter((p) => p.paras < MIN_PARAGRAPHS);
  assert(noProse.length === 0, `${dir}/ 每頁至少 ${MIN_PARAGRAPHS} 個段落`,
    noProse.map((p) => `${p.slug} (${p.paras}段)`).join(', '));

  const smallest = [...pages].sort((a, b) => a.size - b.size).slice(0, 3);
  pass(`${dir}/ 共 ${pages.length} 頁`, `最小三頁：${smallest.map((p) => `${p.slug} ${(p.size / 1000).toFixed(1)}KB`).join(' / ')}`);
}

// ── 營收頁 ────────────────────────────────────────────────────
section('營收頁（dist/exam/）');
const examFile = path.join(DIST, 'exam/index.html');
if (!fs.existsSync(examFile)) {
  fail('dist/exam/index.html 存在', '購買頁沒建出來＝完全賣不了');
} else {
  const html = fs.readFileSync(examFile, 'utf8');
  pass('購買頁存在', `${(Buffer.byteLength(html) / 1000).toFixed(1)} KB`);

  // 價格以原始碼為準（api/create-order.ts 才是真正跟客人收的金額）
  const price = fs.readFileSync('api/create-order.ts', 'utf8').match(/TotalAmount:[^\n]*?'(\d+)'/)?.[1];
  assert(!!price && html.includes(`NT$${price}`), '購買頁顯示的價格與實際結帳金額一致', `結帳金額 NT$${price}`);

  // 頁面上有多個 JSON-LD 區塊（Person / WebSite / Organization / Product / FAQPage / BreadcrumbList），
  // 價格只在 Product 那塊，所以要全部掃過再挑，不能只取第一個。
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const parsed = [];
  const broken = [];
  blocks.forEach((b, i) => { try { parsed.push(JSON.parse(b)); } catch { broken.push(i); } });
  assert(broken.length === 0, `購買頁 ${blocks.length} 個 JSON-LD 區塊都能解析`, broken.length ? `第 ${broken.join(', ')} 塊壞掉` : '');

  const product = parsed.find((o) => o['@type'] === 'Product');
  assert(!!product, '購買頁有 Product 結構化資料', product ? '' : 'Google 就不會顯示價格與商品資訊');
  if (product) {
    const ldPrice = String(product.offers?.price ?? product.price ?? '');
    assert(ldPrice === price, 'JSON-LD 的價格與結帳金額一致', `JSON-LD=${ldPrice || '(無)'} / 結帳=${price}`);
    assert(product.offers?.priceCurrency === 'TWD', 'JSON-LD 幣別為 TWD', `實際 ${product.offers?.priceCurrency}`);
  }

  assert(/立即購買|前往購買|開始購買/.test(html), '購買頁有購買 CTA');
}

for (const [name, rel] of [['題庫練習頁', 'exam/app/index.html'], ['PDF 列印頁', 'exam/print/index.html']]) {
  const f = path.join(DIST, rel);
  if (!fs.existsSync(f)) { fail(`${name}存在`, rel); continue; }
  const html = fs.readFileSync(f, 'utf8');
  assert(/noindex/.test(html), `${name}有 noindex`, '付費內容被搜尋引擎收錄等於免費送出去');
  pass(`${name}存在`, `${(Buffer.byteLength(html) / 1000).toFixed(0)} KB`);
}

// 付費頁不可出現在 sitemap
section('sitemap');
const smFiles = fs.readdirSync(DIST).filter((f) => /^sitemap.*\.xml$/.test(f));
if (!smFiles.length) warn('找不到 sitemap', '');
else {
  const xml = smFiles.map((f) => fs.readFileSync(path.join(DIST, f), 'utf8')).join('');
  assert(!xml.includes('/exam/app'), 'sitemap 未收錄題庫練習頁');
  assert(!xml.includes('/exam/print'), 'sitemap 未收錄 PDF 列印頁');
  assert(xml.includes('/exam/'), 'sitemap 有收錄題庫銷售頁');
}

finish('L1 — build 產物檢查');
