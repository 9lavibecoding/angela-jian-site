# AI PM INSIDER

Angela Jian 的個人品牌網站，專為想轉型 AI 產品經理的 PM 與非技術背景工作者打造的學習資源平台。

**網站：** https://aipm-insider.com

---

## 功能總覽

### 內容與教學
- **文章專欄** — 從 Notion 資料庫同步的 AI PM 相關文章
- **iPAS 備考攻略** — 50 堂免費課程，涵蓋 AI 基礎到生成式 AI
- **AI 證照指南** — 五大 AI 證照完整比較（iPAS、Microsoft、Google、PMP）
- **作品集** — 4 個 AI 產品實戰案例

### 互動工具
- **AI Prompt 產生器** — 透過 Google Gemini API 即時產生 PM 場景 Prompt
- **iPAS 衝刺題庫** — 1000 題互動練習系統
  - 章節分類篩選（基礎 AI / 生成式 AI / 綜合模擬）
  - 答題記錄與統計
  - 3 回計時模擬考（每回 60 分鐘）
  - 每題附詳解
  - PDF 題庫永久下載

### 電商與付款
- 綠界 ECPay 金流整合（信用卡 / ATM / 超商付款）
- 購買後 6 個月線上平台使用權 + PDF 永久下載
- LINE Bot 即時銷售通知與管理指令

---

## 技術架構

| 類別 | 技術 |
|------|------|
| 框架 | Astro 6 |
| 樣式 | Tailwind CSS 4 |
| 內容管理 | Notion API + Markdown Content Collections |
| 驗證 | Supabase Auth（Google OAuth） |
| 資料庫 | Supabase（PostgreSQL） |
| 金流 | 綠界 ECPay |
| AI 服務 | Google Gemini API |
| 通知 | LINE Bot API |
| 動畫 | GSAP |
| 圖示 | Iconify |
| 部署 | Vercel |

---

## 專案結構

```
/
├── api/                        # Vercel Serverless Functions
│   ├── create-order.ts         # 建立 ECPay 訂單
│   ├── ecpay-notify.ts         # 付款通知回呼
│   ├── ecpay-return.ts         # 付款完成導回
│   ├── verify-order.ts         # 訂單驗證
│   ├── save-purchase.ts        # 儲存購買紀錄
│   ├── get-questions.ts        # 題目 API（需驗證）
│   ├── generate-prompt.ts      # Gemini Prompt 產生
│   └── line-webhook.ts         # LINE Bot Webhook
│
├── src/
│   ├── pages/                  # 頁面路由
│   │   ├── index.astro         # 首頁
│   │   ├── articles/           # 文章列表與內頁
│   │   ├── ipas/               # iPAS 課程（50 堂）
│   │   ├── exam/               # 題庫（購買頁 / 練習 App / PDF）
│   │   ├── portfolio/          # 作品集（4 個案例）
│   │   └── ai-certifications.astro  # AI 證照比較
│   │
│   ├── layouts/
│   │   └── Base.astro          # 主版面（導覽列、頁尾、GA）
│   │
│   ├── content/ipas/           # 51 篇 Markdown 課程內容
│   ├── data/exam/              # 1000 題 JSON 題庫（12 檔）
│   ├── lib/                    # Notion / Supabase 工具函式
│   └── styles/global.css       # Tailwind + 自訂樣式
│
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
ECPAY_TEST_MODE=true

# Google Gemini
GEMINI_API_KEY=

# LINE Bot
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
ADMIN_LINE_USER_ID=
```

---

## 開發指令

| 指令 | 說明 |
|------|------|
| `npm install` | 安裝依賴 |
| `npm run dev` | 啟動本機開發伺服器（localhost:4321） |
| `npm run build` | 建置正式版到 `./dist/` |
| `npm run preview` | 本機預覽建置結果 |

---

## 部署

透過 Vercel 自動部署：
- **Build 指令：** `astro build`
- **輸出目錄：** `dist/`
- **API 路由：** `/api/*.ts` 自動部署為 Serverless Functions
- Sitemap 自動產生於 `/sitemap-index.xml`
