---
title: "模擬考題特訓（一）：AI 基礎概論 25 題"
order: 48
stage: "總複習與模擬考"
stageOrder: 14
courseId: "L11"
summary: "涵蓋 AI 定義分類、治理法規、資料處理分析、機器學習概念——25 題模擬測驗 + 完整解析。"
---

## 說明

本模擬考卷對應 **L11（AI 基礎概論）** 範圍，涵蓋以下主題：

- AI 定義、歷史沿革與分類（弱 AI、強 AI、Turing Test）
- AI 治理原則與法規框架（NIST RMF、EU AI Act）
- 資料概念、資料集分割與資料管線
- 資料隱私與安全（GDPR、差分隱私、聯邦學習）
- 機器學習核心概念（監督/非監督/強化、過擬合、損失函數、CNN/RNN/Transformer）

每題皆為單選題，建議先獨立作答後再對照解析。

---

<div class="quiz-divider"><span>模擬考題 — AI 基礎概論</span></div>

**Q1．** 1950 年，Alan Turing 在論文中提出用以判斷機器是否具有智慧的測試方法，該方法現稱為：

- (A) 達特茅斯測試（Dartmouth Test）
- (B) 圖靈測試（Turing Test）
- (C) 中文房間實驗（Chinese Room）
- (D) 圖靈完備性（Turing Completeness）

---

**Q2．** 1956 年哪一場學術研討會被公認為 AI 作為學術領域正式誕生的起點？

- (A) 麻省理工學院 AI 研討會
- (B) 達特茅斯暑期研究計畫（Dartmouth Summer Research Project）
- (C) 史丹佛 AI 實驗室成立大會
- (D) IEEE 計算機視覺年會

---

**Q3．** 下列關於「弱 AI（Narrow AI）」與「強 AI（General AI / AGI）」的描述，何者正確？

- (A) 弱 AI 指運算速度較慢的 AI 系統
- (B) 強 AI 已在商業產品中廣泛部署
- (C) 弱 AI 專精於特定任務，強 AI 具備跨領域的通用智慧能力
- (D) 弱 AI 和強 AI 僅差別在使用的硬體規格

---

**Q4．** Russell & Norvig 在《Artificial Intelligence: A Modern Approach》中，以哪兩個維度來分類 AI 系統的設計目標？

- (A) 速度 vs. 準確率
- (B) 思考（Thinking）vs. 行動（Acting），理性（Rationally）vs. 像人類（Humanly）
- (C) 監督學習 vs. 非監督學習
- (D) 符號推理 vs. 神經網路

---

**Q5．** 下列哪一項技術最接近「超級 AI（Superintelligence）」的定義？

- (A) 能下圍棋的 AlphaGo
- (B) 能生成文字的 ChatGPT
- (C) 在所有認知任務上全面超越人類的假想系統
- (D) 搭載多個深度學習模型的自駕車系統

---

**Q6．** 以下哪一組是 Google 所提出的「負責任 AI（Responsible AI）」七大原則中明確涵蓋的項目？（選最完整者）

- (A) 速度最大化、成本最小化
- (B) 公平性（Fairness）、可解釋性（Interpretability）、隱私保護（Privacy）
- (C) 最大利潤、最小人力、最高準確率
- (D) 開放原始碼、跨平台相容、雲端部署

---

**Q7．** NIST AI Risk Management Framework（AI RMF）的四個核心功能依序為：

- (A) 收集（Collect）→ 訓練（Train）→ 部署（Deploy）→ 監控（Monitor）
- (B) 治理（Govern）→ 映射（Map）→ 量測（Measure）→ 管理（Manage）
- (C) 識別（Identify）→ 保護（Protect）→ 偵測（Detect）→ 回應（Respond）
- (D) 規劃（Plan）→ 執行（Do）→ 檢核（Check）→ 行動（Act）

---

**Q8．** 歐盟 AI Act 將 AI 系統依風險等級分類，下列哪一類別需要最嚴格的合規要求（包含強制第三方稽核）？

- (A) 最小風險（Minimal Risk）
- (B) 有限風險（Limited Risk）
- (C) 高風險（High Risk）
- (D) 不可接受風險（Unacceptable Risk）

---

**Q9．** 根據 EU AI Act，下列哪項應用屬於「不可接受風險」而被禁止？

- (A) 醫療影像輔助診斷系統
- (B) 電影推薦演算法
- (C) 政府在公共場所進行即時大規模生物特徵辨識監控
- (D) 自動駕駛輔助系統

---

**Q10．** AI 治理框架中「可問責性（Accountability）」原則主要要求：

- (A) AI 模型必須開放原始碼
- (B) 明確界定 AI 系統的責任歸屬，確保人為監督機制存在
- (C) 所有 AI 決策必須由人工逐一審核
- (D) AI 系統不得使用個人資料

---

**Q11．** 下列哪一種資料類型屬於「非結構化資料（Unstructured Data）」？

- (A) 關聯式資料庫中的交易紀錄
- (B) CSV 格式的銷售報表
- (C) 社群媒體上的貼文文字與圖片
- (D) 政府公開的統計年報 Excel 檔

---

**Q12．** 在機器學習專案中，將資料集分為訓練集（Training set）、驗證集（Validation set）、測試集（Test set）的主要目的是：

- (A) 減少資料儲存所需的空間
- (B) 分別用於模型學習、超參數調整與最終效能評估，避免資訊洩漏
- (C) 滿足法規對資料備份的要求
- (D) 讓不同部門各自管理一份資料

---

**Q13．** 資料管線（Data Pipeline）中「特徵工程（Feature Engineering）」步驟的主要目的是：

- (A) 將資料上傳至雲端儲存
- (B) 建立模型的網路架構
- (C) 從原始資料中萃取、轉換並創造對模型有預測力的輸入變數
- (D) 評估模型在測試集上的準確率

---

**Q14．** 以下哪一種情況屬於「資料洩漏（Data Leakage）」問題？

- (A) 訓練資料量太少導致模型欠擬合
- (B) 在特徵工程時使用了測試集的統計資訊（如全體資料的均值）來標準化訓練資料
- (C) 模型使用了過多特徵導致過擬合
- (D) 類別不平衡導致模型預測偏向多數類

---

**Q15．** 資料管線中「資料清理（Data Cleaning）」涵蓋的任務不包含下列哪項？

- (A) 處理缺失值（Missing Values）
- (B) 移除重複記錄（Duplicate Records）
- (C) 訓練神經網路模型
- (D) 修正格式錯誤（Format Errors）

---

**Q16．** 「差分隱私（Differential Privacy）」的核心機制是：

- (A) 將資料加密後傳輸至雲端
- (B) 在資料或查詢結果中加入校準過的隨機雜訊，使個別記錄無法被識別
- (C) 將資料分散儲存於多個節點
- (D) 要求使用者簽署資料使用同意書

---

**Q17．** 「聯邦學習（Federated Learning）」的主要優點是：

- (A) 模型訓練速度比集中式訓練快十倍
- (B) 不需要任何標記資料即可訓練模型
- (C) 原始資料留在本地設備，僅上傳模型梯度更新，保護資料隱私
- (D) 可以自動生成高品質的合成資料

---

**Q18．** 根據 GDPR，個人資料當事人擁有的「被遺忘權（Right to Erasure）」是指：

- (A) 要求企業刪除其個人資料的權利
- (B) 要求企業提供其個人資料副本的權利
- (C) 拒絕被自動化決策影響的權利
- (D) 要求修正不正確個人資料的權利

---

**Q19．** 對抗攻擊（Adversarial Attack）中的「逃脫攻擊（Evasion Attack）」是指：

- (A) 在訓練階段投毒，使模型學到錯誤模式
- (B) 在推論階段對輸入加入人眼難以察覺的擾動，誘使模型產生錯誤分類
- (C) 竊取模型的架構與權重
- (D) 從模型輸出反推訓練資料

---

**Q20．** 以下哪一措施最能有效防範「模型反轉攻擊（Model Inversion Attack）」？

- (A) 對訓練資料進行資料增強
- (B) 增加模型層數
- (C) 限制模型 API 輸出的精度並套用差分隱私
- (D) 使用更大的訓練資料集

---

**Q21．** 下列關於三種機器學習典範的描述，何者正確？

- (A) 非監督學習（Unsupervised Learning）需要標記的訓練資料
- (B) 強化學習（Reinforcement Learning）透過與環境互動並根據獎懲訊號學習策略
- (C) 監督學習（Supervised Learning）不需要任何人工標記
- (D) 半監督學習（Semi-supervised Learning）是強化學習的子集

---

**Q22．** 當模型在訓練集上表現極佳，但在測試集上表現顯著下滑，此現象稱為：

- (A) 欠擬合（Underfitting）
- (B) 資料偏移（Data Shift）
- (C) 過擬合（Overfitting）
- (D) 梯度消失（Vanishing Gradient）

---

**Q23．** 在分類任務中，「交叉熵損失函數（Cross-Entropy Loss）」主要量測的是：

- (A) 預測值與真實值之間的均方差
- (B) 模型預測的機率分佈與真實標籤分佈之間的差異
- (C) 模型參數的 L2 範數
- (D) 特徵之間的相關係數

---

**Q24．** 卷積神經網路（Convolutional Neural Network, CNN）最擅長處理哪類資料？

- (A) 時間序列資料（Time Series）
- (B) 具有空間結構的資料，如影像（Images）
- (C) 純文字的語意推論
- (D) 表格式結構化資料（Tabular Data）

---

**Q25．** Transformer 架構相較於 RNN 最主要的突破是：

- (A) 使用更多層的卷積操作
- (B) 引入自注意力機制（Self-Attention），可平行處理序列中所有位置，解決長距離依賴問題
- (C) 完全不需要訓練資料
- (D) 使用強化學習取代反向傳播

---

## 解答與解析

| 題號 | 答案 | 解析 |
|------|------|------|
| Q1 | **(B)** | Alan Turing 於 1950 年發表「Computing Machinery and Intelligence」，提出以對話測試機器智慧的方法，後人稱之為圖靈測試（Turing Test）。中文房間（C）是 John Searle 1980 年提出用來質疑圖靈測試的思想實驗。 |
| Q2 | **(B)** | 1956 年夏，John McCarthy、Marvin Minsky 等人在達特茅斯學院舉辦為期兩個月的研討會，正式提出「Artificial Intelligence」一詞，被視為 AI 領域誕生的起點。 |
| Q3 | **(C)** | 弱 AI（Narrow AI）只能處理特定任務（如下棋、影像辨識）；強 AI（AGI）具備人類等級的通用推理能力，目前仍是研究目標，尚未實現商業部署。 |
| Q4 | **(B)** | Russell & Norvig 以「思考 vs. 行動」和「理性 vs. 像人類」兩個維度建立 2×2 矩陣，定義四種 AI 設計目標，是 AI 教科書中的經典分類架構。 |
| Q5 | **(C)** | 超級 AI（Superintelligence）是指在所有認知任務上全面超越人類的假想系統，由 Nick Bostrom 等人討論，AlphaGo 和 ChatGPT 均屬弱 AI。 |
| Q6 | **(B)** | Google Responsible AI Practices 強調公平性、可解釋性、隱私保護、安全性、問責性、避免傷害等原則。(A)(C)(D) 均為商業或工程目標，非治理原則。 |
| Q7 | **(B)** | NIST AI RMF 的四個核心功能為：治理（Govern）、映射（Map）、量測（Measure）、管理（Manage）。(C) 是 NIST Cybersecurity Framework 的功能。 |
| Q8 | **(C)** | EU AI Act 高風險（High Risk）類別（如招聘、信用評分、關鍵基礎設施）需強制第三方稽核、透明度義務與上市前合規評估。不可接受風險（D）是直接禁用，不涉及合規流程。 |
| Q9 | **(C)** | EU AI Act 明確禁止政府在公共場所進行即時、大規模遠端生物特徵識別（Real-time Remote Biometric Identification），屬不可接受風險。 |
| Q10 | **(B)** | 可問責性要求明確定義 AI 系統開發者、部署者與使用者的責任歸屬，並確保人為監督（Human Oversight）機制，而非要求逐筆人工審核。 |
| Q11 | **(C)** | 非結構化資料指沒有預先定義格式的資料，社群媒體貼文、圖片、影片均屬此類。(A)(B)(D) 均為具固定欄位格式的結構化資料。 |
| Q12 | **(B)** | 訓練集用於模型參數學習；驗證集用於超參數調整（如選擇學習率、決定提早停止）；測試集僅用於最終評估，不參與任何訓練決策，以確保評估結果不受污染。 |
| Q13 | **(C)** | 特徵工程的目標是從原始資料中產生對模型預測力最強的輸入特徵，包含特徵選取（Selection）、轉換（Transformation）與新特徵建構（Construction）。 |
| Q14 | **(B)** | 用全體資料的統計量（如均值、標準差）對訓練資料進行標準化，會將測試集的資訊「洩漏」至訓練過程，正確做法是只用訓練集的統計量。 |
| Q15 | **(C)** | 資料清理處理缺失值、重複記錄、格式錯誤、異常值等問題，訓練神經網路是模型建構步驟，不屬於資料清理範疇。 |
| Q16 | **(B)** | 差分隱私透過加入 Laplace 或 Gaussian 雜訊，使攻擊者無法藉由查詢結果判斷特定個人是否出現在資料集中，同時保持統計查詢的近似正確性。 |
| Q17 | **(C)** | 聯邦學習讓各裝置（如手機）在本地訓練，僅傳送梯度更新（Gradient Updates）至中央伺服器彙整，原始資料不離開設備，有效保護使用者隱私。 |
| Q18 | **(A)** | GDPR 第 17 條賦予當事人「被遺忘權（Right to Erasure）」，即要求資料控管者在特定情況下刪除其個人資料。提供副本是(B)資料可攜權，修正是(D)更正權。 |
| Q19 | **(B)** | 逃脫攻擊（Evasion Attack）在推論階段對輸入加入微小擾動（Perturbation），使 AI 誤判，如讓停止標誌被辨識為限速標誌。(A) 是投毒攻擊，(C) 是模型竊取，(D) 是成員推斷攻擊。 |
| Q20 | **(C)** | 限制 API 輸出精度（如只回傳 Top-K 結果而非完整機率）並結合差分隱私，可降低攻擊者從模型輸出反推訓練資料的能力。 |
| Q21 | **(B)** | 強化學習透過 Agent 與環境互動，依據獎勵（Reward）與懲罰（Penalty）訊號更新策略（Policy），不需標記資料。(A) 錯誤：非監督學習不需標記；(C) 錯誤：監督學習需要標記。 |
| Q22 | **(C)** | 訓練集表現好、測試集表現差，是過擬合（Overfitting）的典型症狀，代表模型記住了訓練資料的雜訊而非學到可泛化的規律。 |
| Q23 | **(B)** | 交叉熵損失量測模型輸出的機率分佈（如 Softmax 後的結果）與 One-hot 真實標籤之間的資訊差異，數值越低代表預測越接近真實標籤。(A) 是均方誤差（MSE）。 |
| Q24 | **(B)** | CNN 透過卷積核（Convolutional Kernel）擷取局部空間特徵，特別適合影像、影片等具有二維空間結構的資料。(A) 適合 RNN/LSTM，(C) 適合 Transformer。 |
| Q25 | **(B)** | Transformer 的自注意力機制允許模型在處理序列時同時關注所有位置，並行計算效率遠高於 RNN 的逐步處理，同時有效捕捉長距離依賴關係，是 GPT、BERT 等大型語言模型的基礎架構。 |
