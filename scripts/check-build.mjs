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

// ── 付費內容不得內嵌於公開 HTML ────────────────────────────────
// 2026-09-04：exam/print 原本在 build 時把 1000 題連答案一起寫進 HTML，
// 前端只用 display:none 遮住，未登入 curl 一次就能全部拿走。
// 這裡用「真實題目文字」比對，比檢查 markup 更強：不管換成什麼標籤都躲不掉。
section('付費內容外洩');
{
  const sample = [];
  const examDir = 'src/data/exam';
  for (const f of fs.readdirSync(examDir).filter((x) => x.endsWith('.json')).slice(0, 3)) {
    const arr = JSON.parse(fs.readFileSync(path.join(examDir, f), 'utf8'));
    if (arr.length) sample.push(arr[Math.floor(arr.length / 2)]);
  }
  assert(sample.length > 0, '取得抽樣題目供比對', `${sample.length} 題`);

  for (const [name, rel] of [['PDF 列印頁', 'exam/print/index.html'], ['題庫練習頁', 'exam/app/index.html']]) {
    const f = path.join(DIST, rel);
    if (!fs.existsSync(f)) { fail(`${name}存在`, rel); continue; }
    const html = fs.readFileSync(f, 'utf8');
    const size = Buffer.byteLength(html);

    const leaked = sample.filter((q) => html.includes(String(q.question).slice(0, 24)));
    assert(leaked.length === 0, `${name}未內嵌題目文字`,
      leaked.length ? `第 ${leaked.map((q) => q.id).join(', ')} 題的題目出現在公開 HTML 裡` : '');

    const leakedAns = sample.filter((q) => q.explanation && html.includes(String(q.explanation).slice(0, 24)));
    assert(leakedAns.length === 0, `${name}未內嵌答案解析`,
      leakedAns.length ? `第 ${leakedAns.map((q) => q.id).join(', ')} 題的解析出現在公開 HTML 裡` : '');

    assert(size < 200000, `${name}體積正常（< 200 KB）`, `${(size / 1000).toFixed(0)} KB${size >= 200000 ? '，過大通常代表題庫被打包進去了' : ''}`);
  }
}

for (const [name, rel] of [['題庫練習頁', 'exam/app/index.html'], ['PDF 列印頁', 'exam/print/index.html']]) {
  const f = path.join(DIST, rel);
  if (!fs.existsSync(f)) { fail(`${name}存在`, rel); continue; }
  const html = fs.readFileSync(f, 'utf8');
  assert(/noindex/.test(html), `${name}有 noindex`, '付費內容被搜尋引擎收錄等於免費送出去');
  pass(`${name}存在`, `${(Buffer.byteLength(html) / 1000).toFixed(0)} KB`);
}

// ── 電子報訂閱入口 ─────────────────────────────────────────────
// 表單根元素帶 data-newsletter-form（src/components/NewsletterSignup.astro）。
// 前端只能打自家 /api/subscribe，Kit API key 在伺服器端，dist 裡不得出現 api.kit.com。
const { NEWSLETTER_ENABLED } = await import('../src/lib/newsletter.ts');
section(NEWSLETTER_ENABLED ? '電子報訂閱入口' : '電子報關閉');
if (!NEWSLETTER_ENABLED) {
  const MARK = 'data-newsletter-form';
  const walk0 = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk0(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  const hits = walk0(DIST).filter((f) => /\.html$/.test(f) && fs.readFileSync(f, 'utf8').includes(MARK));
  assert(hits.length === 0, '電子報關閉：dist 內沒有任何訂閱表單', hits.slice(0, 5).map((f) => path.relative(DIST, f)).join(', '));
  assert(!fs.existsSync(path.join(DIST, 'newsletter')), '電子報關閉：不產出 /newsletter 頁', 'dist/newsletter');
  const sm = fs.readdirSync(DIST).filter((f) => /^sitemap.*\.xml$/.test(f))
    .map((f) => fs.readFileSync(path.join(DIST, f), 'utf8')).join('');
  assert(!/newsletter/i.test(sm), '電子報關閉：sitemap 未收錄 /newsletter', '');
} else {
  const MARK = 'data-newsletter-form';
  const artBase = path.join(DIST, 'articles');
  if (fs.existsSync(artBase)) {
    const artPages = fs.readdirSync(artBase, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(artBase, e.name, 'index.html'))
      .filter((f) => fs.existsSync(f));
    const missing = artPages.filter((f) => !fs.readFileSync(f, 'utf8').includes(MARK));
    assert(artPages.length > 0 && missing.length === 0, `文章內頁都有訂閱表單（${artPages.length} 頁）`,
      missing.map((f) => path.basename(path.dirname(f))).slice(0, 5).join(', '));
  } else {
    fail('文章內頁都有訂閱表單', 'dist/articles/ 不存在');
  }

  for (const [name, rel] of [['文章列表頁', 'articles/index.html'], ['電子報頁', 'newsletter/index.html']]) {
    const f = path.join(DIST, rel);
    if (!fs.existsSync(f)) { fail(`${name}存在`, rel); continue; }
    assert(fs.readFileSync(f, 'utf8').includes(MARK), `${name}有訂閱表單`, rel);
  }

  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  const assets = walk(DIST).filter((f) => /\.(html|m?js)$/.test(f));
  const direct = assets.filter((f) => fs.readFileSync(f, 'utf8').includes('api.kit.com'));
  assert(direct.length === 0, `前端未直連 Kit（掃 ${assets.length} 個 html/js）`, direct.slice(0, 5).join(', '));
}

// ── GA4 埋點 ─────────────────────────────────────────────────
// 每頁都要載入 GA 且定義 window.aipmTrack（src/lib/ga.ts）。沒用 Base.astro 的頁面（如 exam/print）
// 最容易漏掉；少了 aipmTrack，頁面上的 aipmTrack(...) 呼叫會靜默失效，購買漏斗就斷了。
section('GA4 埋點');
{
  const { GA_ID, GA_INLINE } = await import('../src/lib/ga.ts');
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  const htmls = walk(DIST).filter((f) => f.endsWith('.html'));
  const missing = htmls.filter((f) => {
    const html = fs.readFileSync(f, 'utf8');
    return !html.includes(GA_ID) || !html.includes('window.aipmTrack=');
  });
  assert(htmls.length > 0 && missing.length === 0, `每個 html 都載入 GA 並定義 aipmTrack（${htmls.length} 頁）`,
    missing.map((f) => path.relative(DIST, f)).slice(0, 5).join(', ') + (missing.length > 5 ? ` …共 ${missing.length} 頁` : ''));

  // api/ecpay-return.ts 是 Vercel function，內含一份相同的 GA 字串（付款成功頁的 purchase 靠它）
  assert(fs.readFileSync('api/ecpay-return.ts', 'utf8').includes(JSON.stringify(GA_INLINE)),
    'api/ecpay-return.ts 的 GA 字串與 src/lib/ga.ts 一致', '改了其中一份要同步另一份');
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
