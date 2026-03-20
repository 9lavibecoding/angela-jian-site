---
title: "考前衝刺：iPAS AI 應用規劃師全範圍速查表"
order: 51
stage: "總複習與模擬考"
stageOrder: 14
courseId: "L11+L12"
summary: "考前最後一天看這篇！全課綱重點濃縮、必背清單、易混淆比較、關鍵數字年份速查。"
---

> 本篇為純參考速查，無模擬考題。建議列印或開啟在副螢幕，配合複習使用。

---

## AI 基礎概念速查

### 關鍵年份與人物

| 年份 | 事件 | 重要性 |
|------|------|--------|
| 1950 | Alan Turing 發表《Computing Machinery and Intelligence》，提出圖靈測試 | AI 思想起點 |
| 1956 | Dartmouth Conference，John McCarthy 首次提出「Artificial Intelligence」一詞 | AI 學科正式誕生 |
| 1986 | Rumelhart、Hinton 等人推廣反向傳播演算法（Backpropagation） | 神經網路訓練基礎 |
| 1997 | IBM Deep Blue 擊敗西洋棋世界冠軍 Kasparov | Narrow AI 里程碑 |
| 2006 | Geoffrey Hinton 提出深度信念網路（DBN），掀起深度學習復興 | Deep Learning 元年 |
| 2012 | AlexNet 以深度 CNN 贏得 ImageNet 競賽，錯誤率大幅下降 | 深度學習主流化 |
| 2017 | Google Brain 發表《Attention Is All You Need》，提出 Transformer 架構 | 現代 LLM 基礎 |
| 2018 | Google 發布 BERT，OpenAI 發布 GPT-1 | 預訓練語言模型時代 |
| 2020 | OpenAI 發布 GPT-3（1750 億參數） | 大型語言模型崛起 |
| 2022 | OpenAI 發布 ChatGPT，生成式 AI 進入大眾視野 | GenAI 普及化分水嶺 |
| 2024 | 歐盟 AI Act 正式生效 | 全球首部全面性 AI 法規 |

---

### AI 分類體系

**按智能程度**：

| 類型 | 英文 | 特徵 | 現況 |
|------|------|------|------|
| 弱 AI | Weak AI / Narrow AI | 只能執行特定任務 | 現今所有商業 AI |
| 強 AI | Strong AI / AGI | 具備跨領域通用智慧，如人類 | 尚未實現 |
| 超 AI | Super AI / ASI | 全面超越人類智慧 | 假設性概念 |

**按記憶能力（Arend Hintze 分類）**：

| 類型 | 英文 | 代表系統 |
|------|------|----------|
| 純反應型 | Reactive Machines | Deep Blue（西洋棋 AI） |
| 有限記憶型 | Limited Memory | 自動駕駛、推薦系統、現代 LLM |
| 心智理論型 | Theory of Mind | 理論中，未實現 |
| 自我意識型 | Self-Aware AI | 假設性，科幻概念 |

---

### Russell & Norvig 四象限

| | **像人類（Human-like）** | **理性（Rational）** |
|--|--------------------------|----------------------|
| **思考（Thinking）** | 像人類一樣思考（認知模型方法） | 理性思考（邏輯推論方法） |
| **行動（Acting）** | 像人類一樣行動（圖靈測試方法） | 理性行動（理性代理人方法）← 主流研究方向 |

---

## AI 治理與法規速查

### 負責任 AI（Responsible AI）六大原則

| 原則 | 英文 | 一句話說明 |
|------|------|-----------|
| 公平性 | Fairness | AI 決策不應對特定族群產生歧視或偏見 |
| 可靠性與安全性 | Reliability & Safety | AI 系統須穩定運作且不造成危害 |
| 隱私性 | Privacy & Security | 保護個人資料，防止未授權存取 |
| 普惠性 | Inclusiveness | AI 應服務所有人，不排除弱勢族群 |
| 透明性 | Transparency | AI 決策過程應可理解與解釋 |
| 問責性 | Accountability | 明確界定 AI 決策的責任歸屬 |

---

### 歐盟 AI Act 四級風險

| 風險等級 | 英文 | 監管方式 | 典型應用 |
|----------|------|----------|----------|
| 不可接受風險 | Unacceptable Risk | **直接禁止** | 公共場所即時生物辨識、社會信用評分、操控弱勢族群的 AI |
| 高風險 | High Risk | 嚴格合規義務（6項）+ CE 標誌 | 信用評分、招募篩選、醫療診斷、入學篩選、移民審核 |
| 有限風險 | Limited Risk | 透明度告知義務 | 聊天機器人（須告知是 AI）、深度偽造（Deep Fake）標示 |
| 低風險 / 無風險 | Minimal/No Risk | 幾乎無額外義務 | AI 垃圾郵件過濾、AI 推薦播放清單 |

**高風險 AI 六大合規義務**：資料治理、技術文件、透明度、人為監督、準確性與穩健性、符合性評估（CE 標誌）

---

### NIST AI Risk Management Framework（AI RMF）

| 功能 | 英文 | 核心任務 |
|------|------|----------|
| 治理 | **Govern** | 建立 AI 風險管理的文化、政策與職責 |
| 對應 | **Map** | 識別並分類 AI 系統的風險情境 |
| 量測 | **Measure** | 分析、評估與追蹤 AI 風險 |
| 管理 | **Manage** | 優先處理並回應已識別的 AI 風險 |

> 記憶口訣：**G-M-M-M**（Govern → Map → Measure → Manage）

---

### 台灣 AI 相關法規快速查詢

| 主管機關 | 相關法規 / 指引 | 重點 |
|----------|-----------------|------|
| 數位部（MODA） | AI 基本法草案、資料治理框架 | 台灣 AI 整體治理架構 |
| 金管會（FSC） | 金融業 AI 使用指引 | 金融業 AI 模型風險管理、公平對待客戶 |
| 經濟部 | 產業 AI 化推動計畫 | 製造業、中小企業 AI 導入補助 |
| 衛福部 | AI 醫療器材審查指引 | 醫療 AI 軟體的查驗登記要求 |

---

### GDPR 七大資料主體權利

| 權利 | 英文 | 一句話說明 |
|------|------|-----------|
| 知情權 | Right to be Informed | 有權知道企業如何使用你的資料 |
| 查閱權 | Right of Access | 有權要求查看企業持有你的哪些資料 |
| 更正權 | Right to Rectification | 有權要求更正不正確的個人資料 |
| 被遺忘權 | Right to Erasure | 有權在特定條件下要求刪除個人資料 |
| 限制處理權 | Right to Restrict Processing | 有權要求限制（而非刪除）資料的使用方式 |
| 可攜權 | Right to Data Portability | 有權以結構化格式取得資料並轉移至其他業者 |
| 反對權 | Right to Object | 有權反對特定目的（如行銷）的資料處理 |

---

## 資料處理速查

### 資料類型三大類

| 類型 | 英文 | 特徵 | 例子 |
|------|------|------|------|
| 結構化資料 | Structured Data | 固定欄位、可存入關聯式資料庫 | Excel 表、SQL 資料庫、感測器數值 |
| 半結構化資料 | Semi-Structured Data | 有部分結構但不固定 | JSON、XML、電子郵件、HTML |
| 非結構化資料 | Unstructured Data | 無固定格式，佔資料總量約 80% | 圖片、影片、語音、自由文字 |

---

### 資料管線 8 階段

| 階段 | 英文 | 說明 |
|------|------|------|
| 1. 資料收集 | Data Collection | 從各來源蒐集原始資料 |
| 2. 資料儲存 | Data Storage | 選擇適合的儲存架構（資料湖、資料倉儲） |
| 3. 資料清理 | Data Cleaning | 處理缺失值、異常值、重複資料 |
| 4. 資料整合 | Data Integration | 合併多來源資料，統一格式 |
| 5. 資料轉換 | Data Transformation | 正規化、標準化、編碼 |
| 6. 特徵工程 | Feature Engineering | 萃取、建立對模型有用的特徵 |
| 7. 資料分割 | Data Splitting | 訓練集 / 驗證集 / 測試集（常見比例 70/15/15 或 80/10/10）|
| 8. 資料版本管理 | Data Versioning | 追蹤資料集版本，確保實驗可重現 |

---

### 五種資料偏誤（Bias）

| 偏誤類型 | 英文 | 成因 | 例子 |
|----------|------|------|------|
| 歷史 / 社會偏誤 | Historical/Societal Bias | 訓練資料反映歷史不平等 | 舊招募資料中男性佔多數，導致 AI 歧視女性求職者 |
| 抽樣偏誤 | Sampling Bias | 樣本不具代表性 | 只用都市醫院資料訓練，農村病患診斷準確率低 |
| 測量偏誤 | Measurement Bias | 資料收集方式不一致 | 不同醫院使用不同標準測量血壓 |
| 確認偏誤 | Confirmation Bias | 選擇性收集支持既有假設的資料 | 只選用支持特定結論的資料集 |
| 標籤偏誤 | Labeling Bias | 人工標籤者的主觀判斷影響標籤 | 標籤員對「攻擊性語言」的認定因文化背景而異 |

---

### 資料品質五大維度

| 維度 | 英文 | 說明 |
|------|------|------|
| 完整性 | Completeness | 無缺失值、無遺漏欄位 |
| 準確性 | Accuracy | 資料符合真實情況 |
| 一致性 | Consistency | 跨系統、跨時間的資料定義相同 |
| 及時性 | Timeliness | 資料為最新且可用 |
| 唯一性 | Uniqueness | 無重複紀錄 |

---

## 機器學習速查

### 四大學習類型

| 學習類型 | 英文 | 訓練資料 | 目標 | 代表模型 |
|----------|------|----------|------|----------|
| 監督式學習 | Supervised Learning | 有標籤的 (X, Y) 配對 | 預測標籤 Y | 線性回歸、SVM、CNN、隨機森林 |
| 非監督式學習 | Unsupervised Learning | 只有輸入 X，無標籤 | 發現隱藏結構 | K-means、DBSCAN、PCA、自編碼器 |
| 半監督式學習 | Semi-Supervised Learning | 少量有標籤 + 大量無標籤 | 充分利用未標籤資料 | Self-training、Label Propagation |
| 強化學習 | Reinforcement Learning | 環境互動的獎懲信號 | 最大化長期獎勵 | DQN、PPO、AlphaGo |

---

### 主要模型比較

| 模型 | 類別 | 核心原理 | 適用場景 | 優點 | 缺點 |
|------|------|----------|----------|------|------|
| 線性回歸 | 監督（回歸） | 最小化均方誤差的線性擬合 | 數值預測 | 可解釋性高、訓練快 | 只能捕捉線性關係 |
| 邏輯回歸 | 監督（分類） | Sigmoid 函數輸出機率 | 二元分類 | 可解釋、輸出機率 | 無法處理非線性 |
| SVM | 監督（分類）| 最大化類別間隔（Margin） | 高維小樣本分類 | 高維有效、核技巧 | 大資料集訓練慢 |
| 決策樹 | 監督 | 資訊增益 / Gini 係數遞迴分割 | 可解釋性需求高 | 易理解、可視化 | 易過擬合 |
| 隨機森林 | 監督（集成） | Bagging + 多棵決策樹投票 | 通用分類回歸 | 準確率高、防過擬合 | 可解釋性低 |
| KNN | 監督 | K 個最近鄰的多數投票 | 小資料集分類 | 簡單直觀 | 預測時計算量大 |
| XGBoost | 監督（集成） | Gradient Boosting 串接弱學習器 | 結構化資料競賽 | 準確率極高 | 超參數調整複雜 |
| CNN | 監督（深度學習） | 卷積核萃取空間特徵 | 影像、影片 | 自動學習空間特徵 | 需大量資料 |
| RNN | 監督（深度學習） | 隱藏狀態傳遞序列記憶 | 時序資料（基礎） | 處理序列 | 梯度消失、無法平行 |
| LSTM | 監督（深度學習） | 遺忘門、輸入門、輸出門控制記憶 | 長序列、時間序列 | 解決梯度消失 | 結構複雜 |
| Transformer | 監督（深度學習） | 自注意力機制，可平行計算 | NLP、多模態 | 長距離依賴、可平行 | 計算資源需求高 |

---

### 評估指標公式

| 指標 | 英文 | 公式 | 說明 |
|------|------|------|------|
| 準確率 | Accuracy | (TP + TN) / (TP + TN + FP + FN) | 整體預測正確比例 |
| 精確率 | Precision | TP / (TP + FP) | 預測為正例中真正是正例的比例（避免假警報）|
| 召回率 | Recall / Sensitivity | TP / (TP + FN) | 實際正例中被正確預測的比例（避免漏報）|
| F1 分數 | F1 Score | 2 × (Precision × Recall) / (Precision + Recall) | Precision 與 Recall 的調和平均 |
| AUC-ROC | AUC | ROC 曲線下面積，越接近 1 越好 | 不受類別不平衡影響的整體分類能力 |

> **考試提示**：高 Precision 低 Recall → 模型保守，漏報多（如罕見病篩檢不好）；高 Recall 低 Precision → 模型積極，誤報多（如垃圾郵件過濾誤傷正常信）

---

### 過擬合（Overfitting）解決方案

| 方法 | 英文 | 說明 |
|------|------|------|
| 增加訓練資料 | More Training Data | 最根本的解法 |
| 資料擴增 | Data Augmentation | 翻轉、旋轉、裁切等方式擴充訓練集 |
| 正規化 L1/L2 | L1/L2 Regularization | 懲罰大的權重值（L1=Lasso，L2=Ridge）|
| Dropout | Dropout | 訓練時隨機關閉部分神經元 |
| 早停 | Early Stopping | 驗證集損失不再下降時停止訓練 |
| 減少模型複雜度 | Reduce Model Complexity | 降低層數、參數數量 |
| 交叉驗證 | Cross-Validation | K-fold CV 評估模型泛化能力 |

---

## 鑑別式 vs 生成式 AI 速查

### 核心對比

| 比較維度 | 鑑別式 AI（Discriminative AI） | 生成式 AI（Generative AI） |
|----------|-------------------------------|---------------------------|
| 建模目標 | 條件機率 P(Y\|X) | 聯合分佈 P(X,Y) 或邊際分佈 P(X) |
| 核心任務 | 分類、預測 | 生成新資料 |
| 典型模型 | SVM、邏輯回歸、CNN（分類）、BERT | GAN、VAE、Diffusion、GPT |
| 應用 | 影像分類、情感分析、詐欺偵測 | 影像生成、文字創作、程式碼生成 |
| 輸出 | 類別標籤或數值 | 新的資料樣本（圖片、文字、音訊）|

---

### 主要生成式 AI 架構一覽

| 架構 | 英文 | 核心機制 | 代表應用 |
|------|------|----------|----------|
| 生成對抗網路 | GAN | 生成器與鑑別器對抗訓練 | 高擬真人臉生成（StyleGAN）、深度偽造 |
| 變分自編碼器 | VAE | 潛空間學習連續機率分佈，取樣生成 | 影像生成、資料擴增、藥物設計 |
| 擴散模型 | Diffusion Model | 前向加噪 + 逆向去噪學習 | Stable Diffusion、DALL-E 2、Midjourney |
| 大型語言模型 | LLM | Transformer 自迴歸預測下一個 Token | GPT-4、Claude、Gemini、Llama |

---

### 整合技術摘要

| 技術 | 英文 | 說明 |
|------|------|------|
| 遷移學習 | Transfer Learning | 將預訓練模型的知識遷移至新任務，減少訓練需求 |
| 微調 | Fine-tuning | 在預訓練模型基礎上，用少量目標資料繼續訓練 |
| 特徵萃取 | Feature Extraction | 凍結預訓練模型權重，只訓練新增的分類頭 |
| 提示工程 | Prompt Engineering | 透過設計輸入提示引導模型輸出，無需更新權重 |
| RAG | Retrieval-Augmented Generation | 結合外部知識庫查詢，強化生成準確性 |

---

## 生成式 AI 應用速查

### 主要工具類型

| 類別 | 代表工具 | 主要用途 |
|------|----------|----------|
| 文字生成 | ChatGPT、Claude、Gemini、Llama | 對話、寫作、摘要、翻譯、程式碼 |
| 影像生成 | Midjourney、Stable Diffusion、DALL-E | 藝術創作、廣告素材、設計原型 |
| 程式碼生成 | GitHub Copilot、Cursor、CodeWhisperer | 程式碼補全、Bug 修復、文件生成 |
| 語音合成 | ElevenLabs、Azure TTS、Google TTS | 有聲書、語音助理、客服 IVR |
| 影片生成 | Runway Gen-3、Sora、Pika | 廣告影片、教育內容、創意短片 |
| 多模態 | GPT-4V、Gemini Ultra、Claude 3 | 圖文理解、文件分析、視覺問答 |

---

### No-Code vs Low-Code AI

| 比較維度 | No-Code AI | Low-Code AI |
|----------|-----------|------------|
| 程式碼需求 | 完全零程式碼 | 少量程式碼（關鍵環節可客製化）|
| 目標用戶 | 業務人員、非技術人員 | 有基礎程式能力的開發者或進階用戶 |
| 彈性 | 較低，功能受工具限制 | 較高，可客製化核心邏輯 |
| 代表工具 | Teachable Machine、Google AutoML、Lobe | Azure ML Designer、H2O.ai、Hugging Face AutoTrain |
| 典型用途 | 快速 POC、部門級小型應用 | 企業級應用、需客製化的生產環境 |
| 開發速度 | 最快 | 快（相較全程式碼開發）|

---

### Prompt Engineering 五大技術

| 技術 | 英文 | 說明 | 範例 |
|------|------|------|------|
| 零樣本提示 | Zero-shot Prompting | 直接描述任務，不給範例 | 「翻譯以下句子為英文：...」 |
| 少樣本提示 | Few-shot Prompting | 在提示中提供 2-5 個輸入輸出範例 | 「以下是情感分析範例：[例1][例2]，現在分析：...」 |
| 思維鏈提示 | Chain-of-Thought (CoT) | 引導模型展示推理步驟 | 「讓我們一步一步思考...」 |
| 角色提示 | Role Prompting | 指定模型扮演特定角色 | 「你是一位資深醫師，請解釋...」 |
| 結構化輸出 | Structured Output | 要求特定格式輸出（JSON、表格等）| 「請以 JSON 格式回傳：{"name": ..., "score": ...}」 |

---

### RAG 管線步驟

| 步驟 | 說明 |
|------|------|
| 1. 文件載入（Document Loading） | 讀取 PDF、Word、網頁等來源文件 |
| 2. 文件切塊（Chunking） | 將文件切割成適當大小的文字片段 |
| 3. 向量化（Embedding） | 使用 Embedding 模型將文字轉為向量 |
| 4. 向量儲存（Vector Store） | 存入向量資料庫（如 Pinecone、Chroma、FAISS）|
| 5. 查詢轉換（Query Encoding） | 將用戶問題轉為查詢向量 |
| 6. 相似度檢索（Similarity Search） | 從向量庫找出最相關的文字片段 |
| 7. 增強生成（Augmented Generation） | 將檢索結果注入 Prompt，送給 LLM 生成回答 |

---

### LLM 訓練四階段

| 階段 | 英文 | 訓練資料 | 目標 |
|------|------|----------|------|
| 1. 預訓練 | Pre-training | 大規模無標籤文本（網路爬蟲、書籍等）| 學習語言的統計規律與世界知識 |
| 2. 監督式微調 | Supervised Fine-tuning (SFT) | 高品質問答對（人工標注） | 學習指令遵循格式 |
| 3. 獎勵模型訓練 | Reward Model Training | 人類對多個回答的排序偏好 | 訓練可預測人類偏好的評分模型 |
| 4. 強化學習對齊 | RLHF（PPO 等算法） | 獎勵模型的評分信號 | 使模型輸出符合人類價值觀與偏好 |

---

## 導入規劃速查

### AI 導入評估四大面向

| 評估面向 | 核心問題 |
|----------|----------|
| 技術可行性（Technical Feasibility） | 資料是否足夠？算力是否充足？技術成熟度？ |
| 商業可行性（Business Feasibility） | ROI 是否正向？與業務目標是否契合？ |
| 倫理合規性（Ethics & Compliance） | 是否符合法規？是否涉及隱私或偏見風險？ |
| 組織準備度（Organizational Readiness） | 團隊能力、變革管理、資料文化是否就緒？ |

---

### AI 導入部署規劃階段

| 階段 | 主要活動 |
|------|----------|
| 1. 問題定義 | 確定 AI 應解決的具體業務問題，定義成功指標（KPI）|
| 2. 資料盤點 | 評估現有資料的量、質、可用性 |
| 3. 概念驗證（POC） | 小規模試驗，驗證技術方向可行性 |
| 4. 試驗部署（Pilot） | 選定部門或場景進行受控環境測試 |
| 5. 全面部署（Rollout） | 系統整合、使用者訓練、正式上線 |
| 6. 監控與迭代（Monitor & Iterate） | 持續監控模型效能、資料漂移（Data Drift）、偏誤 |

---

### 生成式 AI 六大風險

| 風險 | 英文 | 說明 | 緩解方式 |
|------|------|------|----------|
| 幻覺 | Hallucination | 模型生成不正確或捏造的資訊 | RAG、事實查核、人工審核 |
| 著作權侵犯 | Copyright Infringement | 生成內容可能侵犯訓練資料的著作權 | 使用授權資料、法務審查 |
| 隱私洩漏 | Privacy Leakage | 模型可能記憶並洩漏訓練資料中的個資 | 差分隱私、資料去識別化 |
| 偏見放大 | Bias Amplification | 模型放大訓練資料中的歧視性偏見 | 偏見審計、多元訓練資料 |
| 惡意使用 | Misuse / Jailbreak | 生成有害內容、詐騙文字、武器資訊 | 護欄（Guardrails）、內容過濾 |
| 過度依賴 | Over-reliance | 用戶對 AI 輸出未加批判性思考即接受 | 使用者教育、顯示信心分數 |

---

### 成本效益分析框架

| 類別 | 項目 |
|------|------|
| 成本面 | 系統建置費、授權費、雲端算力、資料標注、人員訓練、維護費用 |
| 效益面 | 人工成本節省、生產效率提升、錯誤率降低、客戶滿意度提升、新商業模式創造 |
| 計算指標 | ROI = (總效益 − 總成本) / 總成本 × 100%；投資回收期（Payback Period）|
| 難量化效益 | 品牌形象提升、員工工作滿意度、決策品質改善 |

---

## 易混淆比較總表

| 比較對象 | 左側 | 右側 | 關鍵差異 |
|----------|------|------|----------|
| **AI vs ML vs DL** | AI（最廣）⊃ ML（統計學習）⊃ DL（深度神經網路） | — | DL 是 ML 的子集，ML 是 AI 的子集 |
| **監督式 vs 非監督式 vs 強化學習** | 監督：有標籤 (X,Y) | 非監督：只有 X；強化：獎懲信號 | 資料類型與學習目標不同 |
| **CNN vs RNN vs Transformer** | CNN：空間特徵，影像擅長 | RNN：序列，有梯度消失問題；Transformer：自注意力，可平行 | 適用資料型態與架構設計不同 |
| **BERT vs GPT** | BERT：雙向編碼器，理解任務（填空、分類）| GPT：單向解碼器，生成任務（自迴歸生成） | 一個擅長理解，一個擅長生成 |
| **Precision vs Recall** | Precision = TP/(TP+FP)，衡量預測為正的準確性 | Recall = TP/(TP+FN)，衡量實際為正的覆蓋率 | 偽陽性 vs 偽陰性的取捨 |
| **Overfitting vs Underfitting** | Overfitting：訓練準確率高，測試準確率低（模型太複雜）| Underfitting：訓練和測試準確率都低（模型太簡單）| 偏差-方差取捨（Bias-Variance Tradeoff）|
| **No-Code vs Low-Code** | No-Code：零程式碼，視覺化操作 | Low-Code：少量程式碼，提供更高彈性 | 目標用戶技術能力不同 |
| **GDPR vs 台灣個資法** | GDPR：EU 法規，域外效力，罰款高達 2000 萬歐元或全球營收 4% | 台灣個資法：適用台灣境內，罰則相對較輕 | 適用範圍、罰則強度不同 |
| **差分隱私 vs 聯邦學習** | 差分隱私：在資料/輸出中加入隨機噪音 | 聯邦學習：資料不離開本地，只上傳模型參數 | 兩者可同時使用，保護層次不同 |
| **GAN vs VAE vs Diffusion** | GAN：對抗訓練，生成品質高但訓練不穩定 | VAE：機率潛空間，訓練穩定但輸出稍模糊；Diffusion：逐步去噪，品質最高但速度最慢 | 訓練穩定性與生成品質的取捨 |

---

> 祝考試順利！記得：**理解原理 > 死背術語**。遇到不確定的題目，先排除明顯錯誤選項，再從概念邏輯推導答案。
