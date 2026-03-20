---
title: "多模態 AI：讓 AI 同時看懂文字、圖片和聲音"
order: 30
stage: "生成式 AI 進階"
stageOrder: 9
courseId: "L11401"
summary: "什麼是多模態 AI？CLIP、DALL-E、GPT-4V、Gemini 怎麼整合不同資料型態？"
---

## 一、學習目標

完成本單元後，你將能夠：

1. 說明「多模態 AI（Multimodal AI）」的定義，以及為何它比單模態更貼近真實世界
2. 解釋 Joint Embedding、Cross-Attention、Contrastive Learning 三大核心技術
3. 描述 CLIP 的訓練方式與零樣本分類（Zero-shot Classification）能力
4. 比較 CLIP、DALL-E、GPT-4V、Gemini、Flamingo 五大代表模型
5. 列舉多模態 AI 的主要應用場景與當前技術挑戰

---

## 二、核心內容

### 1. 什麼是多模態 AI（Multimodal AI）？

「模態（Modality）」指的是資料的型態：文字、圖片、聲音、影片、感測器數據……都是不同的模態。

**單模態 AI（Unimodal AI）** 只能處理一種資料型態。例如 GPT-2 只吃文字，傳統影像分類模型只看圖片。

**多模態 AI（Multimodal AI）** 可以同時接收、理解並生成多種型態的資料，就像人類：我們看電影時同時用眼睛看畫面、用耳朵聽聲音、用大腦讀字幕，這三條資訊流在腦中融合成一體的理解。

| 模態 | 範例資料 | 對應 AI 技術 |
|------|----------|------------|
| 文字（Text） | 新聞、書籍、程式碼 | LLM、BERT、GPT |
| 圖片（Image） | 照片、X 光、衛星影像 | CNN、ViT |
| 聲音（Audio） | 語音、音樂 | Whisper、WaveNet |
| 影片（Video） | YouTube、監視器畫面 | Video Transformer |
| 結構化資料（Structured） | 表格、感測器 | TabNet、GBM |

**生活類比**：單模態 AI 就像一個只能閱讀文字卻看不到圖片的人——面對圖文並茂的書本，他只能理解一半。多模態 AI 則像正常人，文字、圖片、聲音一起處理，理解才完整。

---

### 2. 為什麼多模態很重要？

現實世界本身就是多模態的。醫生診斷時要同時看影像、讀病歷、聽患者描述；自駕車要同時接收攝影機畫面、雷達訊號、地圖資訊。若 AI 只能處理單一模態，就會在現實應用中「有所盲點」。

| 限制 | 單模態 AI 的困境 | 多模態 AI 的解法 |
|------|----------------|----------------|
| **資訊不完整** | 光看圖片無法理解情境脈絡 | 圖文搭配，補足語意 |
| **跨模態推理** | 「這張照片的說明是否正確？」無法回答 | 對齊圖片與文字語意後可判斷 |
| **生成多樣性** | 只能輸出文字，無法生成圖片 | 文字→圖片、圖片→文字都能做 |
| **零樣本泛化** | 新類別需要重新標注訓練資料 | CLIP 等模型可直接遷移 |

> **考試重點**：多模態 AI 的核心價值是「讓 AI 處理更接近現實世界的複雜輸入」，其能力來自跨模態的語意對齊（Semantic Alignment）。

---

### 3. 三大核心技術

#### 技術一：Joint Embedding（聯合嵌入空間）

**核心思想**：將不同模態的資料，透過各自的 Encoder，投影到「同一個向量空間（Shared Vector Space）」。在這個空間裡，語意相近的圖片和文字會距離很近。

```
圖片 "一隻狗" → Image Encoder → [0.8, 0.2, 0.5, ...]
文字 "a dog"  → Text Encoder  → [0.7, 0.3, 0.4, ...]
                                  ↑ 兩個向量在空間中很接近！
```

**生活類比**：就像把世界上所有語言的「蘋果」這個詞，全部翻譯成世界語（Esperanto）的同一個詞。不管原來是中文「蘋果」、英文「apple」或日文「りんご」，在世界語空間裡都指向同一個意義——多模態的 Joint Embedding 就是為圖片和文字建立這樣的「通用語義語言」。

| 組成 | 說明 |
|------|------|
| Image Encoder | 通常為 CNN 或 ViT，將圖片轉為向量 |
| Text Encoder | 通常為 Transformer，將文字轉為向量 |
| Shared Vector Space | 兩個 Encoder 的輸出空間維度相同，語意對齊 |
| 相似度度量 | 通常用餘弦相似度（Cosine Similarity） |

---

#### 技術二：Cross-Attention（跨模態注意力）

**核心思想**：讓一個模態的 Query，去關注（Attend）另一個模態的 Key 和 Value。例如：讓文字的 Query 去關注圖片每個區域的 Key，找出「這句話描述的是圖片的哪個部分」。

**生活類比**：想像你一邊看照片一邊讀說明文字。當你讀到「左上角有一隻貓」，你的眼睛自然會飄向圖片左上角去確認——這個「讀文字時回頭看圖」的動作，就是 Cross-Attention 在做的事。

```
文字 Query：「貓在哪裡？」
圖片 Key/Value：[左上角向量] [右下角向量] [中央向量] ...
→ Attention Weight：左上角 0.85，其他區域 < 0.05
→ 輸出：左上角圖像特徵（貓的視覺資訊）
```

| 應用場景 | 說明 |
|----------|------|
| 圖文問答（Visual QA） | 文字問題關注圖片相關區域 |
| 圖像說明生成（Image Captioning） | 逐詞生成時關注對應圖像區塊 |
| 多模態翻譯 | 語音 Query 關注影片畫面 Key |

---

#### 技術三：Contrastive Learning（對比學習）

**核心思想**：給模型大量的「正確配對（Positive Pairs）」和「錯誤配對（Negative Pairs）」，訓練模型讓正確配對的向量彼此靠近、錯誤配對的向量彼此遠離。

**CLIP 的對比學習方式**：

```
Batch 中有 N 張圖片和 N 段文字說明：
- 正確配對（對角線）：圖1-文1、圖2-文2、...圖N-文N → 距離拉近
- 錯誤配對（非對角線）：圖1-文2、圖1-文3、... → 距離推遠
```

**生活類比**：就像學習「這張照片配這段話是對的，那張照片配那段話是錯的」——做了幾億次這樣的練習之後，模型自然就學會了什麼叫做圖文語意的吻合。

| 訓練目標 | 操作 |
|----------|------|
| 正對（Positive Pair）距離最小化 | 相符圖文的 Embedding 餘弦相似度趨近 1 |
| 負對（Negative Pair）距離最大化 | 不相符圖文的 Embedding 餘弦相似度趨近 0 或 -1 |
| 損失函數 | InfoNCE Loss（一種對比損失） |

---

### 4. 代表模型比較

#### CLIP（OpenAI，2021）

CLIP（Contrastive Language-Image Pre-training）是多模態 AI 的里程碑模型，使用 4 億對圖文資料，以對比學習方式訓練出強大的圖文對齊能力。

**CLIP 最驚人的能力：Zero-shot Classification（零樣本分類）**

不需要任何分類訓練資料，只要給出類別的文字描述，CLIP 就能分類圖片：

```
輸入圖片：[一張貓的照片]
候選文字：["a photo of a cat", "a photo of a dog", "a photo of a car"]
→ 計算圖片向量與每段文字向量的餘弦相似度
→ 相似度最高的文字 = 分類結果："a photo of a cat"
```

**生活類比**：CLIP 就像一個從來沒上過特定課程、但英語超好的學生，考試時靠著理解題目文字就能答對——因為他的「理解能力」已超越記憶特定答案的層次。

---

#### DALL-E（OpenAI，系列模型）

DALL-E 將 CLIP 的文字理解能力結合擴散模型（Diffusion Model），實現「文字→圖片」的生成。

| 版本 | 技術基礎 | 特色 |
|------|----------|------|
| DALL-E 1（2021） | CLIP + dVAE | 首次展示文字生圖的強大能力 |
| DALL-E 2（2022） | CLIP + DDPM | 解析度更高、更符合語義 |
| DALL-E 3（2023） | 整合 ChatGPT 重寫 Prompt | 遵循複雜指令的能力大幅提升 |

> **考試重點**：DALL-E 的核心原理是「先用 CLIP 的 Text Encoder 理解文字語意，再用 Diffusion Model 生成對應圖片」，是文字到圖片生成（Text-to-Image Generation）的代表。

---

#### GPT-4V（OpenAI，2023）

GPT-4V（V = Vision）在 GPT-4 的語言能力基礎上，加入視覺輸入能力，可接受圖片與文字的混合輸入（Multimodal Input），進行視覺推理、圖表解讀、圖文問答。

**GPT-4V 能力範例：**

| 輸入 | GPT-4V 的輸出 |
|------|--------------|
| 數學題照片 | 理解題目並逐步解題 |
| 圖表截圖 | 分析趨勢、提取數字 |
| 程式碼截圖 | 找出 Bug 並說明 |
| 料理照片 | 猜測食材、建議食譜 |

---

#### Gemini（Google DeepMind，2023）

Gemini 是 Google 推出的原生多模態（Natively Multimodal）大型模型，從訓練階段就整合文字、圖片、音頻、影片與程式碼，而非事後「拼接」視覺模組。

| 特性 | 說明 |
|------|------|
| 原生多模態 | 訓練時就同時接收多種模態，而非後期整合 |
| 三種版本 | Ultra、Pro、Nano（效能與裝置大小分層） |
| 長上下文 | 支援超長 Context Window（最高 100 萬 Token） |
| 競爭對手 | 直接對標 GPT-4V |

**「原生多模態」vs「後期整合」類比**：Gemini 就像從小同時學中、英、日三語長大的人（各語言融為一體的思維）；GPT-4V 則更像先精通英語、後來再加裝翻譯模組的人——兩者都能做多語工作，但底層架構不同。

---

#### Flamingo（DeepMind，2022）

Flamingo 是 Few-shot Multimodal Learning（少樣本多模態學習）的代表，可在 Prompt 中混入圖片與文字，僅憑幾個範例就能完成新任務。

```
Few-shot Prompt 範例：
[圖1：貓] → "this is a cat"
[圖2：狗] → "this is a dog"
[圖3：未知動物] → 模型輸出："this is a rabbit"
```

---

### 5. 主要應用場景

| 應用 | 說明 | 代表產品 |
|------|------|---------|
| **圖像說明生成（Image Captioning）** | 自動為圖片產生文字描述 | Google Photos |
| **視覺問答（Visual QA）** | 回答關於圖片內容的自然語言問題 | GPT-4V |
| **文字生成圖片（Text-to-Image）** | 輸入描述文字，輸出圖片 | DALL-E 3、Midjourney |
| **文字生成影片（Text-to-Video）** | 輸入描述，輸出影片 | Sora（OpenAI）、Kling |
| **圖片引導文字生成** | 上傳圖片作為參考，生成相關文字 | Claude、Gemini |
| **多模態搜尋** | 用文字搜圖、用圖搜圖或圖文混搜 | Google Lens、Pinterest |
| **醫療影像分析** | 結合影像與病歷文字做診斷輔助 | Med-PaLM M |

**Sora 類比**：如果說 DALL-E 是「把文字變成一張照片的攝影師」，那 Sora 就是「把文字變成一部短片的導演」——它不只要生成每一幀畫面，還要維持前後幀的時間一致性（Temporal Consistency）。

---

### 6. 技術挑戰

| 挑戰 | 說明 |
|------|------|
| **跨模態對齊（Alignment）** | 不同模態的語意對應並非一對一，例如「熱」這個詞對應的圖片可能是火、太陽或溫度計 |
| **計算成本（Computational Cost）** | 多模態訓練需要大量 GPU 資源，推論成本也高 |
| **資料收集困難** | 高品質的配對資料（如圖文配對、影音字幕）稀缺且版權複雜 |
| **幻覺問題（Hallucination）** | 模型可能「看圖說瞎話」，描述圖片中不存在的內容 |
| **時序建模（Temporal Modeling）** | 影片含時間維度，比靜態圖片更難建模 |

---

## 三、關鍵名詞中英對照

| 中文 | 英文 | 說明 |
|------|------|------|
| 多模態 AI | Multimodal AI | 能同時處理多種資料型態（文字、圖片、聲音等）的 AI |
| 模態 | Modality | 資料的型態，如文字、影像、音頻 |
| 聯合嵌入空間 | Joint Embedding Space | 將不同模態映射至同一向量空間的技術 |
| 跨模態注意力 | Cross-Attention | 讓一個模態的 Query 關注另一個模態的 Key/Value |
| 對比學習 | Contrastive Learning | 拉近正確配對、推遠錯誤配對的訓練方式 |
| 零樣本分類 | Zero-shot Classification | 不需標注資料，靠語意對齊直接分類新類別 |
| 圖文對齊 | Image-Text Alignment | 使圖片與對應文字在向量空間中靠近的技術 |
| 文字生成圖片 | Text-to-Image Generation | 以文字描述作為條件生成圖片 |
| 文字生成影片 | Text-to-Video Generation | 以文字描述作為條件生成影片 |
| 視覺問答 | Visual Question Answering (VQA) | 針對圖片內容回答自然語言問題的任務 |
| 圖像說明生成 | Image Captioning | 自動為圖片產生文字描述 |
| 原生多模態 | Natively Multimodal | 訓練階段就整合多種模態，非後期拼接 |
| 少樣本學習 | Few-shot Learning | 只需少數範例即可完成新任務 |
| 時間一致性 | Temporal Consistency | 影片前後幀在視覺與語意上保持連貫 |
| 幻覺 | Hallucination | 模型生成與事實不符的描述或內容 |

---

## 四、考試重點提示

> **考試重點**：以下是 iPAS 人工智慧考試中與多模態 AI 相關的高頻考點：

1. **多模態的定義**：能同時處理兩種以上資料型態（文字、圖片、聲音、影片）的 AI 系統
2. **Joint Embedding 的核心概念**：將不同模態映射到同一向量空間，使語意相近的圖文向量距離接近
3. **CLIP 的訓練方式**：對比學習（Contrastive Learning），以圖文正負配對訓練圖文對齊
4. **CLIP 的零樣本分類能力**：不需額外訓練，靠圖文相似度直接分類新類別
5. **DALL-E 的生成原理**：CLIP Text Encoder（理解文字）+ Diffusion Model（生成圖片）
6. **GPT-4V vs Gemini 的差異**：GPT-4V 是後期加入視覺能力，Gemini 是原生多模態設計
7. **Cross-Attention 的意義**：讓文字 Query 去關注圖片中對應的 Key/Value 區域
8. **多模態挑戰**：跨模態對齊困難、幻覺問題、計算成本高是三大核心挑戰

---

<div class="quiz-divider"><span>隨堂小測驗</span></div>

**Q1.** 下列哪個模型是以「對比學習（Contrastive Learning）」訓練圖文對齊的代表？

- A. GPT-2
- B. BERT
- C. CLIP
- D. AlphaGo

---

**Q2.** CLIP 能夠進行「零樣本分類（Zero-shot Classification）」的原因是？

- A. 模型參數量非常大，記住了所有類別
- B. 透過圖文向量在共享空間中的相似度比對，不需要額外標注資料
- C. 使用了強化學習讓模型自我改進
- D. 採用了 Masked Language Model 預訓練

---

**Q3.** 「Cross-Attention（跨模態注意力）」與「Self-Attention（自注意力）」最主要的差異是？

- A. Cross-Attention 只能處理文字，Self-Attention 只能處理圖片
- B. Cross-Attention 的 Query 與 Key/Value 來自不同模態，Self-Attention 的 Q、K、V 來自同一模態
- C. Cross-Attention 不使用 Softmax，Self-Attention 才使用
- D. Cross-Attention 只能用於解碼器，Self-Attention 只能用於編碼器

---

**Q4.** 下列關於 Gemini 的描述，何者正確？

- A. Gemini 是 OpenAI 推出的多模態模型
- B. Gemini 是後期將視覺模組拼接至語言模型的架構
- C. Gemini 是 Google DeepMind 推出的原生多模態模型，訓練時就整合多種模態
- D. Gemini 只能處理文字與圖片，不支援音頻或影片

---

**Q5.** DALL-E 生成圖片的核心技術組合為何？

- A. RNN + GAN
- B. BERT + VAE
- C. CLIP（文字理解）+ Diffusion Model（圖片生成）
- D. ResNet + Transformer Decoder

---

### 解答與解析

| 題號 | 答案 | 解析 |
|------|------|------|
| Q1 | **C** | CLIP（Contrastive Language-Image Pre-training）是對比學習在圖文對齊上最具代表性的模型，以正負配對訓練 Image Encoder 與 Text Encoder 輸出的向量彼此對齊。 |
| Q2 | **B** | CLIP 的零樣本分類能力來自圖文共享向量空間——將圖片向量與各類別的文字描述向量做餘弦相似度比對，取最高分即為分類結果，不需要額外的標注訓練資料。 |
| Q3 | **B** | Cross-Attention 中 Query 來自一個模態（如文字），Key 與 Value 來自另一個模態（如圖片），實現跨模態資訊融合；Self-Attention 則是 Q、K、V 全來自同一序列內部。 |
| Q4 | **C** | Gemini 是 Google DeepMind 推出，最大特色是「原生多模態（Natively Multimodal）」——從訓練階段就同時接收文字、圖片、音頻、影片，而非事後拼接視覺能力。 |
| Q5 | **C** | DALL-E 的核心流程是：先以 CLIP 的 Text Encoder 將文字描述轉為語意向量，再以 Diffusion Model（擴散模型）以該語意向量為條件逐步去噪生成圖片。 |
