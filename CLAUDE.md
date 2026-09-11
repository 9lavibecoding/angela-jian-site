# CLAUDE.md — angela-jian-site 開發指引

本文件提供 Claude 在協助開發 angela-jian-site 時必須遵守的規則與注意事項。

---

## 專案簡介

Angela Jian 的個人品牌網站，面向想轉型 AI 產品經理的學習者。
- 網址：https://aipm-insider.com
- GitHub：9lavibecoding/angela-jian-site（**未接 Vercel 自動部署，push 不會上線**，見「部署流程」）
- 主要功能：iPAS 備考課程（50 堂 + 速查表）、付費題庫（1000 題，NT$199；2026-09-03 核對 `api/create-order.ts` 與購買頁一致）、文章專欄（AI Prompt 產生器與作品集頁已於 2026-09-10 下架）
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

### Notion API 會限流，而且有兩種壞法（2026-09-01、2026-09-02 各發生過一次）

一次 build 要產出每篇文章與每堂 iPAS 課程的頁面，對 Notion 打出數百個請求，很容易踩到
`429 rate_limited`。限流造成過兩種完全不同的災情：

**壞法一：build 直接掛掉（2026-09-01）**
`getArticles()` / `getIPASLessons()` 被重複呼叫數百次。症狀是 build log 先出現
`rate_limited`，接著 `Error: Lesson not found: <slug>`，最後
`Command "npm run build" exited with 1`。連續兩次 production 部署失敗，線上站停在舊版
兩天沒被發現。

**壞法二：build 成功但頁面空白（2026-09-02，更難發現）**
每頁抓 blocks 的請求被限流，而當時 `blocksToHtmlAndImage()` 的 catch 把錯誤吞成空字串。
於是 build exit 0、Vercel 顯示 Ready、部署「成功」，線上卻是第 28～38 篇連續 11 篇
有標題沒內文的空白頁，完全沒有告警。build log 裡的 11 次 `rate_limited` 與那 11 篇一一對應。

**已建立的防護（三層，勿刪）：**

1. `cached()` 把 `getArticles()` / `getIPASLessons()` 的 **Promise** 快取起來（快取的是
   Promise 而不是結果，才能把併發中的重複呼叫一併去重）。抓失敗的結果不留在快取裡，
   後續呼叫仍可重試。加上快取後建置時間從 6～7 分鐘降到 3 分鐘。
2. `withRetry()` 包住全部三個 Notion API 呼叫（`blocks.children.list` 與兩個
   `databases.query`）。遇到 `rate_limited` 等暫時性錯誤退避重試最多 4 次：有 `Retry-After`
   標頭就照它等，否則 0.5／1／2／4 秒指數退避加隨機抖動；非限流錯誤立即拋出不重試。
   2026-09-02 修復後的第一次部署就實際觸發 4 次重試（Notion 指定等 1s／7s／10s）並全部救回。
3. **抓不到內容一律讓 build 失敗，不准回傳空值。** `blocksToHtmlAndImage()`、
   `fetchIPASLessonsFromNotion()`、`getIPASLessonBySlug()` 在失敗或拿到空內容時拋
   `NotionContentError`；`fetchArticlesFromNotion()` 遇到內容抓取失敗也往上拋，
   不退回 `STATIC_ARTICLES`。

> **不要把第 3 層改回吞錯或回傳空值。** 這是 SSG：build 失敗只代表線上保留舊版，
> 永遠優於部署成功卻上線空白頁。看到 `NotionContentError` 就是 Notion 那頭有問題，
> 重跑部署即可，不要改 code 繞過。

部署後想確認沒有空白頁，掃一遍線上課程頁的大小即可（2026-09-02 實測健康值為
25.6 KB～45.5 KB；空白頁少掉約 7 KB 以上的內文，會明顯掉到 20 KB 以下）：

```bash
for s in $(ls dist/ipas | grep -v index.html); do echo "$(curl -s https://aipm-insider.com/ipas/$s | wc -c) $s"; done | sort -n | head
```

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
3. **`npm run deploy:preview`**：一行跑完 preflight（含 build）→ `vercel --yes` 部署 preview
   → 自動抓出 preview 網址 → 掃描全部 `articles/` 與 `ipas/` 頁面（約 3 分鐘 + 7 秒掃描）
4. **人工看 preview 網址**：新文章頁排版正常、封面圖沒破、列表頁有出現這篇
5. **上線**：`npm run deploy:prod`（= `vercel --prod --yes` + `check:live`）
6. 部署後 `curl` 線上 URL 確認 200、列表頁含新文章

> 第 3、5 步**都**在預先授權範圍內（屬「新增文章」例外，見下方部署流程），
> Claude 不需要為這兩次部署個別詢問。第 3 步掃出 ✗ 就**停在 preview 不要上線**，
> 重跑一次即可，那通常是 Notion 限流不是 code 有問題。

> **為什麼非得部署 preview 才算數**：第 3 步 preflight 裡的 `check:build` 掃的是**本機 `dist/`**，
> 但 Vercel 上會**重跑一次自己的 build**，各自去打 Notion。本機 build 成功不代表 Vercel 那次也成功
> —— 2026-09-02 就發生過 build exit 0、Vercel 顯示 Ready、線上卻是 11 篇空白頁。
> `deploy:preview` 是唯一能在上線前檢查到 **Vercel 產物**的關卡。

> preview 已經部署過、只想重掃一次時，用 `PREVIEW_URL=<網址> node scripts/deploy-preview.mjs`
> 跳過部署直接掃，不必再花三分鐘重新部署。

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

## 部署前檢查（2026-09-03 建立）

四層檢查腳本在 `scripts/`，共用 `scripts/lib/check.mjs` 輸出格式，任何一條失敗就 exit 1。
**閘門綁在部署，不是 push** —— push 上 GitHub 不會觸發任何部署（見下方「部署流程」），
所以在 push 前跑完整測試擋不到真正的風險。

| 指令 | 何時跑 | 內容 | 耗時 |
|---|---|---|---|
| `npm run check` | 每次 commit 前 | 金流開關、憑證外洩、價格一致性、題庫資料完整性 | < 1 秒 |
| `npm run check:revenue` | 動到 `api/`、`src/pages/exam/` 時 | 把真正的 handler import 進來實跑，斷言金流行為 | ~3 秒 |
| `npm run check:build` | `npm run build` 之後 | 掃 dist：空白頁、付費內容外洩、購買頁完整性、noindex、sitemap | < 1 秒 |
| `npm run preflight` | 被 `deploy:preview` 包住，通常不必單獨跑 | 上面三層 + build，一次跑完 | ~3 分鐘 |
| `npm run deploy:preview` | **上線前的唯一入口** | preflight + 部署 preview + 掃描 **Vercel 產物**全部頁面 | ~3 分鐘 |
| `npm run deploy:prod` | preview 確認無誤後 | `vercel --prod --yes` + `check:live` | ~2 分鐘 |
| `npm run check:live` | 被 `deploy:prod` 包住 | 線上購買頁、價格、空白頁抽查、Supabase 存活 | ~10 秒 |

> **`check:build` 與 `deploy:preview` 掃的不是同一份東西**：前者掃本機 `dist/`，後者掃 Vercel
> 實際建出來的產物。Vercel 會重跑一次自己的 build 並各自去打 Notion，所以只有後者擋得住
> 「本機好好的、Vercel 那次被限流」這種災情（2026-09-02 的 11 篇空白頁就是這樣上線的）。
> `deploy:preview` 的掃描範圍是全部 `articles/` + `ipas/`（實測 66 頁，掃描階段數秒內完成，
> 三分鐘的耗時幾乎都在 preflight 的 build 與 Vercel 部署本身），
> 門檻與 `check:build` 一致（每頁至少 5 個 `</p>`、articles 16 KB／ipas 22 KB）。

### 幾個實作上的關鍵決定

- **`check:revenue` 是實跑，不是讀原始碼猜。** Node 25 已預設支援直接 import TypeScript，
  所以腳本直接 `import handler from '../api/ecpay-return.ts'`，餵假的 req/res 執行。
  沒有引入 vitest 或任何測試框架，零新依賴。
- **最重要的那條斷言是「取號階段不得發 token」。** 已用反例驗證過：把 `ecpay-return.ts:49`
  的 `verified = macValid && rtnCode === '1'` 改成 `verified = macValid`（模擬「有人忘了檢查
  RtnCode」），ATM／超商／條碼三條斷言會同時失敗。
  順帶查明這個 invariant 其實有**三道防線**：`:56` 取號早退、`:114` `verified` 三元、
  `:120` `!verified` 直接回失敗頁不帶 `appUrl`。單獨拆掉任一道，另外兩道還擋著。
- **空白頁要靠段落數抓，不是靠檔案大小。** 實測把 `01-ai-definition` 的內文全部拿掉，
  檔案仍有 24.4 KB（其餘都是導覽列與 CSS），**大小門檻抓不到**，是 `</p>` 計數抓到的。
  下方「部署後掃線上頁面大小」那條指令對這類頁會漏判，`check:build` 才是可靠的那個。
- **`save-purchase` 與 `get-questions` 只能測到 401 分支。** 兩者在讀 body 之前就先呼叫
  Supabase 驗 token（`save-purchase.ts:106`、`get-questions.ts:35`），沒有真實 session
  就跑不到權限判定。因此 `expires_at` 為 NULL＝永久有效那條改用靜態守衛盯住判斷式本身。

### exam/print 曾把 1000 題連答案打包進公開 HTML（2026-09-04 修補）

`src/pages/exam/print.astro` 原本在 build 時 import 全部題庫 JSON 並渲染進 HTML，
前端只用 `display:none` 把它遮起來。**未登入直接 `curl https://aipm-insider.com/exam/print`
就能拿到 2.1 MB 的完整明文**，包含 1000 題與 1000 條答案解析，等於整個付費商品。
`noindex` 擋得住 Google，擋不住任何人檢視原始碼。

修補方式：該頁改為靜態殼，不在 build 時嵌入任何題目。頁面載入後由前端帶 Supabase JWT
呼叫 `/api/get-questions`，伺服器驗過 `purchases` 才回題目。產物從 1.2 MB 降到 8 KB。

> 修補其實早在 2026-07-12 就寫好放在 `fix/paywall-security` 分支，只是從未合併上線。
> 該分支另外兩項（save-purchase 要求 HMAC／QueryTradeInfo、generate-prompt 限流；
> 後者已隨 2026-09-10 下架該 API 而不再適用）
> main 已用別的寫法修好，所以**不要整支合併**，會把較新的金流寫法覆蓋回七月版本。

**已建立的防護（勿刪）：** `check:build` 從題庫 JSON 抽 3 題，拿題目與解析的前 24 字
去比對 `dist/exam/print/index.html` 與 `dist/exam/app/index.html`，出現就擋。
用真實內容比對而非檢查 markup，換成什麼標籤都躲不掉。體積上限 200 KB 為第二道。

### 測不到的部分（別誤以為有覆蓋）

- **ATM／超商的非同步付款回呼**：綠界 server-to-server 打 `ecpay-notify`，本機模擬不了，
  只能靠線上真實訂單驗證
- **Google 登入到題庫解鎖的完整流程**：需要真人瀏覽器與真實 OAuth
- **客人付款後的靜默流失**：系統目前沒有寄信功能，客人沒自己回到網站就拿不到題庫。
  這是產品缺口，不是測試能補的

---

## 部署流程

### git push 不會部署（2026-09-02 實查）

Vercel 專案 `angela-jian-site-2ii1` **沒有接 GitHub 整合**。程式碼推上 `origin/main` 之後
Vercel 不會有任何動作，正式站不會更新。歷來所有部署都是本機用 CLI `vercel --prod` 推的。

> 這條先前寫成「部署交由用戶自行 git push」，導致 push 完誤以為已上線，實際線上跑的是
> 兩天前的舊版。要確認有沒有真的部署，看 `vercel ls` 最上面那筆的 Age 與 Status。

### 兩段式部署：先 preview 再 production（2026-09-10 建立）

`vercel --yes`（**不加 `--prod`**）會產生 preview 部署，給一個獨立網址，正式站完全不動。
**這就是 stage，不需要另外建專案。** 標準流程：

```bash
npm run deploy:preview   # preflight + 部署 preview + 掃描 Vercel 產物，印出 preview 網址
npm run deploy:prod      # 人工看過 preview 後才跑：上線 + check:live
```

重掃既有的 preview 不必重新部署：`PREVIEW_URL=<網址> node scripts/deploy-preview.mjs`。

環境變數的作用域決定了 preview 有多安全（2026-09-10 `vercel env ls` 實查）：

| 變數 | 作用域 | 對 preview 的意義 |
|---|---|---|
| `ECPAY_MERCHANT_ID`／`HASH_KEY`／`HASH_IV` | 僅 Production | preview 拿不到金流憑證，`create-order` 會失敗而非打到正式金流 |
| `ECPAY_TEST_MODE=true` | Preview、Development | 2026-09-10 補上的第二道保險，防止日後把憑證加進 Preview 時忘了關正式金流 |
| `LINE_*`、`CRON_SECRET` | 僅 Production | preview 不會發 LINE 通知，也不會跑保活 |
| `SUPABASE_*` 六個 | 三環境同一組值 | ⚠️ **preview 直接讀寫正式資料庫** |

> **preview 會寫進正式資料庫**，這是目前最大的落差。新增資料表時請加一個 `env` 欄位
> （`'prod'`／`'preview'`）標記來源，統計時排除，比照 `purchases` 用 `trade_no not like 'TEST-ADMIN%'`
> 排除自有帳號的既有作法。

> 沒有獨立的 stage Supabase 專案是**刻意的決定**：免費方案一週無活動就自動暫停（2026-08-27 踩過），
> stage 用得比 prod 更少會一直處於暫停狀態，每次測試都要先去 Restore，結果就是沒人用 staging。
> 共用資料庫加來源標記是成本低很多的替代方案。

> **CLI 陷阱**：`vercel env add <name> preview` 在 CLI 50.31.1 非互動模式下會要求指定 git branch，
> 但它自己建議的「加到所有 Preview 分支」指令會無限回圈，而指定 `main` 會被拒
> （`Cannot set Production Branch "main" for a Preview Environment Variable`）。
> 解法是直接打 REST API：`POST /v10/projects/{projectId}/env`，body 帶 `target: ["preview"]`
> 且**不帶** `gitBranch`，即代表所有 preview 分支。

### 規則

- **上線前先跑 `npm run deploy:preview`**，人工看過 preview 網址、掃描全綠，才 `npm run deploy:prod`
  （見上方兩段式部署）。緊急時也可到 Vercel Dashboard 點 Redeploy，但那會跳過掃描
- **部署屬對外動作，執行前先問過用戶**。唯一例外是「新增文章 SOP」，該情境已授權直接執行，
  且授權涵蓋 preview 與 production 兩次部署
- 部署前必須先本機 `npm run dev` 測過、`npm run build` 通過，不要拿正式部署當測試
- 改 API 檔案（`api/*.ts`）也要先本機測過再部署，避免來回部署浪費時間
- 在對話中執行部署時，**把輸出導到檔案再過濾**，不要讓 build log 灌進 context：
  ```bash
  npm run deploy:preview > /tmp/deploy.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/deploy.log
  npm run deploy:prod    > /tmp/deploy.log 2>&1; echo "EXIT=$?"; tail -25 /tmp/deploy.log
  ```
  （`tail -25` 剛好是檢查結果的長度，build log 不會灌進來）
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

# Vercel Cron（保活用，僅 production 需要）
CRON_SECRET=

# LINE Bot
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
ADMIN_LINE_USER_ID=
```

> 實際狀況（2026-08-27 實查）：本機 `.env` **只有** Notion / Supabase / ECPay / Gemini 的變數（Gemini 已無用，2026-09-10 下架 API），
> LINE 三個變數與 `CRON_SECRET` 只存在於 Vercel production；`ECPAY_TEST_MODE` 在 Vercel 只掛在
> Preview 與 Development（值為 `true`），**Production 刻意不設**，因為 `process.env.ECPAY_TEST_MODE === 'true'`
> 在 undefined 時即為正式金流，正是 production 要的行為。要在本機測 LINE 相關功能，用
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
  content/ipas/         # iPAS 課程 Markdown 內容（51 篇）
  data/exam/            # 1000 題 JSON 題庫（10 個檔案）
  lib/
    notion.ts           # Notion API + 圖片下載工具
    supabase.ts         # Supabase 用戶端初始化
  layouts/Base.astro    # 主版型（導覽列、頁尾、GA）
  styles/global.css     # Tailwind + 自訂全域樣式
public/                 # 靜態資源（圖片、favicon）
```
