# CLAUDE.md — angela-jian-site 開發指引

本文件提供 Claude 在協助開發 angela-jian-site 時必須遵守的規則與注意事項。

---

## 專案簡介

Angela Jian 的個人品牌網站，面向想轉型 AI 產品經理的學習者。
- 網址：https://aipm-insider.com
- GitHub：9lavibecoding/angela-jian-site（**未接 Vercel 自動部署，push 不會上線**，見「部署流程」）
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

### Notion API 會限流，整個 build 會掛掉（2026-09-01 實際發生過）

一次 build 要產出每篇文章與每堂 iPAS 課程的頁面，`getArticles()` / `getIPASLessons()` 因此被
重複呼叫數百次，觸發 Notion 的 `429 rate_limited`。症狀是 build log 先出現 `rate_limited`，
接著 `Error: Lesson not found: <slug>`，最後 `Command "npm run build" exited with 1`。
2026-09-01 連續兩次 production 部署都因此失敗，線上站停在舊版兩天沒被發現。

**已建立的防護（勿刪）**：`src/lib/notion.ts` 的 `cached()` 把這兩個查詢的 **Promise** 快取起來
（快取的是 Promise 而不是結果，才能把併發中的重複呼叫一併去重）。抓失敗的結果不留在快取裡，
後續呼叫仍可重試。加上快取後建置時間從 6～7 分鐘降到 3 分鐘。

### ECPay 金流
- 修改 ECPay 相關程式碼前，確認 `.env` 的 `ECPAY_TEST_MODE=true`，避免誤觸正式金流
- `api/create-order.ts`、`api/ecpay-notify.ts`、`api/ecpay-return.ts` 為核心付款流程，修改需謹慎

### Supabase
- Row Level Security（RLS）政策直接影響使用者的購買權限與題庫存取
- 修改資料庫結構或 RLS 規則前，確認不影響已購買用戶

### Supabase 免費方案會自動暫停（2026-08-27 實際發生過）

免費方案的專案若**一週內資料庫活動不足就會被自動暫停**。暫停後 API 主機名會直接從 DNS
消失（`DNS_PROBE_FINISHED_NXDOMAIN`），Google 登入與題庫權限會全部失效。這不是程式的
bug，改 code 沒有用，只能到 Supabase Dashboard 按 Restore。暫停後一年內都可還原，資料不會遺失。

**已建立的防護（勿刪）：**
- `vercel.json` 定義 Cron 排程，每天 UTC 02:00（台灣 10:00 前後，免費方案有 ±59 分鐘誤差）
  呼叫 `api/keepalive.ts`
- `api/keepalive.ts` 對 `purchases`、`questions` 做真實查詢（單純 ping 網址不算資料庫活動，
  官方要求的是「每天幾個資料庫請求」），失敗時 LINE 通知管理者
- 環境變數 `CRON_SECRET` 用於驗證排程來源。**驗證失敗時的處理分兩種**：帶有 `x-vercel-cron`
  標頭卻驗不過 → 視為設定錯誤並發 LINE 告警（因為代表保活其實沒在跑）；沒有該標頭的外部
  呼叫 → 安靜回 401，避免通知被灌爆
- 修改 `CRON_SECRET` 後**必須重新部署**才會生效（環境變數只對新部署生效）

restore 後 PostgREST 的 schema cache 可能延遲數十秒才恢復，期間查詢會回 `PGRST205
Could not find the table`。這是正常現象，等一下即可，不要急著判斷資料表被刪掉。

---

## 資料品質規則（付費內容）

> **`src/data/exam/*.json` 為付費題庫，每一題的答案與解析必須正確無誤。**
> 修改題目前必須驗證原始題目的正確答案，不允許出現錯誤答案或錯誤解析。

---

## 訂單與權限資料模型（2026-08-31 建立）

**收到錢**與**發出權限**是兩件事，各自有一張表。這個分法來自 2026-08-27～31 的事故：
客人付了款卻拿不到題庫，而當時系統完全查不出「誰付了錢但還沒開通」。

| 表 | 意義 | 寫入時機 |
|---|---|---|
| `pending_purchases` | 綠界確認收款的訂單 | `api/ecpay-notify.ts` 收到 server-to-server 回呼時，**與客人是否登入無關** |
| `purchases` | 已開通的題庫權限 | 客人登入並完成開通時（`api/save-purchase.ts` 或 `api/claim-purchase.ts`） |

要查「誰付了錢卻還沒開通」，把兩張表 left join，看 `pending_purchases.claimed_at` 是否為 null。
**營收統計一律查 `pending_purchases`**，那張表只有真實付款，沒有測試資料。

### 權限如何判定（`api/get-questions.ts`）

1. `purchases` 有該 `user_id` 的紀錄 → 否則「尚未購買」
2. 只看**最新一筆**（`order by created_at desc limit 1`）
3. 該筆 `expires_at` 為 **NULL 代表永不過期**；有值且已過去才算到期

> 寫「有效使用者」查詢時務必包含 `expires_at is null`，只寫 `expires_at > now()` 會漏掉永久權限的帳號。

### 開通的三條路徑

1. **信用卡**：綠界導回 `ecpay-return`，發 HMAC token → 前端帶 token 呼叫 `save-purchase`
2. **email 自動認領**：客人以結帳時填的 email 所屬的 Google 帳號登入 → `claim-purchase` 比對 `pending_purchases`
3. **訂單編號自助開通**：題庫頁輸入訂單編號 → `save-purchase` 未帶 token 時會直接向綠界 QueryTradeInfo 查證

> ATM／超商是非同步付款，付款完成時**瀏覽器不會被導回網站**，只有路徑 2、3 可用。
> `ecpay-return` 在取號階段（`RtnCode=2`，有 `vAccount`／`PaymentNo`／`Barcode1`）
> **絕對不可發出 HMAC token** —— 當下客人還沒付錢，發了等同免費開通。

### 不要動的資料

- `purchases` 裡 3 筆 `TEST-ADMIN-1/2/3` **不是測試垃圾**，分別綁在
  `an9lajian@gmail.com`、`angela.jian@invos.com.tw`、`liliangelina20051212@gmail.com`
  三個自有帳號上。刪掉會讓後兩個帳號失去題庫權限。統計時用
  `trade_no not like 'TEST-ADMIN%'` 排除即可。
- `purchases.trade_no` 有 unique index，用來防止同一筆訂單被多個帳號認領（race condition
  的資料庫層保險）。建表 SQL 見 `sql/2026-08-28-pending-purchases.sql`。

### 目前的已知缺口

- **系統沒有任何寄信功能**，客人付款後收不到確認信或開通連結，只能自己回到網站。
  補法是設定自訂 SMTP（如 Resend）。
- **只支援 Google 登入**。Supabase 的 Email OTP 需要先設自訂 SMTP，否則官方會
  **拒絕寄信給非團隊成員**，對真實客人一律失敗。

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

### git push 不會部署（2026-09-02 實查）

Vercel 專案 `angela-jian-site-2ii1` **沒有接 GitHub 整合**。程式碼推上 `origin/main` 之後
Vercel 不會有任何動作，正式站不會更新。歷來所有部署都是本機用 CLI `vercel --prod` 推的。

> 這條先前寫成「部署交由用戶自行 git push」，導致 push 完誤以為已上線，實際線上跑的是
> 兩天前的舊版。要確認有沒有真的部署，看 `vercel ls` 最上面那筆的 Age 與 Status。

### 規則

- **上線一律 `vercel --prod --yes`**，或到 Vercel Dashboard 點 Redeploy
- **部署屬對外動作，執行前先問過用戶**。唯一例外是「新增文章 SOP」，該情境已授權直接執行
- 部署前必須先本機 `npm run dev` 測過、`npm run build` 通過，不要拿正式部署當測試
- 改 API 檔案（`api/*.ts`）也要先本機測過再部署，避免來回部署浪費時間
- 在對話中執行部署時，**把輸出導到檔案再過濾**，不要讓 build log 灌進 context：
  ```bash
  vercel --prod --yes > /tmp/deploy.log 2>&1; echo "EXIT=$?"
  ```
- 設定 Vercel 環境變數時，使用 `printf` 而非 `echo`，避免帶入尾部換行符
- 目前沒有 `.vercelignore`，且 `.gitignore` 未排除 `social-cards/`（約 59MB），
  每次 `vercel --prod` 都會把它整包上傳。不影響建置，只是變慢

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

# Vercel Cron（保活用，僅 production 需要）
CRON_SECRET=

# LINE Bot
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
ADMIN_LINE_USER_ID=
```

> 實際狀況（2026-08-27 實查）：本機 `.env` **只有** Notion / Supabase / ECPay / Gemini 的變數，
> LINE 三個變數與 `CRON_SECRET` 只存在於 Vercel production。要在本機測 LINE 相關功能，用
> `vercel env pull <路徑> --environment=production` 拉下來，並且**務必拉到專案目錄外**：
> `.gitignore` 只擋 `.env` 與 `.env.production`，不擋 `.env.local` 之類的檔名，拉錯位置會有
> 把正式憑證提交進 repo 的風險。用完立刻刪除。

---

## 目錄結構快速對照

```
api/                    # Vercel Serverless Functions（付款、LINE Bot、題庫 API）
  keepalive.ts          # Supabase 每日保活，由 vercel.json 的 Cron 觸發（勿刪）
vercel.json             # Vercel Cron 排程設定（目前只有保活一條）
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
