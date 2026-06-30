# CLAUDE.md — angela-jian-site 開發指引

本文件提供 Claude 在協助開發 angela-jian-site 時必須遵守的規則與注意事項。

---

## 專案簡介

Angela Jian 的個人品牌網站，面向想轉型 AI 產品經理的學習者。
- 網址：https://aipm-insider.com
- GitHub：9lavibecoding/angela-jian-site（Vercel 部署）
- 主要功能：iPAS 備考課程（50 堂 + 速查表）、付費題庫（1000 題，NT$699）、AI 工具、作品集、文章專欄
- **現役專案路徑：`~/angela-jian-site`**。`~/Desktop/angela-jian-site` 為舊版，請勿在上面開發。

---

## 技術架構

| 類別 | 技術 |
|------|------|
| 框架 | Astro 6（SSG） |
| 樣式 | Tailwind CSS 4 |
| 內容管理 | Notion API |
| 驗證 / 資料庫 | Supabase（Google OAuth + PostgreSQL） |
| 金流 | 綠界 ECPay |
| AI 服務 | Google Gemini API |
| 通知 | LINE Bot API |
| 部署 | Vercel（Serverless Functions） |

---

## 開發工作流程

### 常用指令
```bash
npm run dev      # 本機開發（localhost:4321）
npm run build    # 建置正式版到 ./dist/
npm run preview  # 預覽建置結果
```

---

## 重要注意事項

### Tailwind CSS 4
- `@layer` 的優先順序受 `@import` 排列影響，自訂樣式可能被 Tailwind 預設樣式覆蓋
- **修改任何樣式後，必須執行 `npm run build` 確認建置結果**，不能只看 `dev` 伺服器

### Astro 環境變數
- `import.meta.env.*` — 只能在 Astro 頁面 / 元件中使用
- `process.env.*` — 只能在 `/api/*.ts`（Vercel Serverless Functions）中使用
- 混用會導致 build 失敗或 undefined

### Notion 圖片
- Notion 圖片 URL 有 TTL，**不可直接存進資料或寫死在程式碼中**
- 必須透過 `src/lib/notion.ts` 的 `downloadImage()` 處理，才能在建置時下載到本地

### ECPay 金流
- 修改 ECPay 相關程式碼前，確認 `.env` 的 `ECPAY_TEST_MODE=true`，避免誤觸正式金流
- `api/create-order.ts`、`api/ecpay-notify.ts`、`api/ecpay-return.ts` 為核心付款流程，修改需謹慎

### Supabase
- Row Level Security（RLS）政策直接影響使用者的購買權限與題庫存取
- 修改資料庫結構或 RLS 規則前，確認不影響已購買用戶

---

## 資料品質規則（付費內容）

> **`src/data/exam/*.json` 為付費題庫，每一題的答案與解析必須正確無誤。**
> 修改題目前必須驗證原始題目的正確答案，不允許出現錯誤答案或錯誤解析。

---

## 文章寫作規範（文章專欄）

撰寫或修改文章專欄內容時：
- **禁用負面警示詞**（雷／坑／踩坑），改用「轉折」「學習經驗」「領悟」等正面用語
- **禁用破折號**（——／—），改用句號、逗號或括號
- 開頭「今天想聊的」三點 takeaway 用**問句／話題框架**，不要直接寫答案結論句

---

## 新增文章 SOP（B 方案：用戶託付）

文章內容存在 Notion（資料庫名為「Website」），網站為 SSG，**build 時才抓 Notion**，新增後必須重新部署才會上線。

用戶在 Notion 新增文章後，會說「我加了文章」，此時 Claude 負責：
1. **補齊欄位**：讀文章內文後，補上沒填的 `Slug`（英文-連字號）、`Tag`（用資料庫既有選項）、`Summary`（依寫作規範）、`Image`
2. **驗證封面圖連結**：用 `curl -o /dev/null -w "%{http_code}"` 確認 Image URL 回 200（Unsplash 圖會被移除變 404 破圖，務必先驗）
3. **本機 `npm run build`** 確認兩件事：新文章頁有產生、排版正常
4. **部署上線**：此情境已授權 Claude 直接 `vercel --prod --yes`（屬「新增文章」例外，見下方部署流程）
5. 部署後 `curl` 線上 URL 確認 200、列表頁含新文章

> Notion 文章關鍵欄位：`Title`、`Slug`、`Tag`、`Date`、`Summary`、`Image`、`Published`（要打勾）、` ExternalURL`（注意屬性名有前導空格）。
> 內文標題：Notion H1→`<h1>`、H2→`<h2>`、H3→`<h3>`，樣式定義在 `src/styles/global.css` 的 `.article-content-light`（在 `@layer components` 內）。

---

## 維護節奏（依 2026-03 維護覆盤）

- 每次推新內容後：打開文章頁確認排版
- 每月一次：跑 `/cso` 檢查安全性（有付費功能，優先級最高）
- 大改版或新功能上線前：跑 `/design-review`
- 開工前先對齊：「要報告還是直接修？測本機還是線上？」
- 原則：報告 → 等確認 → 說修再修 → 看效果 → 說推再推（不擅自改 code）

---

## 部署流程

- **禁止直接 `vercel --prod` 部署**，必須先在本機 `npm run dev` 測試確認沒問題
- 改 API 檔案（`api/*.ts`）也要先本機測過再部署，避免來回部署浪費時間
- 設定 Vercel 環境變數時，使用 `printf` 而非 `echo`，避免帶入尾部換行符
- 部署交由用戶自行 `git push` 或在 Vercel Dashboard 操作，不要在對話中執行（build log 會消耗大量 token）

---

## 環境變數清單

修改相關功能時，確認本機 `.env` 有以下變數：

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
ECPAY_TEST_MODE=true   # 開發時必須為 true

# Google Gemini
GEMINI_API_KEY=

# LINE Bot
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
ADMIN_LINE_USER_ID=
```

---

## 目錄結構快速對照

```
api/                    # Vercel Serverless Functions（付款、LINE Bot、題庫 API）
src/
  pages/                # 頁面路由
    index.astro         # 首頁
    articles/           # 文章（來自 Notion）
    ipas/               # iPAS 課程（50 堂）
    exam/               # 題庫（購買頁 / 練習 App / PDF）
    portfolio/          # 作品集
  content/ipas/         # iPAS 課程 Markdown 內容（51 篇）
  data/exam/            # 1000 題 JSON 題庫（12 個檔案）
  lib/
    notion.ts           # Notion API + 圖片下載工具
    supabase.ts         # Supabase 用戶端初始化
  layouts/Base.astro    # 主版型（導覽列、頁尾、GA）
  styles/global.css     # Tailwind + 自訂全域樣式
public/                 # 靜態資源（圖片、favicon）
```
