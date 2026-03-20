---
title: "生成式 AI 應用領域與常用工具：從文字到影像的 AI 全景"
order: 17
stage: "生成式 AI 應用"
stageOrder: 6
courseId: "L12201"
summary: "ChatGPT、DALL-E、Midjourney、Copilot⋯⋯生成式 AI 工具這麼多，各自擅長什麼？"
---

## 一、學習目標

讀完這篇，你會知道：

1. 生成式 AI 有哪幾大應用領域？各領域代表工具是什麼？
2. 文字、圖像、程式碼、音樂、影片生成工具各自的特色是什麼？
3. 生成式 AI 在哪些產業落地應用？具體用例有哪些？
4. 面對這麼多工具，如何根據場景選擇正確的工具？

---

## 二、核心內容

### 2-1｜生成式 AI 的六大應用領域

生成式 AI（Generative AI）不只是聊天機器人，它已經延伸到人類創作的各個領域。

```
生成式 AI 應用地圖
┌────────────────────────────────────────────────────┐
│                                                    │
│   文字生成          圖像生成         程式碼生成      │
│  (Text Gen)       (Image Gen)     (Code Gen)       │
│  ChatGPT          DALL-E          GitHub Copilot   │
│  Claude           Midjourney      Cursor           │
│  Gemini           Stable Diffusion                 │
│                                                    │
│   音訊 / 音樂生成    影片生成         資料分析        │
│  (Audio/Music)    (Video Gen)    (Data Analysis)   │
│  Suno, AIVA       Runway ML       Code Interpreter  │
│  ElevenLabs       Sora            (ChatGPT插件)     │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### 2-2｜文字生成（Text Generation）

**白話解釋**：輸入提示（Prompt），AI 根據對語言的理解生成連貫、有意義的文字——文章、摘要、翻譯、對話、程式碼注解，都屬於這個範疇。

生活比喻：就像你雇了一位「超級全能文書助理」，你只需要說清楚你要什麼（這就是 Prompt Engineering 的重要性），他就能幫你起草合約、寫行銷文案、翻譯文件、整理會議記錄。

| 工具 | 開發商 | 特色 |
|------|-------|------|
| **ChatGPT** | OpenAI | 最廣為人知；GPT-4o 支援文字、圖片、語音多模態 |
| **Claude** | Anthropic | 長文本處理能力強（200K token 上下文），安全性設計嚴謹 |
| **Gemini** | Google DeepMind | 深度整合 Google 生態（Search、Docs、Gmail），原生多模態 |
| **Llama（Meta AI）** | Meta | 開源模型，可在地端（On-premise）部署，適合重視資料主權的企業 |
| **Mistral** | Mistral AI | 歐洲開源模型，參數效率高，適合資源有限的場景 |

**主要應用場景**：
- 客服自動化（FAQ 回覆、情緒識別）
- 文件摘要（法律合約、研究報告）
- 內容行銷（廣告文案、社群貼文）
- 多語言翻譯
- 會議記錄整理與行動項目擷取

> **考試重點**：**ChatGPT = OpenAI**、**Claude = Anthropic**、**Gemini = Google**。Claude 的特色是**長文本上下文（Long Context）**；Llama 的特色是**開源（Open Source）**，可本地部署。

---

### 2-3｜圖像生成（Image Generation）

**白話解釋**：用文字描述你想要的圖片，AI 憑空生成一張符合描述的全新圖像。技術核心是**擴散模型（Diffusion Model）**——從一張隨機噪音圖出發，逐步「去噪」，最終生成清晰圖像。

生活比喻：就像告訴一位超快速的畫家「幫我畫一幅日落時分、賽博龐克風格的台北 101」，幾秒鐘後，你就拿到一幅從未存在過的畫作。

| 工具 | 開發商 | 特色 |
|------|-------|------|
| **DALL-E 3** | OpenAI | 深度整合 ChatGPT，自然語言描述直接生成，Prompt 理解力強 |
| **Midjourney** | Midjourney Inc. | 藝術感最強，風格統一，常用於概念藝術、品牌視覺 |
| **Stable Diffusion** | Stability AI | 開源，可本地執行，支援 ControlNet 等進階控制 |
| **Adobe Firefly** | Adobe | 深度整合 Photoshop，商業授權安全（訓練資料符合版權） |
| **ImageFX** | Google | 與 Gemini 整合，快速生成 |

**技術核心——擴散模型（Diffusion Model）**：

```
生成過程示意：
隨機噪音 → 逐步去噪 → 清晰圖像
  [????]  →  [模糊輪廓] → [細節浮現] → [最終圖像]

  每一步都由 AI 模型預測「如何去掉一點噪音」
  反覆迭代（通常 20~50 步）後，得到最終圖像
```

> **考試重點**：圖像生成的技術核心是**擴散模型（Diffusion Model）**。**Midjourney = 藝術風格最強**；**Stable Diffusion = 開源**；**DALL-E = OpenAI 出品，整合 ChatGPT**。

---

### 2-4｜程式碼生成（Code Generation）

**白話解釋**：AI 根據自然語言描述或現有程式碼的上下文，自動補全、生成、解釋或重構程式碼。這是目前在職場影響最直接的 GenAI 應用之一。

生活比喻：就像有一位資深工程師坐在你旁邊，你說「我想寫一個把 CSV 讀進來然後畫成折線圖的 Python 程式」，他馬上幫你把程式碼打出來，還會解釋每一行的意思。

| 工具 | 特色 | 適合場景 |
|------|------|---------|
| **GitHub Copilot** | 深度整合 VS Code、JetBrains，即時行內補全 | 日常編程輔助 |
| **Cursor** | 以 AI 為核心的程式碼編輯器，支援整個 Codebase 問答 | 複雜專案理解與重構 |
| **Amazon CodeWhisperer** | 深度整合 AWS 服務，資安掃描功能強 | AWS 雲端開發 |
| **Tabnine** | 支援私有模型部署，企業資料不離開內部 | 高合規要求企業 |
| **Replit AI** | 雲端 IDE 內建 AI，適合快速原型 | 學習、快速驗證 |

**常見用途**：
- 程式碼自動補全（Auto-completion）
- Bug 修復建議
- 測試案例（Unit Test）自動生成
- 程式碼解釋與文件生成
- 程式語言轉換（如 Python 轉 JavaScript）

> **考試重點**：**GitHub Copilot = GitHub（Microsoft / OpenAI）出品**，是目前市佔最高的 AI 程式碼助理。**Cursor** 是近期快速崛起的 AI-first 編輯器。

---

### 2-5｜音訊與音樂生成（Audio / Music Generation）

**白話解釋**：AI 根據描述或風格指示，生成完整的音樂、人聲或音效。甚至能複製特定人聲的音色（聲音克隆，Voice Cloning）。

生活比喻：以前要製作一首背景音樂，你需要作曲家、錄音師、混音師，花上數週時間和大筆費用。現在你告訴 AI「幫我生成一首 30 秒的、帶有爵士風格的輕鬆背景音樂」，幾十秒後就能試聽。

| 工具 | 功能類型 | 特色 |
|------|---------|------|
| **Suno** | 音樂生成 | 輸入歌詞和風格描述，生成完整歌曲（含人聲） |
| **AIVA** | 音樂作曲 | 專注古典/電影配樂風格，作曲家導向 |
| **Udio** | 音樂生成 | 高品質音樂生成，風格多元 |
| **ElevenLabs** | 語音合成 / 聲音克隆 | 極度擬真的 TTS，支援 Voice Cloning |
| **Whisper（OpenAI）** | 語音轉文字（STT） | 開源的高準確度語音辨識模型 |

> **考試重點**：**ElevenLabs** = 最知名的 AI 語音合成與**聲音克隆（Voice Cloning）**工具。**Whisper** = OpenAI 開源的語音轉文字（Speech-to-Text）模型。**Suno** = 最多人用的 AI 音樂生成工具。

---

### 2-6｜影片生成（Video Generation）

**白話解釋**：從文字描述或靜態圖片出發，AI 直接生成動態影片片段。這是目前技術進展最快也最具爭議性的領域。

生活比喻：以前一支 30 秒的商業廣告可能要數十萬製作費、幾週拍攝時間。現在能用 AI 工具在幾分鐘內生成一支視覺效果驚人的概念影片，用於提案或社群行銷。

| 工具 | 開發商 | 特色 |
|------|-------|------|
| **Runway ML（Gen-3）** | Runway | 目前最成熟的商業影片生成工具，支援文字轉影片、圖片轉影片 |
| **Sora** | OpenAI | 能生成最長 60 秒、高度物理一致性的影片（目前逐步開放） |
| **Kling** | 快手（Kuaishou） | 中國領先的影片生成模型，真實感強 |
| **Pika Labs** | Pika | 易用性高，適合行銷短片製作 |
| **HeyGen** | HeyGen | 專注 AI 數位人（Avatar）影片生成，常用於行銷影片配音 |

> **考試重點**：**Runway ML** 是目前最成熟的商業影片生成工具；**Sora** 是 OpenAI 發布、引發廣泛關注的影片生成模型。兩者都是 iPAS 考試常出現的選項。

---

### 2-7｜資料分析（Data Analysis）

**白話解釋**：讓 AI 直接分析上傳的資料集，自動生成圖表、統計分析，甚至提供洞察和建議——無需寫程式。

生活比喻：以前要分析一份 Excel 銷售資料，你需要會用 pivot table、VLOOKUP、甚至 Python pandas。現在你把檔案丟給 ChatGPT 的 Code Interpreter，說「幫我分析哪個月份銷售最好、找出趨勢」，它會自己寫程式、執行、然後用圖表告訴你結果。

| 工具 | 特色 |
|------|------|
| **Code Interpreter（ChatGPT）** | 在對話中直接執行 Python，上傳 CSV/Excel 即可分析 |
| **Julius AI** | 專注資料分析，支援多種資料格式，視覺化豐富 |
| **Noteable** | Jupyter Notebook + AI 協作 |
| **Microsoft Copilot for Excel** | Excel 內建 AI，自然語言查詢表格資料 |

---

### 2-8｜企業產業應用

生成式 AI 在各產業的落地應用已從實驗階段進入大規模部署。

| 產業 | 應用場景 | 代表工具 / 技術 |
|------|---------|--------------|
| **行銷（Marketing）** | 廣告文案生成、社群媒體貼文、個人化 Email 行銷 | ChatGPT、Jasper、Copy.ai |
| **教育（Education）** | 個人化學習內容生成、自動作業批改、智慧家教 | Khan Academy Khanmigo、Duolingo AI |
| **醫療（Healthcare）** | 醫療報告自動生成、藥物研發輔助（分子生成） | BioMedLM、Med-PaLM 2 |
| **金融（Finance）** | 風險評估報告撰寫、市場分析摘要、詐騙偵測 | Bloomberg GPT、FinBERT |
| **法律（Legal）** | 合約審閱與風險標記、判決書摘要、法律研究 | Harvey AI、CaseText |
| **製造（Manufacturing）** | 設計優化建議、品質管理文件生成、預測性維護報告 | Siemens Industrial Copilot |

**行銷應用深度解析**：

生活比喻：以前一個行銷文案撰寫師一天能產出 5~10 個廣告變體；現在配合 AI，同樣的人可以在一天內產出 50~100 個變體，讓 A/B 測試更精準。

**醫療應用深度解析**：

生活比喻：新藥開發以前要花 10~15 年、數十億美元，AI 可以在幾週內分析數百萬個分子結構，大幅縮短候選藥物的篩選時間——就像用 AI 幫你在一座超大圖書館裡快速找到最有可能的答案。

> **考試重點**：**Bloomberg GPT** 是金融領域的代表性 LLM；**Med-PaLM 2** 是 Google 醫療領域的大型語言模型；**Harvey AI** 是法律領域的代表性 AI 工具。

---

### 2-9｜如何選擇正確的工具？

面對眾多工具，選擇框架如下：

**Step 1：確認輸出類型**
- 需要文字 → 文字生成工具（ChatGPT / Claude / Gemini）
- 需要圖像 → 圖像生成工具（DALL-E / Midjourney / Stable Diffusion）
- 需要程式碼 → 程式碼工具（GitHub Copilot / Cursor）
- 需要影片 → 影片工具（Runway ML / Sora）

**Step 2：確認使用情境**

| 優先考量 | 推薦方向 |
|---------|---------|
| 易用性最重要 | ChatGPT、DALL-E（介面最友善） |
| 藝術品質最重要 | Midjourney（圖像）、Suno（音樂） |
| 開源 / 可本地部署 | Llama、Stable Diffusion、Whisper |
| 企業合規 / 資料主權 | Llama（自架）、Tabnine（程式碼）、Adobe Firefly（圖像版權安全） |
| 整合現有 Google 生態 | Gemini |
| 整合現有 Microsoft 生態 | Copilot（整合 Office 365、Azure OpenAI） |

**Step 3：確認成本與授權**
- 商業用途要確認生成內容的著作權歸屬（Midjourney 商業版、Adobe Firefly 授權明確）
- 考量 API 呼叫成本 vs 固定訂閱費

生活比喻：選 GenAI 工具就像選交通工具——短距離就用 YouBike（免費、方便），跨城市用高鐵（快但要買票），搬家要租貨車（大容量但最貴）。沒有一種工具適合所有情境，關鍵是配對需求。

---

## 三、關鍵名詞中英對照

| 中文 | 英文 | 一句話解釋 |
|------|------|-----------|
| 生成式 AI | Generative AI (GenAI) | 能夠生成新內容（文字、圖像、程式碼等）的 AI 系統 |
| 大型語言模型 | LLM (Large Language Model) | 以大量文字資料訓練、能理解和生成文字的模型 |
| 提示 | Prompt | 輸入給 AI 的指令或問題，決定 AI 輸出的品質 |
| 提示工程 | Prompt Engineering | 設計和優化提示以獲得更好 AI 輸出的技術 |
| 擴散模型 | Diffusion Model | 從噪音逐步還原圖像的圖像生成技術核心 |
| 文字轉圖像 | Text-to-Image | 用文字描述生成對應圖片的 AI 能力 |
| 文字轉影片 | Text-to-Video | 用文字描述生成對應影片的 AI 能力 |
| 聲音克隆 | Voice Cloning | AI 複製特定人聲音色的技術 |
| 語音轉文字 | STT (Speech-to-Text) | 將語音轉換為文字的 AI 技術 |
| 文字轉語音 | TTS (Text-to-Speech) | 將文字轉換為語音的 AI 技術 |
| 程式碼自動補全 | Code Auto-completion | AI 根據上下文自動建議後續程式碼的功能 |
| 多模態 | Multimodal | 能同時處理多種形式輸入（文字、圖像、語音）的 AI |
| 數位人 | AI Avatar | 由 AI 驅動的虛擬人物形象，可生成說話影片 |
| 上下文視窗 | Context Window | LLM 一次能處理的最大文字量（以 Token 計算） |
| 幻覺 | Hallucination | AI 生成看似合理但實際上錯誤的內容的現象 |

---

## 四、考試重點提示

**必背清單**：
1. 三大文字生成 LLM：**ChatGPT（OpenAI）**、**Claude（Anthropic）**、**Gemini（Google）**
2. 三大圖像生成工具：**DALL-E（OpenAI）**、**Midjourney（藝術風格強）**、**Stable Diffusion（開源）**
3. 程式碼生成代表：**GitHub Copilot**、**Cursor**
4. 影片生成代表：**Runway ML（最成熟商業工具）**、**Sora（OpenAI）**
5. 語音合成代表：**ElevenLabs（Voice Cloning）**
6. 語音辨識代表：**Whisper（OpenAI，開源）**
7. 音樂生成代表：**Suno**、**AIVA**
8. 圖像生成技術核心：**擴散模型（Diffusion Model）**
9. Claude 特色：**長上下文（Long Context）**；Llama 特色：**開源（Open Source）**
10. 金融 LLM：**Bloomberg GPT**；醫療 LLM：**Med-PaLM 2**；法律 AI：**Harvey AI**

**易混淆比較**：

| 常搞混的 | 差別在哪 |
|---------|---------|
| ChatGPT vs Claude vs Gemini | 三者都是 LLM，但開發商不同（OpenAI / Anthropic / Google）；Claude 長文本更強 |
| DALL-E vs Midjourney | DALL-E 整合 ChatGPT、Prompt 理解強；Midjourney 藝術風格最強 |
| Stable Diffusion vs Adobe Firefly | Stable Diffusion 開源可自架；Firefly 商業版權安全、整合 Photoshop |
| Runway ML vs Sora | Runway 已商用成熟；Sora 是 OpenAI 發布的研究成果，物理一致性更強 |
| ElevenLabs vs Whisper | ElevenLabs = TTS（文字轉語音）+ Voice Cloning；Whisper = STT（語音轉文字） |
| STT vs TTS | STT（Speech-to-Text）= 語音轉文字；TTS（Text-to-Speech）= 文字轉語音 |

<div class="quiz-divider">
  <span>隨堂小測驗</span>
</div>

**Q1.** 以下哪個工具是由 Anthropic 開發，且以長文本上下文處理能力著稱？
- (A) ChatGPT
- (B) Gemini
- (C) Claude
- (D) Llama

**Q2.** 圖像生成 AI 的技術核心是什麼？
- (A) 卷積神經網路（CNN）直接從像素生成圖像
- (B) 擴散模型（Diffusion Model），從噪音逐步還原圖像
- (C) 循環神經網路（RNN）逐像素生成
- (D) 決策樹（Decision Tree）根據輸入選擇最接近的圖片

**Q3.** 下列哪個是 OpenAI 開源的語音轉文字（Speech-to-Text）模型？
- (A) ElevenLabs
- (B) Suno
- (C) AIVA
- (D) Whisper

**Q4.** 以下哪個工具最適合企業需要「商業版權安全的圖像生成，且需整合現有設計工具」的需求？
- (A) Midjourney
- (B) Stable Diffusion
- (C) Adobe Firefly
- (D) DALL-E 3

**Q5.** 目前在企業「法律科技」領域中，哪個是代表性的 AI 工具，主要用於合約審閱和法律研究？
- (A) Bloomberg GPT
- (B) Harvey AI
- (C) Med-PaLM 2
- (D) GitHub Copilot

---

### 解答與解析

| 題號 | 答案 | 解析 |
|------|------|------|
| Q1 | **(C)** | Claude 是由 **Anthropic** 開發的 LLM，特色是超長的上下文視窗（Context Window，最高達 200K Token），擅長長文件分析、法律文書、程式碼庫審閱。ChatGPT = OpenAI，Gemini = Google，Llama = Meta。 |
| Q2 | **(B)** | 現代主流圖像生成 AI（DALL-E、Midjourney、Stable Diffusion）的技術核心都是**擴散模型（Diffusion Model）**，原理是從一張隨機噪音圖出發，AI 逐步「去噪」，經過多次迭代後還原出清晰圖像。 |
| Q3 | **(D)** | **Whisper** 是 OpenAI 開源的語音辨識（STT，Speech-to-Text）模型，支援多語言，準確率高。ElevenLabs 是 TTS（文字轉語音）+ 聲音克隆工具，Suno 和 AIVA 是音樂生成工具，方向完全不同。 |
| Q4 | **(C)** | **Adobe Firefly** 的最大優勢是：訓練資料來源明確合法（Adobe Stock + 公有授權素材），商業使用的版權問題最清晰；同時深度整合 Photoshop，適合設計師工作流。Midjourney 版權爭議多，Stable Diffusion 需自架，DALL-E 也有一定版權爭議。 |
| Q5 | **(B)** | **Harvey AI** 是法律科技領域最知名的 GenAI 工具，專注於合約審閱、法律文件分析、判決書摘要和法律研究。Bloomberg GPT 是**金融**領域，Med-PaLM 2 是**醫療**領域，GitHub Copilot 是**程式碼生成**，三者與法律無關。 |
