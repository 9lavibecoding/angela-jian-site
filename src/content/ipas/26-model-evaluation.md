---
title: "模型評估指標全攻略：Accuracy 不夠看，你還需要知道這些"
order: 26
stage: "機器學習進階"
stageOrder: 8
courseId: "L11302"
summary: "Accuracy、Precision、Recall、F1-Score 怎麼選？混淆矩陣怎麼看？ROC 曲線告訴你什麼？"
---

## 一、學習目標

完成本單元後，你將能夠：

- 說明為何 Accuracy 在不平衡資料下會誤導判斷
- 看懂並解讀混淆矩陣（Confusion Matrix）中的 TP、TN、FP、FN
- 計算 Precision、Recall、F1-Score，並根據情境選擇合適指標
- 理解 ROC 曲線與 AUC 的意義
- 區分分類指標與迴歸指標（MSE、RMSE、MAE、R²）
- 說明 Cross-Validation 的目的與 K-Fold 的做法
- 用學習曲線辨識過擬合（Overfitting）

---

## 二、核心內容

### 2-1 為什麼 Accuracy 不夠用？

> 生活比喻：假設你的城市每 100 人中只有 1 人是慣竊，你訓練一個模型，讓它「對所有人都預測無罪」，Accuracy 直接 99%——但這個模型完全沒有用處。

Accuracy 的計算方式是：

```
Accuracy = (預測正確的樣本數) / (全部樣本數)
```

在資料嚴重不平衡時（如 99:1），即使模型永遠預測多數類，Accuracy 依然高達 99%，卻對少數類毫無識別能力。這就是為什麼我們需要更細緻的指標。

---

### 2-2 混淆矩陣（Confusion Matrix）

混淆矩陣是所有分類指標的基礎，以二元分類為例：

```
                    預測：Positive    預測：Negative
實際：Positive    |   TP（真陽性）  |   FN（假陰性）  |
實際：Negative    |   FP（假陽性）  |   TN（真陰性）  |
```

> 生活比喻（醫療診斷）：
> - **TP（True Positive）**：患者確實有病，模型也說有病。正確抓到！
> - **TN（True Negative）**：患者沒病，模型也說沒病。正確放行！
> - **FP（False Positive）**：患者沒病，模型卻說有病。**假警報**，虛驚一場。
> - **FN（False Negative）**：患者確實有病，模型卻說沒病。**漏診**，最危險的錯誤！

| 縮寫 | 全名 | 意義 |
|------|------|------|
| TP | True Positive | 真的是正例，預測也是正例 |
| TN | True Negative | 真的是負例，預測也是負例 |
| FP | False Positive | 真的是負例，但預測成正例（假警報） |
| FN | False Negative | 真的是正例，但預測成負例（漏報） |

---

### 2-3 分類指標詳解

#### Accuracy（準確率）

$$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$

整體預測正確的比例，適用於類別平衡的情境。

---

#### Precision（精確率）

$$\text{Precision} = \frac{TP}{TP + FP}$$

> 生活比喻：垃圾郵件過濾器。Precision 高代表「被標為垃圾的郵件，幾乎都真的是垃圾」，不會誤把重要信件丟進垃圾桶（低 FP）。

「在所有預測為正例的樣本中，真正是正例的比例。」— 重視「不誤判」。

---

#### Recall / Sensitivity（召回率 / 敏感度）

$$\text{Recall} = \frac{TP}{TP + FN}$$

> 生活比喻：癌症篩檢。Recall 高代表「真正有癌症的患者，幾乎都被抓出來」，不漏掉任何病人（低 FN）。

「在所有真實正例中，被正確預測出來的比例。」— 重視「不漏掉」。

---

#### Specificity（特異度）

$$\text{Specificity} = \frac{TN}{TN + FP}$$

在所有真實負例中，被正確預測為負例的比例。與 Recall 相對，描述的是「對負例的識別能力」。

---

#### F1-Score

$$\text{F1} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

> 生活比喻：Precision 和 Recall 就像翹翹板，提高一個往往會壓低另一個。F1-Score 是兩者的調和平均數，當你需要在兩者之間取得平衡時使用。

F1-Score 使用**調和平均數（Harmonic Mean）**而非算術平均，因此只要其中一個值極低，F1 就會被大幅拉低，強迫模型兩者都顧好。

---

#### 何時選 Precision？何時選 Recall？

| 情境 | 優先指標 | 理由 |
|------|----------|------|
| 垃圾郵件過濾 | Precision | 誤判正常信件（FP）代價高，寧可漏掉幾封垃圾信 |
| 癌症篩檢 | Recall | 漏診（FN）代價極高，寧可多一些假警報也要抓住所有病患 |
| 詐欺交易偵測 | Recall | 漏掉詐欺（FN）損失大，誤判可再人工複審 |
| 法律文件分類 | Precision | 誤分類文件（FP）可能導致法律問題 |

---

### 2-4 ROC 曲線與 AUC

**ROC 曲線（Receiver Operating Characteristic Curve）**是在不同分類閾值（Threshold）下，以 **TPR（True Positive Rate = Recall）** 為縱軸、**FPR（False Positive Rate = 1 - Specificity）** 為橫軸繪製的曲線。

```
TPR
 1 |         *****
   |      ***
   |    **
   |  **
   | *
   |*
 0 +-------------- FPR
   0                1
```

- 曲線越靠近左上角，模型越好
- 對角線（y = x）代表**隨機猜測**，毫無判別能力

**AUC（Area Under the Curve）**是 ROC 曲線下的面積：

| AUC 值 | 意義 |
|--------|------|
| 1.0 | 完美模型 |
| 0.9 以上 | 優秀 |
| 0.7 ~ 0.9 | 良好 |
| 0.5 ~ 0.7 | 普通 |
| 0.5 | 等同隨機猜測，毫無價值 |
| 低於 0.5 | 比隨機還差（可能標籤搞反了） |

> 生活比喻：AUC 就像考試成績的百分位數——不管考題難易，都能公平比較不同模型的辨別能力。

---

### 2-5 迴歸指標

當預測目標是**連續數值**（如房價、氣溫），使用以下指標：

> 生活比喻：預測房價。你說這間房子值 1000 萬，實際成交 1050 萬，誤差 50 萬。

| 指標 | 公式概念 | 特性 |
|------|----------|------|
| **MAE**（Mean Absolute Error） | 平均絕對誤差 | 對離群值不敏感，直觀易懂 |
| **MSE**（Mean Squared Error） | 平均平方誤差 | 放大大誤差，對離群值敏感 |
| **RMSE**（Root MSE） | MSE 開根號 | 與原始資料同單位，比 MSE 更直觀 |
| **R²**（R-Squared） | 解釋變異量的比例 | 1 = 完美，0 = 跟平均值一樣差，可為負 |

$$R^2 = 1 - \frac{\sum(y_i - \hat{y}_i)^2}{\sum(y_i - \bar{y})^2}$$

R² 越接近 1，模型解釋力越強。

---

### 2-6 交叉驗證（Cross-Validation）

> 生活比喻：考試前做了三套模擬考，每次換不同題目當練習、不同題目當測驗，確保自己不是只會某一套題目。

**K-Fold Cross-Validation** 將資料切成 K 份，輪流用其中 1 份當驗證集、其餘 K-1 份當訓練集，重複 K 次後取平均分數：

```
資料集 → [Fold1] [Fold2] [Fold3] [Fold4] [Fold5]

第1輪：Train=[2,3,4,5]  Validate=[1]
第2輪：Train=[1,3,4,5]  Validate=[2]
第3輪：Train=[1,2,4,5]  Validate=[3]
...
```

| 方法 | 說明 |
|------|------|
| K-Fold | 標準做法，K 通常取 5 或 10 |
| Stratified K-Fold | 確保每個 Fold 中各類別比例相同，適合不平衡資料 |
| Leave-One-Out (LOO) | 每次只留 1 筆當驗證，計算量最大但偏差最小 |

---

### 2-7 用學習曲線偵測過擬合

```
Loss
 ^
 |  訓練損失 (Training Loss)
 |  ─────────────────────────\
 |                             \___________
 |
 |  驗證損失 (Validation Loss)
 |  ─────────\
 |             \
 |              \___/‾‾‾‾‾‾‾‾‾ ← 此處開始過擬合
 |
 +──────────────────────────────→ Epoch（訓練輪數）
```

- 訓練損失持續下降，但驗證損失開始回升 → **過擬合（Overfitting）**訊號
- 兩者都很高，差距不大 → **欠擬合（Underfitting）**訊號

---

## 三、關鍵名詞中英對照

| 中文 | 英文 |
|------|------|
| 準確率 | Accuracy |
| 精確率 | Precision |
| 召回率 / 敏感度 | Recall / Sensitivity |
| 特異度 | Specificity |
| 調和平均數 | Harmonic Mean |
| F1 分數 | F1-Score |
| 混淆矩陣 | Confusion Matrix |
| 真陽性 | True Positive (TP) |
| 假陽性 | False Positive (FP) |
| 真陰性 | True Negative (TN) |
| 假陰性 | False Negative (FN) |
| ROC 曲線 | ROC Curve (Receiver Operating Characteristic) |
| 曲線下面積 | AUC (Area Under the Curve) |
| 平均絕對誤差 | MAE (Mean Absolute Error) |
| 均方誤差 | MSE (Mean Squared Error) |
| 均方根誤差 | RMSE (Root Mean Square Error) |
| 決定係數 | R² (R-Squared) |
| 交叉驗證 | Cross-Validation |
| K 折交叉驗證 | K-Fold Cross-Validation |
| 分層抽樣 | Stratified Sampling |
| 過擬合 | Overfitting |
| 學習曲線 | Learning Curve |
| 分類閾值 | Threshold |

---

## 四、考試重點提示

> **重點 1：混淆矩陣格子定義必考**
> TP = 真正例，FP = 假警報（預測錯方向），FN = 漏報（最危險），TN = 真負例。記法：第一個字母 T/F 代表預測對不對，第二個字母 P/N 代表預測結果。

> **重點 2：Precision vs Recall 情境判斷**
> 「漏掉代價高」→ 選 Recall（癌症篩檢、詐欺偵測）；「誤判代價高」→ 選 Precision（垃圾郵件、法律文件）。

> **重點 3：AUC 數值意義**
> AUC = 1.0 完美，AUC = 0.5 隨機猜測。ROC 曲線是以 TPR（Y 軸）對 FPR（X 軸）繪製。

> **重點 4：F1-Score 使用調和平均數**
> F1 = 2 × (Precision × Recall) / (Precision + Recall)。只要 Precision 或 Recall 任一極低，F1 就會很低。

> **重點 5：R² 的範圍與意義**
> R² 最大為 1（完美預測），可為負值（比只預測平均值還差）。R² = 0 代表模型跟直接預測平均值一樣。

---

<div class="quiz-divider"><span>隨堂小測驗</span></div>

**1.** 一個癌症篩檢模型，對所有人預測「無癌」，資料集中有癌症的比例為 1%。請問此模型的 Accuracy 是多少？這個數字代表模型很好用嗎？

**2.** 某垃圾郵件過濾器的混淆矩陣如下：TP=80, FP=20, FN=5, TN=895。請計算此模型的 Precision 和 Recall，並說明哪個比較重要？

**3.** ROC 曲線的 X 軸與 Y 軸分別代表什麼？AUC = 0.5 代表什麼意義？

**4.** 以下哪個情境應優先使用 Recall 而非 Precision？
- (A) 過濾垃圾廣告郵件，避免重要信件被誤刪
- (B) 偵測銀行詐欺交易，確保每筆詐欺都被抓到
- (C) 文章類別標籤自動分類，標錯類別代價高
- (D) 商品推薦系統，推薦精準度比覆蓋率重要

**5.** K-Fold Cross-Validation 與直接切分 Train/Test Set 相比，主要優點是什麼？Stratified K-Fold 又額外解決了什麼問題？

---

### 解答與解析

| 題號 | 答案 |
|------|------|
| 1 | Accuracy = 99%，但模型完全沒有用 |
| 2 | Precision = 80%，Recall = 94.1%，垃圾郵件情境 Precision 更重要 |
| 3 | X 軸 = FPR（假陽性率），Y 軸 = TPR（真陽性率）；AUC=0.5 等同隨機猜測 |
| 4 | (B) |
| 5 | 減少評估結果受資料切割方式影響；Stratified 保證每折類別比例一致 |

**詳細解析：**

**第 1 題：** 99% Accuracy 聽起來很高，但因為只有 1% 的人有癌症，預測全部「無癌」就能得到 99% Accuracy。此模型的 Recall = 0（完全沒抓到任何癌症患者），毫無實用價值。這正是不平衡資料下 Accuracy 會誤導人的經典案例。

**第 2 題：**
- Precision = TP / (TP + FP) = 80 / (80 + 20) = 80%
  「被標為垃圾的信件中，80% 真的是垃圾」
- Recall = TP / (TP + FN) = 80 / (80 + 5) ≈ 94.1%
  「真正的垃圾信中，94.1% 被成功攔截」
- 垃圾郵件情境：誤把重要信件標為垃圾（FP）代價高，因此 **Precision 更重要**。

**第 3 題：** ROC 曲線的 X 軸是 **FPR（False Positive Rate = FP / (FP + TN)）**，Y 軸是 **TPR（True Positive Rate = Recall）**。AUC = 0.5 代表模型的辨別能力等同於隨機猜測（投硬幣決定），沒有任何預測價值。

**第 4 題：(B)** 詐欺偵測中，漏掉一筆詐欺交易（FN）的損失遠大於多凍結幾筆正常交易（FP），因此優先最大化 Recall，確保每筆詐欺都被標記出來，再由人工複審誤判的部分。

**第 5 題：** K-Fold Cross-Validation 讓每筆資料都輪流當過驗證集，評估結果更穩定、不受單次資料切割影響，也能充分利用有限資料。**Stratified K-Fold** 額外確保每個 Fold 中各類別的比例與原始資料集相同，避免某個 Fold 因隨機切割導致類別比例嚴重偏斜，特別適用於不平衡資料集。
