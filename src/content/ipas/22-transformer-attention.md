---
title: "Transformer 與 Attention 機制：現代 AI 的核心引擎"
order: 22
stage: "機器學習進階"
stageOrder: 8
courseId: "L11302"
summary: "為什麼 Transformer 取代了 RNN？Self-Attention 怎麼運作？Q、K、V 是什麼？圖解帶你搞懂。"
---

## 一、學習目標

完成本單元後，你將能夠：

1. 說明 Transformer 取代 RNN 的三大核心原因
2. 用 Q、K、V 類比解釋 Self-Attention 的運作流程
3. 計算 Attention Score 的步驟（QKᵀ / √d_k → Softmax → 加權和）
4. 比較 Multi-Head Attention 與單一 Attention 的差異
5. 分辨 BERT、GPT、T5 的架構與適用場景

---

## 二、核心內容

### 1. 為什麼 Transformer 取代了 RNN？

在 Transformer 出現之前，處理序列資料（文字、語音）的主流是 RNN（Recurrent Neural Network）與其變體 LSTM。但 RNN 有三個致命缺點：

| 問題 | RNN 的困境 | Transformer 的解法 |
|------|-----------|-------------------|
| **梯度消失（Vanishing Gradient）** | 長序列訓練時，早期資訊的梯度趨近於零，模型「忘記」開頭 | Self-Attention 直接連結任意兩個位置，梯度路徑短 |
| **無法平行運算（Sequential Processing）** | 必須一步一步處理，t 時刻依賴 t-1 時刻，GPU 難以充分利用 | 所有位置同時計算，可完整平行化 |
| **長程依賴困難（Long-range Dependency）** | 句子很長時，句首的主詞很難影響句尾的動詞 | Attention 權重讓任意兩個 token 直接「對話」 |

> **考試重點**：Transformer 的三大優勢——平行運算、無梯度消失、長程依賴，是最常考的選擇題核心。

**生活類比**：想像你在讀一本很厚的小說。RNN 就像你必須從第一頁逐頁讀到最後，若忘了開頭的角色介紹就麻煩了；Transformer 則像你手上有全書的索引，隨時可以直接跳到任何一頁找相關資訊。

---

### 2. Self-Attention 機制：Q、K、V 是什麼？

Self-Attention 是 Transformer 的靈魂。它讓每個 token（詞）都能「看到」序列中所有其他 token，並決定該關注誰。

**圖書館類比：**

想像你在圖書館查資料：
- **Query（Q，查詢向量）**：你心裡的問題，例如「我想找關於氣候變遷的書」
- **Key（K，鍵向量）**：每本書的書名標籤，用來比對你的問題
- **Value（V，值向量）**：書的實際內容，一旦找到相關書就取出這些內容

Self-Attention 就是：用你的問題（Q）去比對所有書名（K），算出相關程度，再根據相關程度加權取出書的內容（V）。

**數學流程（Scaled Dot-Product Attention）：**

```
Attention(Q, K, V) = softmax( QKᵀ / √d_k ) · V
```

| 步驟 | 操作 | 意義 |
|------|------|------|
| 1. 計算 QKᵀ | 每個 Q 與所有 K 做點積 | 衡量「問題」與每個「書名」的相關程度 |
| 2. 除以 √d_k | 縮放（Scaling） | 防止點積值過大導致 Softmax 梯度消失（d_k 為向量維度） |
| 3. Softmax | 轉換為機率分布（總和為 1） | 得到對每個位置的「注意力權重」 |
| 4. 乘以 V | 加權求和 | 根據注意力權重，整合所有位置的資訊 |

> **考試重點**：縮放因子 √d_k 的用途是「防止點積過大使 Softmax 飽和」，這是易考細節。

---

### 3. Multi-Head Attention：多角度同時觀察

單一 Attention 只能從一個角度關注資訊。Multi-Head Attention 讓模型同時從多個子空間（多個「頭」）觀察序列，最後將所有頭的結果串接（Concatenate）再線性變換。

**生活類比**：就像醫院的會診制度。一位患者同時被心臟科、肺科、神經科醫師各自評估，最後整合所有專科意見做出診斷——每個醫師（Head）關注不同面向，合起來比單一醫師更全面。

```
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) · W_O

其中 head_i = Attention(Q·W_Q_i, K·W_K_i, V·W_V_i)
```

| 特性 | 說明 |
|------|------|
| 每個 Head 有獨立的 W_Q, W_K, W_V | 學習不同的「關注模式」 |
| 典型 Head 數量 | BERT-base: 12 heads，GPT-3: 96 heads |
| 串接後線性投影 | 將多頭資訊整合回原始維度 |

---

### 4. Positional Encoding：給模型「位置感」

Transformer 同時處理所有 token，天生不知道誰在前、誰在後。Positional Encoding（位置編碼）將位置資訊加入 token 的 Embedding。

**生活類比**：想像把一本書的頁面全部打散後交給你，如果沒有頁碼，你根本不知道故事順序。Positional Encoding 就是幫每頁加上頁碼，讓模型知道每個詞在句子中的相對位置。

原始論文使用正弦與餘弦函數：

```
PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

現代模型（如 RoPE、ALiBi）改用可學習的位置編碼以支援更長的序列。

---

### 5. Transformer 架構總覽

Transformer 由 **Encoder（編碼器）** 與 **Decoder（解碼器）** 兩大堆疊組成：

**Encoder 單層結構：**
```
輸入 Embedding + Positional Encoding
    → Multi-Head Self-Attention
    → Add & Layer Norm（殘差連接）
    → Feed-Forward Network（FFN）
    → Add & Layer Norm（殘差連接）
```

**Decoder 單層結構（比 Encoder 多一層）：**
```
目標序列 Embedding + Positional Encoding
    → Masked Multi-Head Self-Attention（遮蔽未來）
    → Add & Layer Norm
    → Cross-Attention（以 Encoder 輸出為 K、V）
    → Add & Layer Norm
    → Feed-Forward Network
    → Add & Layer Norm
```

**殘差連接（Residual Connection）**：每個子層的輸出加上其輸入（x + Sublayer(x)），避免深層網路的梯度消失。就像爬山時設置的安全繩，讓你不會從高處摔落。

**Layer Normalization**：對每個樣本的所有特徵做正規化，穩定訓練過程。

---

### 6. BERT vs GPT vs T5：三大架構比較

| 特性 | BERT | GPT | T5 |
|------|------|-----|----|
| **架構** | Encoder-only | Decoder-only | Encoder-Decoder |
| **注意力方向** | 雙向（Bidirectional） | 單向（Causal/左到右） | 編碼器雙向，解碼器單向 |
| **預訓練任務** | MLM（Masked Language Model）＋NSP | Next Token Prediction | Text-to-Text（所有任務統一格式） |
| **適用場景** | 文本分類、NER、問答（理解任務） | 文字生成、對話、程式碼生成 | 翻譯、摘要、問答（生成任務） |
| **代表模型** | BERT-base/large、RoBERTa | GPT-2、GPT-4、ChatGPT | T5、FLAN-T5 |

**MLM（Masked Language Model）類比**：BERT 的預訓練就像克漏字測驗，隨機遮蔽 15% 的詞，讓模型猜測被遮蔽的詞是什麼，因此可以同時看前後文（雙向）。

**GPT 的 Causal Mask 類比**：GPT 的訓練像接龍遊戲，只能看前面已出現的詞來預測下一個詞，不能「作弊」看後面。

> **考試重點**：BERT = 雙向編碼器 = 理解任務；GPT = 單向解碼器 = 生成任務。這組對比是高頻考點。

---

### 7. 為什麼 Transformer 稱霸現代 AI？

Transformer 架構的成功已遠超 NLP 領域，擴展到：

| 領域 | 應用 | 代表模型 |
|------|------|---------|
| 自然語言處理 | 翻譯、摘要、對話 | GPT-4、BERT、T5 |
| 電腦視覺 | 影像分類、物件偵測 | ViT（Vision Transformer） |
| 語音處理 | 語音辨識、合成 | Whisper |
| 多模態 | 圖文理解與生成 | CLIP、DALL-E、Gemini |
| 蛋白質結構預測 | 生物資訊 | AlphaFold 2 |

核心原因：**可擴展性（Scalability）**。增加模型參數數量（Scale up），在足夠大的資料上訓練，Transformer 的性能幾乎線性提升，這是 RNN 做不到的。

---

## 三、關鍵名詞中英對照

| 中文 | 英文 | 說明 |
|------|------|------|
| 注意力機制 | Attention Mechanism | 動態決定「關注」序列中哪些位置的方法 |
| 自注意力 | Self-Attention | 序列內部各 token 互相計算注意力 |
| 查詢向量 | Query (Q) | 代表「我想找什麼」的向量 |
| 鍵向量 | Key (K) | 代表「我是誰」的向量，用於被查詢比對 |
| 值向量 | Value (V) | 實際攜帶的資訊內容 |
| 縮放點積注意力 | Scaled Dot-Product Attention | QKᵀ / √d_k 的注意力計算方式 |
| 多頭注意力 | Multi-Head Attention | 多個並行 Attention 頭同時運算再整合 |
| 位置編碼 | Positional Encoding | 將位置資訊注入 token 表示的技術 |
| 編碼器 | Encoder | 將輸入轉為向量表示的堆疊模組 |
| 解碼器 | Decoder | 根據編碼器輸出逐步生成序列的模組 |
| 殘差連接 | Residual Connection | 子層輸出加上輸入以緩解梯度消失 |
| 層正規化 | Layer Normalization | 對單一樣本所有特徵做正規化 |
| 遮蔽語言模型 | Masked Language Model (MLM) | BERT 預訓練任務，隨機遮蔽詞並預測 |
| 因果遮蔽 | Causal Mask | GPT 用於防止模型「看未來」的遮蔽機制 |
| 前饋網路 | Feed-Forward Network (FFN) | Transformer 中每層的全連接子網路 |

---

## 四、考試重點提示

> **考試重點**：以下是 iPAS 人工智慧考試中與 Transformer 相關的高頻考點：

1. **Transformer 三大優勢**：平行運算、長程依賴、避免梯度消失——相對於 RNN 的改進
2. **Attention 公式**：`softmax(QKᵀ / √d_k) · V`，特別注意縮放因子 √d_k 的目的
3. **Multi-Head Attention 的意義**：讓模型從多個子空間同時學習不同的注意力模式
4. **Positional Encoding 的必要性**：Transformer 無序列性，必須外加位置資訊
5. **BERT vs GPT 核心差異**：
   - BERT = Encoder-only = 雙向 = MLM = 理解任務
   - GPT = Decoder-only = 單向 = Next Token Prediction = 生成任務
6. **T5 的特色**：Encoder-Decoder 架構，將所有 NLP 任務統一為 Text-to-Text 格式
7. **殘差連接的作用**：緩解深層網路的梯度消失問題

---

<div class="quiz-divider"><span>隨堂小測驗</span></div>

**Q1.** 下列哪一項是 Transformer 相較於 RNN 最主要的計算優勢？

- A. 參數量更少
- B. 可以平行處理整個序列
- C. 不需要大量訓練資料
- D. 只能處理固定長度輸入

---

**Q2.** 在 Scaled Dot-Product Attention 中，除以 √d_k 的主要目的是？

- A. 加快矩陣乘法速度
- B. 將 Q 與 K 的維度對齊
- C. 防止點積值過大導致 Softmax 梯度消失
- D. 減少模型參數數量

---

**Q3.** 下列關於 Multi-Head Attention 的描述，何者正確？

- A. 多個 Head 共用同一組 W_Q、W_K、W_V
- B. 多個 Head 的輸出取平均後輸出
- C. 每個 Head 學習不同子空間的注意力模式，最後串接並線性投影
- D. Head 數量越多，模型越容易過擬合，因此通常設為 1

---

**Q4.** BERT 與 GPT 最根本的架構差異在於？

- A. BERT 使用 CNN，GPT 使用 RNN
- B. BERT 是 Encoder-only 雙向模型，GPT 是 Decoder-only 單向模型
- C. BERT 只能做分類，GPT 只能做翻譯
- D. BERT 的 Attention 使用 Causal Mask，GPT 則不使用任何遮蔽

---

**Q5.** Positional Encoding 被加入 Transformer 架構的原因是？

- A. 替代 Layer Normalization 的功能
- B. 因為 Self-Attention 本身無法區分 token 的先後順序
- C. 用來初始化 Q、K、V 的權重矩陣
- D. 減少 Encoder 與 Decoder 之間的資訊損失

---

### 解答與解析

| 題號 | 答案 | 解析 |
|------|------|------|
| Q1 | **B** | Transformer 最大優勢是所有位置同時計算（平行處理），不像 RNN 必須依序執行，可充分利用 GPU 的平行計算能力。 |
| Q2 | **C** | 當 d_k 較大時，QKᵀ 的值可能非常大，導致 Softmax 進入飽和區（梯度接近零），除以 √d_k 是縮放手段以穩定梯度。 |
| Q3 | **C** | 每個 Head 有各自獨立的投影矩陣（W_Q_i, W_K_i, W_V_i），學習不同的關注模式，最後 Concat 後再乘以 W_O 輸出。 |
| Q4 | **B** | BERT 採用 Encoder-only 架構，可雙向看前後文，適合理解任務；GPT 採用 Decoder-only 架構，只能看前文（Causal Mask），適合生成任務。 |
| Q5 | **B** | Self-Attention 同時處理所有 token，本身不含順序資訊，因此必須透過 Positional Encoding 額外注入位置資訊，讓模型知道詞的相對或絕對位置。 |
