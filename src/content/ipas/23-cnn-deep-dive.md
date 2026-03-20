---
title: "CNN 卷積神經網路深入解析：讓電腦「看懂」圖片的秘密"
order: 23
stage: "機器學習進階"
stageOrder: 8
courseId: "L11302"
summary: "卷積層在做什麼？池化層為什麼重要？從 LeNet 到 ResNet 的 CNN 演化史一次看懂。"
---

## 一、學習目標

完成本單元後，你將能夠：

1. 解釋人眼與機器「看圖」的根本差異
2. 說明卷積（Convolution）運算的原理與 Filter/Kernel 的作用
3. 區分 Max Pooling 與 Average Pooling 的用途
4. 描述完整 CNN 的資料流：Input → Conv → ReLU → Pool → FC → Output
5. 說出主要 CNN 架構的演進里程碑與各自創新之處
6. 解釋遷移學習（Transfer Learning）在 CNN 中的應用方式

---

## 二、核心內容

### 1. 人眼 vs. 機器：怎麼「看懂」一張圖？

人類看到一隻貓的照片，瞬間就能辨識——因為我們的視覺系統自動從線條、形狀、紋理層層抽象。機器則不同：

**機器眼中的圖片 = 數字矩陣**

| 圖片格式 | 資料形狀 | 說明 |
|---------|---------|------|
| 灰階圖 | H × W × 1 | 每個像素一個數值（0–255） |
| 彩色圖（RGB） | H × W × 3 | 每個像素三個通道（Red、Green、Blue） |
| 典型輸入（ImageNet） | 224 × 224 × 3 | 約 15 萬個數字 |

**辨識流程（從低階到高階特徵）：**

```
像素值（Pixels）
    → 邊緣與輪廓（Edges & Contours）
    → 紋理與局部形狀（Textures & Local Shapes）
    → 物件部位（Parts：眼睛、耳朵、輪子）
    → 完整物件（Object：貓、車子）
```

CNN 的設計哲學就是模仿這個從局部到整體的層次化特徵提取過程。

---

### 2. 卷積運算（Convolution）：放大鏡掃描圖片

**生活類比**：卷積就像拿著一個「特徵放大鏡（Filter）」在圖片上滑動。每次放大鏡覆蓋一個小區域，就計算它與放大鏡模板的「相似程度」，輸出一個數值。滑遍整張圖後，就得到一張「特徵熱力圖」。

**卷積的關鍵元件：**

| 元件 | 英文 | 說明 |
|------|------|------|
| 濾波器 | Filter / Kernel | 小矩陣（如 3×3），儲存要偵測的特徵樣板 |
| 步幅 | Stride | 每次滑動的像素距離，控制輸出解析度 |
| 填充 | Padding | 在圖片邊緣補零，保留邊緣資訊並控制輸出尺寸 |
| 特徵圖 | Feature Map | 卷積運算後產生的輸出矩陣 |

**卷積輸出尺寸計算：**

```
輸出大小 = (輸入大小 - Kernel 大小 + 2 × Padding) / Stride + 1
```

**範例**：輸入 32×32，Kernel 3×3，Padding=1，Stride=1
→ 輸出 = (32 - 3 + 2×1) / 1 + 1 = **32×32**（Same Padding，尺寸不變）

**不同 Filter 偵測不同特徵：**

| Filter 作用 | 偵測到的特徵 |
|------------|------------|
| 水平邊緣偵測 | 水平線條（如地平線） |
| 垂直邊緣偵測 | 垂直線條（如門框） |
| 角落偵測 | L 形角落特徵 |
| 紋理偵測 | 特定材質（毛髮、磚牆） |

一層卷積層通常使用多個 Filter（如 64 個），每個 Filter 產生一張 Feature Map，輸出的通道數等於 Filter 數量。

> **考試重點**：卷積層的「參數共享（Parameter Sharing）」——同一個 Filter 在整張圖上共用同一組權重，大幅減少參數量，也賦予 CNN「平移不變性（Translation Invariance）」。

---

### 3. 啟動函數（Activation Function）：ReLU 守門員

卷積結果是線性的，若不加非線性啟動函數，再深的網路也只相當於一層線性運算。**ReLU（Rectified Linear Unit）** 是 CNN 中最常用的啟動函數：

```
ReLU(x) = max(0, x)
```

**生活類比**：ReLU 就像一個「正能量守門員」——正數直接放行，負數一律歸零。它保留了「有反應的神經元」，過濾掉「沒有反應的神經元」。

| 特性 | 說明 |
|------|------|
| 計算簡單 | 只需判斷正負，比 Sigmoid 快很多 |
| 緩解梯度消失 | 正數區域梯度恆為 1 |
| 稀疏激活 | 部分神經元輸出為零，提升效率 |
| 缺點：Dead ReLU | 若輸入長期為負，神經元永遠不激活（可用 Leaky ReLU 改善） |

---

### 4. 池化層（Pooling Layer）：濃縮精華，降低維度

池化層在 Feature Map 上滑動一個小窗口，將窗口內的數值「摘要」成一個數值，縮小 Feature Map 的空間尺寸。

**生活類比**：池化就像將一篇文章每段摘要成一句話——保留核心資訊，去除重複細節，讓後續處理更有效率。

| 池化類型 | 操作 | 用途 |
|---------|------|------|
| **Max Pooling** | 取窗口內最大值 | 保留最顯著的特徵，最常用 |
| **Average Pooling** | 取窗口內平均值 | 保留整體特徵的平均資訊 |
| **Global Average Pooling** | 對整張 Feature Map 取平均 | 常用於最後分類前，替代 Flatten |

**Max Pooling 範例（2×2 窗口，Stride=2）：**

```
輸入 Feature Map:          Max Pooling 輸出:
┌─────┬─────┬─────┬─────┐   ┌─────┬─────┐
│  1  │  3  │  2  │  4  │   │  3  │  4  │
├─────┼─────┼─────┼─────┤ → ├─────┼─────┤
│  5  │  6  │  1  │  2  │   │  6  │  3  │
├─────┼─────┼─────┼─────┤   └─────┴─────┘
│  7  │  8  │  2  │  3  │
├─────┼─────┼─────┼─────┤
│  1  │  2  │  1  │  0  │
└─────┴─────┴─────┴─────┘
```

池化層沒有可學習參數，只是固定的統計運算。

> **考試重點**：池化層的兩大功能——**降維（Downsampling）** 和增加 **平移不變性（Translation Invariance）**。

---

### 5. 全連接層（Fully Connected Layer）：最終分類決策

在多次卷積與池化後，Feature Map 被展平（Flatten）成一維向量，送入全連接層（FC Layer，與傳統神經網路相同）進行最終分類。

**CNN 完整資料流：**

```
輸入圖片（Input Image）
    ↓
[卷積層（Conv Layer） → ReLU → 池化層（Pooling）] × N
    ↓
展平（Flatten）
    ↓
全連接層（Fully Connected Layer） × M
    ↓
Softmax（多分類）或 Sigmoid（二分類）
    ↓
輸出類別機率（Output Probabilities）
```

**生活類比**：整個 CNN 就像一個「特徵萃取流水線」——前面的卷積池化層是工廠的原料加工（從像素提取特徵），全連接層是最終品管室（根據提取的特徵做出分類決定）。

---

### 6. 經典 CNN 架構演進史

| 年份 | 架構 | 創新點 | 影響 |
|------|------|--------|------|
| **1998** | **LeNet-5** | 最早成功的 CNN，用於手寫數字辨識（MNIST），5 層架構 | 奠定 CNN 基本架構 |
| **2012** | **AlexNet** | 深層 CNN（8 層）、ReLU、Dropout、GPU 訓練，ImageNet 錯誤率降低 10% | 深度學習革命起點，引爆 AI 熱潮 |
| **2014** | **VGGNet** | 全部使用 3×3 小 Kernel，堆疊更深（16/19 層），結構簡潔規律 | 證明深度勝過複雜的 Filter 設計 |
| **2014** | **GoogLeNet / Inception** | Inception Module（並行不同尺寸的 Conv），計算效率高，22 層 | 引入多尺度特徵融合的概念 |
| **2015** | **ResNet** | 殘差連接（Skip Connection），成功訓練 152 層，解決深層梯度消失 | 現代深度網路的基石，至今廣泛使用 |
| **2019** | **EfficientNet** | 複合縮放（Compound Scaling）同時擴寬、加深、提高解析度 | 在相同計算量下達到最佳精度 |

**ResNet 殘差連接的生活類比**：想像你在爬一棟很高的大樓。一般 CNN 每層都要爬樓梯，累積誤差（梯度消失）後上不去。ResNet 在每隔幾層就設置一個「電梯直達」的捷徑（Skip Connection），即使樓梯走不通，梯度也能透過捷徑順暢傳遞。

```
ResNet 殘差塊：
輸出 = F(x) + x
（x 為輸入，F(x) 為該塊學習的殘差）
```

> **考試重點**：AlexNet（2012 ImageNet 突破）和 ResNet（殘差連接解決梯度消失）是最常考的架構里程碑。

---

### 7. 遷移學習（Transfer Learning）：站在巨人的肩膀上

從頭訓練 CNN 需要海量資料和大量運算資源。**遷移學習**的思路是：直接使用已在大型資料集（如 ImageNet，120 萬張圖）訓練好的 CNN 預訓練模型，再針對自己的任務進行微調（Fine-tuning）。

**生活類比**：就像一位精通法式料理的主廚（預訓練模型），學習做台灣料理時（新任務），不需要從頭學習刀功、火候控制等基礎技能——只需要學習台灣食材的搭配（微調），就能很快掌握。

**遷移學習的常見策略：**

| 策略 | 做法 | 適用情境 |
|------|------|---------|
| **特徵提取（Feature Extraction）** | 凍結預訓練模型所有層，只訓練新加的全連接層 | 新資料集小且與原任務相似 |
| **部分微調（Partial Fine-tuning）** | 解凍後幾層的預訓練權重，連同新頭一起訓練 | 新資料集中等大小 |
| **完整微調（Full Fine-tuning）** | 解凍所有層，用較小學習率訓練整個模型 | 新資料集大且與原任務差異較大 |

**常用預訓練 CNN 主幹（Backbone）：**

- ResNet-50 / ResNet-101（通用，穩健）
- EfficientNet-B0 到 B7（輕量高效）
- MobileNet（適合手機等邊緣裝置）

---

### 8. CNN 的主要應用領域

| 應用 | 說明 | 代表方法 |
|------|------|---------|
| **影像分類（Image Classification）** | 給一張圖，輸出類別標籤 | ResNet、EfficientNet |
| **物件偵測（Object Detection）** | 找出圖中所有物件的位置與類別 | YOLO、Faster R-CNN、SSD |
| **語義分割（Semantic Segmentation）** | 對每個像素做分類，區分不同物件的邊界 | U-Net、DeepLab |
| **人臉辨識（Face Recognition）** | 識別或驗證人臉身份 | FaceNet、DeepFace |
| **醫學影像分析（Medical Imaging）** | 偵測腫瘤、分析 X 光、MRI | U-Net（最廣泛應用） |
| **自駕車視覺（Autonomous Driving）** | 辨識車道、行人、號誌 | YOLO 系列 |

**YOLO（You Only Look Once）** 的生活類比：傳統物件偵測像「先找可疑區域再逐一鑑定」，YOLO 則是「一眼掃過整張圖同時輸出所有物件的位置和類別」，因此速度非常快，可達到即時（Real-time）偵測。

---

## 三、關鍵名詞中英對照

| 中文 | 英文 | 說明 |
|------|------|------|
| 卷積神經網路 | Convolutional Neural Network (CNN) | 專為處理格狀資料（影像）設計的神經網路 |
| 卷積層 | Convolutional Layer | 使用 Filter 做卷積運算，提取局部特徵 |
| 濾波器／核 | Filter / Kernel | 小矩陣，儲存要偵測的特徵樣板 |
| 特徵圖 | Feature Map | 卷積運算後的輸出矩陣，代表某種特徵的空間分布 |
| 步幅 | Stride | Filter 每次滑動的像素距離 |
| 填充 | Padding | 在輸入邊緣補零，保留邊緣資訊 |
| 池化層 | Pooling Layer | 對 Feature Map 做空間降維的層 |
| 最大池化 | Max Pooling | 取窗口內最大值 |
| 平均池化 | Average Pooling | 取窗口內平均值 |
| 全連接層 | Fully Connected Layer (FC) | 所有神經元互相連接，用於最終分類 |
| 平移不變性 | Translation Invariance | 物件在圖中移動位置，仍能被正確辨識的特性 |
| 參數共享 | Parameter Sharing | 同一 Filter 在整張圖上共用相同權重 |
| 殘差連接 | Skip Connection / Residual Connection | 將輸入直接加到輸出，緩解梯度消失 |
| 遷移學習 | Transfer Learning | 利用預訓練模型的知識，應用到新任務 |
| 微調 | Fine-tuning | 在預訓練模型基礎上，以新資料繼續訓練調整 |
| 物件偵測 | Object Detection | 找出影像中所有物件的邊界框與類別 |
| 語義分割 | Semantic Segmentation | 對影像每個像素進行類別標記 |

---

## 四、考試重點提示

> **考試重點**：以下是 iPAS 人工智慧考試中與 CNN 相關的高頻考點：

1. **卷積的核心特性**：
   - 參數共享（Parameter Sharing）→ 減少參數量
   - 局部連接（Local Connectivity）→ 只看局部區域
   - 平移不變性（Translation Invariance）→ 位置無關辨識

2. **ReLU 的優勢**：計算快、緩解梯度消失、稀疏激活——相較於 Sigmoid 的三大優點

3. **Max Pooling vs Average Pooling**：Max 取最大值保留最強特徵（最常用）；Average 取平均值平滑特徵

4. **CNN 架構演進里程碑**（按年份記憶）：
   - **1998 LeNet**：CNN 起點
   - **2012 AlexNet**：深度學習革命，ImageNet 大突破
   - **2015 ResNet**：殘差連接，解決超深網路梯度消失

5. **ResNet 殘差連接公式**：`輸出 = F(x) + x`，Skip Connection 讓梯度直接通過

6. **遷移學習三策略**：凍結全部（特徵提取）→ 解凍部分（部分微調）→ 解凍全部（完整微調）

7. **應用場景對應**：
   - 分類 → ResNet / EfficientNet
   - 偵測 → YOLO / Faster R-CNN
   - 分割 → U-Net（尤其醫學影像）

---

<div class="quiz-divider"><span>隨堂小測驗</span></div>

**Q1.** 卷積層中「參數共享（Parameter Sharing）」的主要好處是？

- A. 讓每個像素都使用不同的 Filter 以提升精度
- B. 大幅減少模型參數量，並賦予平移不變性
- C. 取代池化層的降維功能
- D. 讓 CNN 可以處理任意長度的文字序列

---

**Q2.** 下列哪一個 CNN 架構首次引入「殘差連接（Skip Connection）」，成功訓練超過 100 層的深度網路？

- A. AlexNet
- B. VGGNet
- C. GoogLeNet
- D. ResNet

---

**Q3.** Max Pooling（最大池化）與 Average Pooling（平均池化）的主要差異在於？

- A. Max Pooling 有可學習參數，Average Pooling 沒有
- B. Max Pooling 取窗口內最大值（保留最強特徵），Average Pooling 取平均值
- C. Max Pooling 只能用於最後一層，Average Pooling 可用於任意層
- D. Max Pooling 會增加 Feature Map 的空間尺寸，Average Pooling 會縮小

---

**Q4.** 遷移學習中，若目標任務的資料集很小，且與預訓練模型的原始任務非常相似，最適合的策略是？

- A. 完整微調（解凍所有層）
- B. 從頭訓練一個全新的 CNN
- C. 凍結預訓練模型，只訓練新加的全連接層（特徵提取）
- D. 移除所有卷積層，只保留全連接層

---

**Q5.** U-Net 架構最廣泛應用於下列哪個任務？

- A. 自然語言翻譯
- B. 即時物件偵測（Real-time Object Detection）
- C. 醫學影像語義分割
- D. 語音辨識

---

### 解答與解析

| 題號 | 答案 | 解析 |
|------|------|------|
| Q1 | **B** | 參數共享讓同一個 Filter 在整張圖上使用相同的權重，大幅減少參數量（相較全連接層），同時使 CNN 對物件在圖中的位置具有平移不變性。 |
| Q2 | **D** | ResNet（2015，Microsoft Research）首次提出殘差連接（Skip Connection），公式為 `輸出 = F(x) + x`，成功訓練 152 層的深度網路並在 ImageNet 奪冠。 |
| Q3 | **B** | Max Pooling 取窗口內最大值，保留最顯著的特徵激活，是 CNN 中最常用的池化方式；Average Pooling 取平均值，特徵更平滑。兩者皆無可學習參數。 |
| Q4 | **C** | 資料集小且與原任務相似時，預訓練模型學到的特徵已高度相關，只需凍結卷積層（特徵提取器），訓練新的分類頭（全連接層）即可，避免在小資料集上過擬合。 |
| Q5 | **C** | U-Net 以其對稱的 Encoder-Decoder 架構與跳接連接（Skip Connection）著稱，能精確還原像素級邊界，在醫學影像（腫瘤偵測、器官分割）中被廣泛採用。 |
