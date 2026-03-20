---
title: "No Code / Low Code 入門：不會寫程式也能做 AI 應用"
order: 15
stage: "No Code / Low Code"
stageOrder: 5
courseId: "L12101"
summary: "No Code 和 Low Code 差在哪？各有哪些代表工具？四大應用場景一次看懂。"
---

## 一、學習目標

讀完這篇，你會知道：

1. No Code 和 Low Code 的定義，以及兩者的核心差異？
2. 各自的目標使用者是誰？適合什麼情境？
3. No Code / Low Code 背後的核心技術是什麼？
4. 四大應用場景（商業應用、網站行動 App、AI 應用、資料整合）各有哪些代表工具？
5. 主流平台比較：Bubble、Zapier、OutSystems、Mendix、Power Apps、Retool 各有什麼強項？

---

## 二、核心內容

### 2-1｜No Code 是什麼？

**定義**：完全不需要撰寫程式碼，透過**拖拉放（Drag and Drop）**介面、視覺化設定，讓非技術背景的使用者也能建立應用程式。

生活比喻：**用積木蓋房子**——廠商已經預製好各種形狀的積木（功能模組），你只需要挑選喜歡的積木組合拼接，不需要自己從頭燒磚頭。房子能不能蓋出來，完全取決於廠商提供了哪些積木，設計彈性有限，但速度極快。

**No Code 的特徵**：
- 完全視覺化操作，零程式碼
- 目標使用者：業務人員、行銷人員、非技術背景的創業者
- 建置速度：最快（幾小時到幾天即可上線）
- 擴充彈性：受限於平台提供的功能範圍

> **考試重點**：No Code = **零程式碼**、**拖拉放介面**、**非技術用戶**。代表工具：Webflow、Airtable、Notion、Zapier、Chatfuel。

---

### 2-2｜Low Code 是什麼？

**定義**：以視覺化介面為主，搭配**少量程式碼**（JavaScript、Python、Java 等）來擴展功能，讓開發者能用更少的程式碼，更快速地建構應用程式。

生活比喻：**組合屋加裝潢**——廠商提供預製好的牆壁、地板、屋頂（視覺化模組），你只需要對外觀做少量客製化（寫一點程式碼），大幅縮短施工時間，但又保有客製化的彈性。

**Low Code 的特徵**：
- 視覺化介面 + 少量程式碼擴充
- 目標使用者：開發者、IT 部門、對技術有基本認識的業務人員（Citizen Developer）
- 建置速度：快（幾天到幾週）
- 擴充彈性：高（可自定義邏輯和整合）

> **考試重點**：Low Code = **最少程式碼**、**視覺化介面 + 擴充點（Extension Points）**、**開發者 / Citizen Developer**。代表工具：OutSystems、Mendix、Power Apps、Retool。

---

### 2-3｜No Code vs Low Code 比較表

| 比較項目 | No Code | Low Code |
|---|---|---|
| **定義** | 完全零程式碼，純視覺化操作 | 視覺化為主，少量程式碼擴充 |
| **目標用戶** | 非技術背景（業務、行銷、創業者） | 開發者、IT 人員、Citizen Developer |
| **技術門檻** | 極低（無需程式基礎） | 低至中等（需基本程式能力） |
| **開發速度** | 最快 | 快 |
| **擴充彈性** | 低（受平台功能限制） | 高（可自訂邏輯） |
| **維護成本** | 低 | 中等 |
| **代表工具** | Webflow、Airtable、Zapier、Chatfuel | OutSystems、Mendix、Power Apps、Retool |
| **適合場景** | 快速驗證概念（MVP）、簡單流程自動化 | 企業級應用、複雜業務邏輯 |

生活比喻總結：No Code 是**傻瓜相機**（按下快門就有好照片，設定有限）；Low Code 是**單眼相機**（可以手動調整更多參數，需要基本攝影知識）。兩者都比從頭學底片沖洗（傳統全端開發）快得多。

---

### 2-4｜核心技術

#### No Code 的底層技術

1. **拖拉放介面（Drag-and-Drop Builder）**：以視覺化方式組合 UI 元件，背後自動生成 HTML / CSS
2. **表單資料綁定（Form Binding）**：表單填寫後自動寫入資料庫，無需寫 SQL
3. **預建 API 模組（Pre-built API Modules）**：一鍵整合第三方服務（付款、Email、地圖），不需自己串 API

#### Low Code 的底層技術

1. **擴充點（Extension Points）**：預留的「鉤子（Hook）」，讓開發者插入自訂程式碼
2. **模組化開發（Modular Development）**：功能拆分成可重複使用的元件，拖拉組合後再微調
3. **支援多種語言（JavaScript / Python / Java）**：在視覺化介面之外，可以用熟悉的語言撰寫業務邏輯

> **考試重點**：No Code 的核心是**預建模組 + 表單綁定**；Low Code 的核心是**擴充點（Extension Points）**，允許在視覺化介面中嵌入自訂程式碼。

---

### 2-5｜四大應用場景

#### 場景一：商業應用（Business Applications）

生活比喻：過去要請工程師花 3 個月開發的員工請假系統，現在業務主管自己用 Airtable 花 3 天就建好了。

**CRM / HR 工具**：

| 工具 | 類型 | 功能 |
|---|---|---|
| **Airtable** | No Code | 彈性資料庫 + 多種視圖（Kanban、表單、甘特圖），建立客戶管理、專案追蹤系統 |
| **Notion** | No Code | 文件 + 資料庫整合，適合小型團隊的知識管理和任務追蹤 |

**工作流程自動化（Workflow Automation）**：

| 工具 | 類型 | 功能 |
|---|---|---|
| **Zapier** | No Code | 串接 5000+ App，設定觸發條件自動執行任務（如：收到 Gmail → 自動建立 Trello 卡片） |
| **Make（原 Integromat）** | No Code | 比 Zapier 更視覺化的流程圖介面，支援更複雜的條件邏輯 |
| **Power Automate** | Low Code | Microsoft 生態系的自動化工具，深度整合 Excel、Teams、SharePoint |

> **考試重點**：**Zapier / Make / Power Automate** = 工作流程自動化（Workflow Automation）。Zapier 串接 App 最多、最易用；Power Automate 最適合 Microsoft 企業環境。

---

#### 場景二：網站與行動應用（Web & Mobile Apps）

生活比喻：餐廳老闆不用請工程師，自己用 Wix 花一個週末就架好官網和線上訂位系統。

**網站建置**：

| 工具 | 類型 | 強項 |
|---|---|---|
| **Wix** | No Code | 最易上手的拖拉放網站，適合個人和小商家 |
| **Shopify** | No Code | 電商專用，內建金流、庫存、物流整合 |
| **Webflow** | Low Code | 精細的設計控制 + CMS，適合設計師和行銷團隊 |

**行動 App 建置**：

| 工具 | 類型 | 強項 |
|---|---|---|
| **Adalo** | No Code | 拖拉放建立原生 iOS / Android App，直接發布到 App Store |
| **Thunkable** | No Code | 教育導向的 App 建置工具，支援積木式程式邏輯 |

> **考試重點**：Webflow 雖然偏向設計師使用，但仍屬 **Low Code** 範疇（支援客製化互動邏輯）。Shopify = **電商 No Code 首選**。

---

#### 場景三：AI 應用（AI Applications）

生活比喻：不懂機器學習的行銷人員，也能用 Chatfuel 在一個下午架好 Facebook 聊天機器人，接待客戶詢問。

**聊天機器人（Chatbot）**：

| 工具 | 類型 | 功能 |
|---|---|---|
| **Chatfuel** | No Code | 建立 Facebook Messenger / Instagram 聊天機器人，流程化對話設計 |
| **Landbot** | No Code | 網頁嵌入式對話機器人，視覺化流程圖設計，可接 GPT |

**資料處理與 AI 模型（Data Processing & AI Model）**：

| 工具 | 類型 | 功能 |
|---|---|---|
| **Google AutoML** | Low Code | Google Cloud 的自動機器學習，上傳資料後自動訓練圖片分類 / 文字分類模型 |
| **Azure AI** | Low Code | Microsoft 的 AI 服務平台，提供電腦視覺、語音識別、語言理解等 API，低程式碼整合 |

> **考試重點**：**AutoML（Automated Machine Learning）** 是 Low Code AI 的代表——讓不懂 ML 算法的人也能訓練自己的 AI 模型，只需上傳標注資料。

---

#### 場景四：資料整合與 API 管理（Data Integration & API）

生活比喻：業務人員想把 CRM 系統的資料即時顯示在漂亮的儀表板上，又不想等 IT 部門排三個月的開發時程——用 Retool 兩天就搞定。

| 工具 | 類型 | 強項 |
|---|---|---|
| **Retool** | Low Code | 拖拉放建立內部管理後台，直接連接資料庫（PostgreSQL、MongoDB）和 REST API |
| **Tableau** | Low Code | 強大的商業智慧（BI）視覺化工具，拖拉放建立互動式圖表和儀表板 |
| **n8n** | Low Code | 開源的工作流程自動化工具，自行部署（Self-hosted），資料不出公司內網 |

> **考試重點**：**Retool** 定位是「**內部工具（Internal Tools）**」的 Low Code 平台，特別適合快速建立後台管理系統。**n8n** 是 Zapier 的開源替代方案，強調**資料主權（Data Sovereignty）**。

---

### 2-6｜主流平台綜合比較

| 平台 | 類型 | 語言支援 | 最大強項 | 目標用戶 |
|---|---|---|---|---|
| **Bubble** | No Code | 無（純視覺） | 功能最完整的 No Code 全端 App 開發 | 非技術創業者 |
| **Zapier** | No Code | 無（純視覺） | 串接 5000+ App 的自動化流程 | 業務、行銷人員 |
| **OutSystems** | Low Code | Java / .NET | 企業級應用，高度安全與可擴展性 | 企業 IT 部門 |
| **Mendix** | Low Code | Java | 快速開發企業應用，SAP 生態整合佳 | 企業開發者 |
| **Power Apps** | Low Code | Power Fx / JavaScript | 深度整合 Microsoft 365 生態系 | 微軟企業用戶 |
| **Retool** | Low Code | JavaScript / SQL | 快速建立內部管理工具，直連資料庫 | 開發者、IT 人員 |

生活比喻：
- **Bubble** = 一個人的全能工作室（什麼都能做，但不能突破工具上限）
- **OutSystems / Mendix** = 大型企業的建築公司（工業級規格，品質保證）
- **Power Apps** = 微軟辦公室的內建工具（和 Word、Excel 無縫配合）
- **Retool** = 工程師的快速搭鷹架工具（速度快，但仍需基本技術能力）

---

## 三、關鍵名詞中英對照

| 中文 | 英文 | 一句話解釋 |
|---|---|---|
| 無程式碼 | No Code | 完全不需撰寫程式碼，純視覺化操作建立應用 |
| 低程式碼 | Low Code | 以視覺化介面為主，搭配少量程式碼擴充功能 |
| 拖拉放 | Drag and Drop | 以滑鼠拖曳方式組合 UI 元件的操作介面 |
| 公民開發者 | Citizen Developer | 非正式開發者，利用 Low Code 工具自行開發應用的業務人員 |
| 工作流程自動化 | Workflow Automation | 設定觸發條件，讓重複性任務在系統之間自動執行 |
| 觸發條件 | Trigger | 啟動自動化流程的事件（如收到 Email、新增資料列） |
| 擴充點 | Extension Point | Low Code 平台中允許插入自訂程式碼的預留接口 |
| 預建模組 | Pre-built Module | 平台提供的現成功能組件，直接使用無需從頭開發 |
| 表單資料綁定 | Form Binding | 表單輸入自動同步到資料庫的機制 |
| 自動機器學習 | AutoML (Automated Machine Learning) | 自動選擇演算法和調整超參數的 AI 訓練平台 |
| 商業智慧 | BI (Business Intelligence) | 收集、分析、視覺化資料以支援商業決策的工具和方法 |
| 內部工具 | Internal Tools | 企業內部使用的管理後台和操作介面（非對外產品） |
| 資料主權 | Data Sovereignty | 資料存放和處理的控制權歸屬（自行部署避免資料外流） |
| 最小可行產品 | MVP (Minimum Viable Product) | 功能最精簡的初始版本，用於快速驗證市場需求 |
| 電子商務 | E-commerce | 線上銷售商品或服務的商業模式 |

---

## 四、考試重點提示

**必背清單**：
1. No Code = **零程式碼**、拖拉放、**非技術用戶**
2. Low Code = **少量程式碼**、視覺化 + 擴充點、**開發者 / Citizen Developer**
3. **Zapier / Make / Power Automate** = 工作流程自動化
4. **Power Automate** = Microsoft 生態系首選
5. **Shopify** = 電商 No Code 首選
6. **Google AutoML / Azure AI** = Low Code AI 訓練平台
7. **Chatfuel / Landbot** = 聊天機器人 No Code 工具
8. **Retool** = 內部工具（Internal Tools）Low Code 平台，直連資料庫
9. **n8n** = 開源、自行部署、強調資料主權的自動化工具
10. **OutSystems / Mendix** = 企業級 Low Code 平台（iPAS 常考）

**易混淆比較**：

| 常搞混的 | 差別在哪 |
|---|---|
| No Code vs Low Code | No Code 完全不寫程式；Low Code 允許少量程式碼擴充 |
| Zapier vs n8n | Zapier 是雲端 SaaS；n8n 是開源自行部署，資料不出公司 |
| Retool vs Tableau | Retool 建立可互動的管理後台；Tableau 主要做資料視覺化儀表板 |
| Bubble vs Webflow | Bubble 是功能完整的 No Code 全端；Webflow 偏向設計師的 Low Code 網站工具 |
| OutSystems vs Mendix | 兩者都是企業級 Low Code；OutSystems 以 Java/.NET 為主；Mendix 與 SAP 整合較佳 |
| AutoML vs 傳統 ML | AutoML 自動選模型和調參（Low Code）；傳統 ML 需手動設計特徵和選擇算法 |

<div class="quiz-divider">
  <span>隨堂小測驗</span>
</div>

**Q1.** 一位完全沒有程式背景的行銷人員，想要建立一個簡單的客戶管理系統（CRM），下列哪個工具最適合？

- (A) OutSystems，因為它功能最完整
- (B) Airtable，因為它是 No Code 工具，零程式碼即可建立彈性資料庫
- (C) Retool，因為它可以直接連接資料庫
- (D) n8n，因為它是開源且免費的

**Q2.** Low Code 與 No Code 最關鍵的差異是什麼？

- (A) Low Code 只能開發行動 App，No Code 只能開發網站
- (B) Low Code 允許少量程式碼擴充功能；No Code 完全不需要撰寫任何程式碼
- (C) Low Code 是免費的，No Code 需要付費訂閱
- (D) Low Code 的建置速度比 No Code 快

**Q3.** 公司希望資料不經過第三方雲端服務，並自行部署工作流程自動化工具，下列哪個工具最符合需求？

- (A) Zapier
- (B) Make（原 Integromat）
- (C) n8n
- (D) Power Automate

**Q4.** Google AutoML 在 No Code / Low Code 分類中屬於哪一類？解決的是什麼問題？

- (A) No Code；解決企業缺乏工程師的問題
- (B) Low Code；讓不懂 ML 算法的人也能訓練 AI 模型（自動選擇算法和調參）
- (C) No Code；讓任何人都能建立電商網站
- (D) Low Code；讓開發者可以用視覺化方式管理資料庫

**Q5.** 下列關於主流 Low Code / No Code 平台的描述，哪一個是**正確**的？

- (A) Bubble 是企業級 Low Code 平台，主要服務大型企業 IT 部門
- (B) Shopify 是 Low Code 電商工具，需要撰寫 JavaScript 才能上線
- (C) Retool 定位為「內部工具（Internal Tools）」的 Low Code 平台，支援直連資料庫
- (D) Power Apps 是 Google 生態系的自動化工具，與 Gmail 整合最佳

---

### 解答與解析

| 題號 | 答案 | 解析 |
|---|---|---|
| Q1 | **(B)** | Airtable 是 No Code 工具，提供彈性資料庫搭配多種視圖（Kanban、表格、甘特圖、表單），非技術背景用戶無需寫任何程式碼即可建立客戶管理系統。OutSystems 和 Retool 都需要一定技術背景；n8n 主要是工作流程自動化，而非資料庫管理工具。 |
| Q2 | **(B)** | No Code 的核心定義是「完全零程式碼」，使用者透過純視覺化操作完成所有功能。Low Code 允許在視覺化介面基礎上插入少量程式碼（透過擴充點 Extension Points），以實現更複雜的自訂邏輯。兩者的差異不在速度或費用，而在於**是否支援撰寫程式碼**。 |
| Q3 | **(C)** | n8n 是**開源（Open Source）**的工作流程自動化工具，支援**自行部署（Self-hosted）**，資料在公司內網處理不外流，是最強調**資料主權（Data Sovereignty）**的選擇。Zapier 和 Make 都是雲端 SaaS 服務；Power Automate 需要使用微軟雲端服務。 |
| Q4 | **(B)** | Google AutoML 屬於 **Low Code** 範疇——使用者只需上傳標注好的訓練資料，平台會自動選擇最適合的機器學習算法並調整超參數（Hyperparameter Tuning）。這讓不懂 ML 算法的業務人員也能訓練自己的 AI 模型。這正是「自動機器學習（AutoML, Automated Machine Learning）」的核心價值。 |
| Q5 | **(C)** | Retool 的定位是快速建立**內部工具（Internal Tools）**的 Low Code 平台，支援直接連接 PostgreSQL、MongoDB 等資料庫和 REST API，非常適合開發後台管理系統。Bubble 是 **No Code** 平台（非企業級 Low Code）；Shopify 是 **No Code** 電商工具；Power Apps 是 **Microsoft**（而非 Google）生態系的工具。 |
