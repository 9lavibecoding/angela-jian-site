/**
 * LINE Rich Menu 設定腳本
 *
 * 用法：node scripts/setup-line-richmenu.mjs
 *
 * 需要環境變數：
 * - LINE_CHANNEL_ACCESS_TOKEN
 *
 * 會建立一個 2 欄的 Rich Menu：
 * [📊 營收統計]  [📋 指令說明]
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// 手動讀 .env
const envPath = resolve(import.meta.dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {}

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('❌ 請設定 LINE_CHANNEL_ACCESS_TOKEN 環境變數');
  process.exit(1);
}

const LINE_API = 'https://api.line.me/v2/bot';

async function lineRequest(path, options = {}) {
  const res = await fetch(`${LINE_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...options.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ ${path} failed:`, res.status, text);
    process.exit(1);
  }
  return text ? JSON.parse(text) : {};
}

// Step 1: 刪除現有的 Rich Menu
console.log('🔍 檢查現有 Rich Menu...');
const existing = await lineRequest('/richmenu/list');
if (existing.richmenus?.length > 0) {
  for (const menu of existing.richmenus) {
    console.log(`  刪除: ${menu.richMenuId} (${menu.name})`);
    await lineRequest(`/richmenu/${menu.richMenuId}`, { method: 'DELETE' });
  }
}

// Step 2: 建立 Rich Menu
console.log('📐 建立 Rich Menu...');
const richMenu = await lineRequest('/richmenu', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    size: { width: 2500, height: 843 },
    selected: true,
    name: 'AIPM Admin Menu',
    chatBarText: '📋 管理選單',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 1250, height: 843 },
        action: { type: 'message', label: '營收統計', text: '/sales' },
      },
      {
        bounds: { x: 1250, y: 0, width: 1250, height: 843 },
        action: { type: 'message', label: '指令說明', text: '/help' },
      },
    ],
  }),
});

const richMenuId = richMenu.richMenuId;
console.log(`  ✅ Rich Menu ID: ${richMenuId}`);

// Step 3: 產生並上傳圖片 (2500x843 PNG)
console.log('🎨 產生選單圖片...');

// 用純程式碼產生一張簡單 PNG（不需要 canvas 依賴）
// 用 SVG 轉 PNG 的方式透過 sharp（專案已有安裝）
const { default: sharp } = await import('sharp');

const svgImage = `
<svg width="2500" height="843" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#16213e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f3460;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 左半：營收統計 -->
  <rect x="0" y="0" width="1250" height="843" fill="url(#bg1)"/>
  <line x1="1250" y1="40" x2="1250" y2="803" stroke="#C5A55A" stroke-width="2" stroke-opacity="0.3"/>

  <!-- 左 icon + 文字 -->
  <text x="625" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" fill="#C5A55A">📊</text>
  <text x="625" y="500" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="#FFFFFF">營收統計</text>
  <text x="625" y="580" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#888888">/sales</text>

  <!-- 右半：指令說明 -->
  <rect x="1250" y="0" width="1250" height="843" fill="url(#bg2)"/>

  <!-- 右 icon + 文字 -->
  <text x="1875" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" fill="#C5A55A">📋</text>
  <text x="1875" y="500" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="#FFFFFF">指令說明</text>
  <text x="1875" y="580" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#888888">/help</text>
</svg>`;

const pngBuffer = await sharp(Buffer.from(svgImage)).png().toBuffer();

console.log('📤 上傳選單圖片...');
const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'image/png',
  },
  body: pngBuffer,
});

if (!uploadRes.ok) {
  console.error('❌ 圖片上傳失敗:', uploadRes.status, await uploadRes.text());
  process.exit(1);
}
console.log('  ✅ 圖片上傳成功');

// Step 4: 設為預設 Rich Menu
console.log('🔗 設為預設選單...');
await lineRequest(`/user/all/richmenu/${richMenuId}`, { method: 'POST' });

console.log('\n✅ Rich Menu 設定完成！');
console.log('  打開 LINE 聊天室即可看到底部選單');
