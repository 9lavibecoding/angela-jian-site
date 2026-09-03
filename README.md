# AI PM INSIDER

Angela Jian 的個人品牌網站，專為想轉型 AI 產品經理的 PM 與非技術背景工作者打造的學習資源平台。

**網站：** https://aipm-insider.com

以 Astro 靜態產生（SSG），內容來自 Notion 與 Markdown，付費題庫走綠界金流與 Supabase 權限控管。
建置後共 80 個頁面。

---

## 功能總覽

### 內容與教學
- **文章專欄** — 從 Notion 資料庫同步，建置時抓取並下載圖片到本地
- **iPAS 備考攻略** — 50 堂免費課程，涵蓋 AI 基礎到生成式 AI
- **AI 證照指南** — 五大 AI 證照完整比較（iPAS、Microsoft、Google、PMP）
- **作品集** — 4 個 AI 產品實戰案例

### 互動工具
- **AI Prompt 產生器** — 透過 Google Gemini API 即時產生 PM 場景 Prompt
- **iPAS 衝刺題庫** — 1000 題互動練習系統
  - 章節分類篩選（L11 基礎 AI / L12 生成式 AI / MIX 綜合模擬）
  - 答題記錄與統計
  - 3 回計時模擬考（每回 60 分鐘）
  - 每題附詳解
  - PDF 題庫永久下載

### 電商與付款
- 綠界 ECPay 金流整合（信用卡 / ATM / 超商付款）
- 購買後 6 個月線上平台使用權 + PDF 永久下載
- 三條開通路徑：信用卡導回自動開通、以結帳信箱登入自動認領、輸入訂單編號自助開通
- LINE Bot 即時銷售通知與管理指令

---

## 技術架構

| 類別 | 技術 |
|------|------|
| 框架 | Astro 6（SSG） |
| 樣式 | Tailwind CSS 4 |
| 內容管理 | Notion API + Markdown Content Collections |
| 驗證 | Supabase Auth（Google OAuth） |
| 資料庫 | Supabase（PostgreSQL） |
| 金流 | 綠界 ECPay |
| AI 服務 | Google Gemini API |
| 通知 | LINE Bot API |
| 排程 | Vercel Cron（Supabase 每日保活） |
| 動畫 / 圖示 | GSAP、Iconify（皆由 CDN 載入，非 npm 依賴） |
| 部署 | Vercel Serverless Functions |

---

## 開發指令

| 指令 | 說明 | 耗時 |
|------|------|------|
| `npm install` | 安裝依賴 | — |
| `npm run dev` | 本機開發伺服器（localhost:4321） | — |
| `npm run build` | 建置正式版到 `./dist/` | ~4 分鐘 |
| `npm run preview` | 本機預覽建置結果 | — |
| `npm run check` | 提交前檢查：金流開關、憑證外洩、價格一致性、題庫資料 | < 1 秒 |
| `npm run check:revenue` | 營收路徑實跑：綠界導回與建立訂單、Supabase 存活 | ~3 秒 |
| `npm run check:build` | 建置產物檢查：空白頁掃描、購買頁完整性、noindex、sitemap | < 1 秒 |
| `npm run preflight` | **部署前閘門**：上面三項 + 完整 build | ~4 分鐘 |
| `npm run check:live` | 部署後線上煙霧測試 | ~10 秒 |

> `npm run dev` 只跑 Astro 頁面，**不會啟動 `api/` 底下的 Serverless Functions**（那是 Vercel 的慣例目錄）。
> 要在本機驗證 API 行為，用 `npm run check:revenue`：它把真正的 handler import 進來實跑。

---

## 品質閘門

`scripts/` 底下四支檢查腳本，共 71 條斷言，任何一條失敗就以 exit code 1 結束。
不依賴任何測試框架 —— 利用 Node 內建的 TypeScript 型別剝離（本機實測 Node v25），
直接 import `api/*.ts` 的 handler，餵假的 `req`／`res` 實際執行，斷言它真正吐出來的回應。

| 層 | 腳本 | 何時跑 | 斷言數 |
|---|------|--------|--------|
| L0 | `check-precommit.mjs` | 每次 commit 前 | 17 |
| L1 | `check-build.mjs` | `npm run build` 之後 | 22 |
| L2 | `check-revenue.mjs` | 動到 `api/` 或 `src/pages/exam/` 時 | 20 |
| L3 | `check-live.mjs` | `vercel --prod` 之後 | 12 |

重點守備範圍：

- **金流正確性** — 綠界簽章可獨立重算、ATM／超商取號階段不得發出開通憑證、
  偽造回呼一律拒絕、測試模式不會打到正式金流網址
- **價格一致性** — 實際向綠界請款的金額、寫入資料庫的金額、購買頁顯示的價格、
  JSON-LD 結構化資料的價格，四處必須相同
- **付費內容完整性** — 1000 題逐題驗證答案對應到實際選項、有解析、章節合法、無重複 id
- **空白頁偵測** — 以段落數而非檔案大小判斷。實測顯示一頁的內文可能只佔檔案 5%，
  單看大小抓不到「有標題沒內文」的頁面
- **憑證外洩** — 掃描所有 git 追蹤中的檔案，攔截帶值的金鑰與被誤加入的 `.env`

---

## 部署

> **這個專案沒有接 GitHub 自動部署。**
> 程式碼推上 `origin/main` 之後 Vercel 不會有任何動作，正式站不會更新。
> 歷來所有部署都是從本機用 CLI 推的。

```bash
npm run preflight          # 通過才往下走
vercel --prod --yes        # 或到 Vercel Dashboard 點 Redeploy
npm run check:live         # 確認線上真的更新了
```

要確認有沒有真的部署成功，看 `vercel ls` 最上面那筆的 Age 與 Status。

其他部署相關事實：

- Build 指令 `astro build`，輸出目錄 `dist/`，`api/*.ts` 自動部署為 Serverless Functions
- Sitemap 自動產生於 `/sitemap-index.xml`，付費頁（`/exam/app`、`/exam/print`）已排除
- **Vercel 會自己重新 build**，跑的不是本機的 `dist/`。本機建置成功不保證線上成功，
  所以部署後的 `check:live` 是必要的，不是可選的
- 一次 build 會對 Notion 打出數百個請求，容易觸發 `429 rate_limited`。
  `src/lib/notion.ts` 內建三層防護：Promise 快取去重、退避重試、抓不到內容一律讓 build 失敗
  （SSG 的取捨是：build 失敗只代表線上保留舊版，永遠優於部署成功卻上線空白頁）

---

## 專案結構

```
/
├── api/                        # Vercel Serverless Functions
│   ├── create-order.ts         # 建立 ECPay 訂單
│   ├── ecpay-notify.ts         # 付款通知回呼（server-to-server）
│   ├── ecpay-return.ts         # 付款完成導回瀏覽器
│   ├── verify-order.ts         # 訂單驗證
│   ├── save-purchase.ts        # 開通題庫權限
│   ├── claim-purchase.ts       # 以結帳信箱自動認領訂單
│   ├── get-questions.ts        # 題目 API（需驗證）
│   ├── generate-prompt.ts      # Gemini Prompt 產生
│   ├── keepalive.ts            # Supabase 每日保活（由 Cron 觸發）
│   └── line-webhook.ts         # LINE Bot Webhook
│
├── scripts/
│   ├── check-precommit.mjs     # L0 提交前檢查
│   ├── check-build.mjs         # L1 建置產物檢查
│   ├── check-revenue.mjs       # L2 營收路徑實跑
│   ├── check-live.mjs          # L3 線上煙霧測試
│   └── lib/check.mjs           # 檢查腳本共用輸出格式
│
├── src/
│   ├── pages/                  # 頁面路由
│   │   ├── index.astro         # 首頁
│   │   ├── articles/           # 文章列表與內頁（來自 Notion）
│   │   ├── ipas/               # iPAS 課程列表與內頁
│   │   ├── exam/               # 題庫（購買頁 / 練習 App / PDF 列印頁）
│   │   ├── portfolio/          # 作品集（4 個案例）
│   │   ├── consulting/         # 一對一諮詢
│   │   └── ai-certifications.astro
│   │
│   ├── layouts/Base.astro      # 主版面（導覽列、頁尾、GA）
│   ├── content/ipas/           # iPAS 課程 Markdown（51 篇，產出 50 個課程頁）
│   ├── data/exam/              # 1000 題 JSON 題庫（10 個檔案）
│   ├── lib/                    # Notion / Supabase 工具函式
│   └── styles/global.css       # Tailwind + 自訂全域樣式
│
├── vercel.json                 # Vercel Cron 排程（Supabase 保活）
└── public/                     # 靜態資源（圖片、favicon）
```

---

## 環境變數

```env
# Notion
NOTION_SECRET=
NOTION_DATABASE_ID=

# Supabase
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SECRET_KEY=

# ECPay
ECPAY_MERCHANT_ID=
ECPAY_HASH_KEY=
ECPAY_HASH_IV=
ECPAY_TEST_MODE=true          # 開發時必須為 true

# Google Gemini
GEMINI_API_KEY=

# LINE Bot（僅 production）
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
ADMIN_LINE_USER_ID=

# Vercel Cron（僅 production）
CRON_SECRET=
```

標註「僅 production」的變數只存在於 Vercel，本機 `.env` 沒有。
需要時用 `vercel env pull` 拉取，並且務必拉到專案目錄之外 —— `.gitignore` 只擋 `.env`
與 `.env.production`，不擋 `.env.local` 之類的檔名。用完立即刪除。

---

## 相關文件

- [`CLAUDE.md`](CLAUDE.md) — 開發指引，含事故紀錄與已建立的防護機制：
  Notion 限流的兩種壞法、Supabase 免費方案自動暫停、訂單與權限的資料模型、
  付費內容的資料品質規則、文章寫作規範與新增文章 SOP
