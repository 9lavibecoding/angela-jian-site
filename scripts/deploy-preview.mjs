#!/usr/bin/env node
// 部署 preview 並掃描產物。跑在 preflight 之後、`vercel --prod` 之前。
//
// 為什麼需要這支：preflight 的 check:build 掃的是「本機 dist/」，但 Vercel 上會**重跑一次
// 自己的 build**，各自去打 Notion。本機 build 成功不代表 Vercel 那次也成功 —— 2026-09-02
// 就發生過 build exit 0、Vercel 顯示 Ready、線上卻是 11 篇空白頁。這支是唯一能在上線前
// 檢查到 Vercel 產物的關卡。
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { section, pass, fail, warn, assert, finish } from './lib/check.mjs';

// 與 check-build.mjs 的 LIMITS / MIN_PARAGRAPHS 保持一致。改其中一邊記得改另一邊。
const LIMITS = { ipas: 22000, articles: 16000 };
const MIN_PARAGRAPHS = 5;
const CONCURRENCY = 6;

section('1. 部署 preview');

// PREVIEW_URL 旁路：跳過部署，直接掃既有的網址。
// 用於「preview 已經部署過、只想重掃一次」，免得為了重掃再花三分鐘重新部署。
let url = process.env.PREVIEW_URL;

if (url) {
  pass('跳過部署，掃描指定網址', `PREVIEW_URL=${url}`);
} else {
  const r = spawnSync('vercel', ['--yes'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;

  if (r.status !== 0) {
    fail('vercel --yes 部署成功', `exit ${r.status} — ${out.trim().split('\n').slice(-3).join(' / ') || r.error?.message}`);
    finish('L2.5 — preview 部署與掃描');
  }

  url = out.match(/https:\/\/[a-z0-9][a-z0-9-]*\.vercel\.app/i)?.[0];
  if (!url) {
    fail('抓得到 preview 網址', `vercel 的輸出裡找不到 *.vercel.app：${out.trim().slice(-300)}`);
    finish('L2.5 — preview 部署與掃描');
  }
  pass('preview 部署成功', url);
}

// ── 掃描 Vercel 產物 ───────────────────────────────────────────
// slug 清單取自本機 dist：preflight 剛建過，內容與這次要上線的一致。
const get = async (path) => {
  const res = await fetch(url + path, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
  return { status: res.status, text: await res.text() };
};

for (const [dir, limit] of Object.entries(LIMITS)) {
  section(`2. ${dir}/ 空白頁掃描（門檻 ${(limit / 1000).toFixed(0)} KB、${MIN_PARAGRAPHS} 段）`);
  const base = `dist/${dir}`;
  if (!fs.existsSync(base)) { warn(`${base} 不存在`, '略過 — 先跑 npm run build'); continue; }

  const slugs = fs.readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  const bad = [];
  const errored = [];

  for (let i = 0; i < slugs.length; i += CONCURRENCY) {
    await Promise.all(slugs.slice(i, i + CONCURRENCY).map(async (slug) => {
      try {
        const { status, text } = await get(`/${dir}/${slug}`);
        const paras = (text.match(/<\/p>/g) || []).length;
        const size = Buffer.byteLength(text);
        if (status !== 200 || paras < MIN_PARAGRAPHS || size < limit) {
          bad.push(`${slug} (HTTP ${status}, ${paras}段, ${(size / 1000).toFixed(1)}KB)`);
        }
      } catch (e) {
        errored.push(`${slug} (${e.name})`);
      }
    }));
  }

  assert(slugs.length > 0, `${dir}/ 有頁面可掃`, `${slugs.length} 頁`);
  assert(errored.length === 0, `${dir}/ 每頁都抓得到`, errored.join(', '));
  assert(bad.length === 0, `${dir}/ 沒有空白頁`, bad.join(', ') || `${slugs.length} 頁全數通過`);
}

section('3. 下一步');
pass('preview 網址', url);
pass('確認無誤後上線', 'npm run deploy:prod');

finish('L2.5 — preview 部署與掃描');
