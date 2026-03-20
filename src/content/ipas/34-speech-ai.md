---
title: "語音 AI：從語音辨識到語音合成的完整技術鏈"
order: 34
stage: "AI 應用專題"
stageOrder: 10
courseId: "L11101"
summary: "ASR 語音辨識、TTS 語音合成、語音情緒辨識、語者辨識四大任務與代表模型。"
---

## 一、學習目標

完成本單元後，你將能夠：

1. 說明語音 AI 的四大核心任務（ASR、TTS、語音情緒辨識、語者辨識）
2. 解釋頻譜圖（Spectrogram）與 MFCC 特徵的意義及用途
3. 比較 CTC、DeepSpeech、Whisper 在語音辨識架構上的差異
4. 說明 Tacotron、WaveNet、FastSpeech 如何將文字轉換為語音
5. 列舉語音 AI 的主要應用場景與代表工具

---

## 二、核心內容

### 1. 語音 AI 概覽：為什麼語音很難處理？

語音是連續的聲波訊號，與文字的離散符號有本質不同。語音訊號的挑戰在於：

- **噪音（Noise）**：背景聲、口音、說話速度各異
- **連音（Coarticulation）**：語音中相鄰音素會互相影響，邊界不清晰
- **時間變異性（Temporal Variability）**：同一句話說快說慢，時間長度不同

因此，語音 AI 的第一步永遠是將聲波轉換為機器能理解的特徵表示。

**生活類比**：把聲音交給 AI 就像把一段旋律交給樂評人。樂評人不會直接分析空氣震動，而是先把旋律畫成樂譜（特徵提取），再根據樂譜來理解音樂的結構與情感。

---

### 2. 語音特徵提取：Spectrogram 與 MFCC

在進入模型之前，原始音訊（Raw Audio Waveform）會先被轉換為特徵表示：

#### 頻譜圖（Spectrogram）

頻譜圖透過短時傅立葉變換（Short-Time Fourier Transform, STFT）將音訊轉換為「時間 × 頻率 × 強度」的二維矩陣，可以直接視覺化為一張圖，讓 CNN 等影像模型處理。

**類比**：頻譜圖就像用彩色筆畫出一段音樂的「熱力圖」，橫軸是時間、縱軸是音高（頻率）、顏色深淺代表該頻率的能量強弱。

#### MFCC（Mel-Frequency Cepstral Coefficients，梅爾倒頻譜係數）

MFCC 是語音辨識中最常用的傳統特徵，模擬人耳對頻率的非線性感知（Mel 音階），將頻譜壓縮成約 13～40 個係數，大幅降低維度並保留語音中最重要的資訊。

| 特徵類型 | 維度 | 主要用途 | 優點 |
|----------|------|---------|------|
| 原始波形（Waveform） | 每秒數萬樣本點 | End-to-End 模型（如 Wav2Vec） | 不遺失任何資訊 |
| 頻譜圖（Spectrogram） | 時間 × 頻率 | CNN-based 模型、Whisper | 可視覺化，直覺 |
| MFCC | 13～40 維 | 傳統 HMM-GMM、SVM、淺層模型 | 低維、計算快 |

> **考試重點**：MFCC 是最常考的語音特徵，其核心概念是「模擬人耳對頻率的非線性感知」。頻譜圖是現代深度學習語音模型的主流輸入形式。

---

### 3. 四大語音 AI 任務

語音 AI 可以拆解為四個主要任務，每個任務有不同的輸入輸出與代表模型：

| 任務 | 英文名稱 | 輸入 | 輸出 | 代表模型 |
|------|---------|------|------|---------|
| 語音辨識 | Automatic Speech Recognition (ASR) | 語音 | 文字 | CTC、DeepSpeech、Whisper |
| 語音合成 | Text-to-Speech (TTS) | 文字 | 語音 | Tacotron、WaveNet、FastSpeech |
| 語音情緒辨識 | Speech Emotion Recognition (SER) | 語音 | 情緒標籤 | CNN、RNN、SVM |
| 語者辨識 | Speaker Identification / Verification | 語音 | 說話者身份 | i-vector、X-vector |

---

### 4. ASR 語音辨識：語音轉文字

**ASR（Automatic Speech Recognition）** 的目標是將一段語音訊號自動轉換為對應的文字序列。

#### CTC（Connectionist Temporal Classification）

CTC 是一種損失函數（Loss Function）機制，解決語音與文字長度不對齊的核心問題。語音的幀（Frame）數遠多於對應的字元數，CTC 允許輸出「空白符號（blank）」並使用動態規劃自動對齊，不需要人工標注每個音框對應哪個字元。

**生活類比**：CTC 就像在聽一首歌的歌詞時，你不需要知道「每一個音節精確對應哪個時間點」，只需要知道整句歌詞的順序就好。

#### DeepSpeech（百度 / Mozilla）

DeepSpeech 是百度在 2014 年提出的端對端（End-to-End）語音辨識模型，以 RNN 為核心，直接從頻譜圖輸出文字，使用 CTC 訓練，不依賴傳統 HMM-GMM 流程。

#### Whisper（OpenAI）

Whisper 是 OpenAI 在 2022 年發布的開源語音辨識模型，以 Transformer 架構為基礎，在 68 萬小時的多語言、多任務語音資料上訓練，支援 99 種語言的辨識與翻譯，抗噪能力強，是目前最廣泛使用的開源 ASR 模型。

| 模型 | 架構 | 特點 |
|------|------|------|
| CTC-based | RNN + CTC Loss | 解決對齊問題，早期主流 |
| DeepSpeech | 深層 RNN + CTC | 端對端，不需語言模型輔助 |
| Whisper | Transformer Encoder-Decoder | 多語言、多任務、抗噪強、開源 |

> **考試重點**：Whisper 使用 Encoder-Decoder Transformer 架構，並採用多任務訓練（辨識 + 翻譯 + 語言辨識）。CTC 的核心作用是「解決輸入輸出序列長度不對齊」。

---

### 5. TTS 語音合成：文字轉語音

**TTS（Text-to-Speech）** 的目標是將文字轉換為自然、流暢的語音。傳統 TTS 拼接預錄音片段，現代 TTS 使用深度學習生成連續波形。

#### Tacotron（Google）

Tacotron 是 Google 在 2017 年提出的端對端 TTS 模型，以 Seq2Seq + Attention 架構將文字直接轉換為 Mel 頻譜圖，再透過 Griffin-Lim 或 WaveNet 等聲碼器（Vocoder）將頻譜圖還原為波形。Tacotron 2 進一步提升自然度，被認為接近人類語音品質。

#### WaveNet（DeepMind）

WaveNet 是 DeepMind 在 2016 年提出的生成模型，以 Dilated Causal Convolution（擴張因果卷積）逐樣本點（Sample-by-Sample）生成音訊波形，生成品質極高，但因為是自回歸（Autoregressive）生成，速度極慢（原始版本生成 1 秒音訊需數分鐘）。

**生活類比**：WaveNet 就像一位超精細的工藝師，每秒鐘要親手雕刻 16,000 個樣本點，品質一流，但速度極慢。

#### FastSpeech / FastSpeech 2（Microsoft）

FastSpeech 2 以非自回歸（Non-Autoregressive）架構解決速度瓶頸，引入「時長預測器（Duration Predictor）」明確控制每個音素的發音長度，可以平行生成整段頻譜圖，速度比 Tacotron 快數十倍，且支援音調（Pitch）和能量（Energy）控制，可調整語音的情感風格。

| 模型 | 架構 | 速度 | 特點 |
|------|------|------|------|
| Tacotron 2 | Seq2Seq + Attention | 中 | 高品質，業界基準 |
| WaveNet | Dilated Causal CNN | 極慢（原始） | 波形生成品質最高 |
| FastSpeech 2 | Transformer（非自回歸） | 快 | 可控音調 / 時長 / 能量 |

---

### 6. 語音情緒辨識（Speech Emotion Recognition, SER）

語音情緒辨識的目標是從語音中辨識說話者的情緒狀態（如快樂、悲傷、憤怒、中性）。情緒藏在語音的韻律特徵（Prosody）中：音調高低、說話速度、音量大小。

**常用方法：**

- **SVM + 手工特徵**：提取 MFCC、音調、過零率等特徵後交給 SVM 分類，傳統且可解釋性強
- **CNN**：將頻譜圖視為影像，用卷積網路提取局部特徵
- **RNN / LSTM**：捕捉語音的時序情緒變化
- **Transformer-based**：近年主流，結合預訓練模型（如 Wav2Vec 2.0）微調

> **考試重點**：語音情緒辨識的挑戰在於「情緒標注主觀性高」且「同一情緒在不同文化有不同表達方式」，這是資料品質的核心困難。

---

### 7. 語者辨識（Speaker Identification / Verification）

語者辨識的目標是「這段語音是誰說的？」，分為兩個子任務：

| 子任務 | 定義 | 類比 |
|--------|------|------|
| **語者辨識（Speaker Identification）** | 從候選名單中找出最匹配的說話者 | 刷臉進辦公室，系統找出你是哪位員工 |
| **語者驗證（Speaker Verification）** | 確認「此人是否是聲稱的那個人」（一對一比對） | 聲紋密碼解鎖手機，驗證你就是帳號持有人 |

**核心技術：聲紋向量（Speaker Embedding）**

- **i-vector**：使用因子分析將說話者的聲學特性壓縮到低維固定長度向量
- **X-vector**：使用深度神經網路（TDNN, Time Delay Neural Network）從語音段中提取說話者嵌入，性能比 i-vector 更強

**生活類比**：X-vector 就像把每個人的聲音壓縮成一張「聲音身分證」，不管說什麼話、說多久，這張身分證的核心特徵都是獨一無二的。

---

### 8. 應用場景與工具

#### 主要應用場景

| 應用 | 使用技術 | 說明 |
|------|---------|------|
| 智慧音箱（Smart Speaker） | ASR + NLU + TTS | 語音辨識 → 理解意圖 → 語音回答 |
| 電話客服（Call Center） | ASR + SER + 語者辨識 | 自動轉寫通話、即時情緒分析、身份驗證 |
| 無障礙輔助（Accessibility） | ASR、TTS | 聽障者字幕生成、視障者語音閱讀 |
| 影音配音（Dubbing） | TTS、語音轉換 | 自動將影片翻譯並以 AI 聲音配音 |
| 語音翻譯（Speech Translation） | ASR + 機器翻譯 + TTS | 同步口譯、跨語言溝通 |

#### 主要工具與平台

| 工具 | 提供者 | 特點 |
|------|--------|------|
| Google Speech-to-Text API | Google Cloud | 多語言、即時 / 批次辨識 |
| Azure Cognitive Speech | Microsoft | 自訂語音模型、情緒分析 |
| Whisper | OpenAI（開源） | 免費、可本地部署、99 語言 |
| Amazon Transcribe | AWS | 自動標點、多語者分離（Diarization） |
| ElevenLabs | ElevenLabs | 高品質語音複製與合成 |

---

## 三、關鍵名詞中英對照

| 中文 | 英文 | 說明 |
|------|------|------|
| 語音辨識 | Automatic Speech Recognition (ASR) | 語音轉文字的技術 |
| 語音合成 | Text-to-Speech (TTS) | 文字轉語音的技術 |
| 語音情緒辨識 | Speech Emotion Recognition (SER) | 從語音中辨識情緒狀態 |
| 語者辨識 | Speaker Identification | 判斷「這是誰的聲音」 |
| 語者驗證 | Speaker Verification | 驗證「這個聲音是否為特定人」 |
| 頻譜圖 | Spectrogram | 語音的時頻能量分布圖 |
| 梅爾倒頻譜係數 | MFCC (Mel-Frequency Cepstral Coefficients) | 模擬人耳感知的語音特徵 |
| 端對端模型 | End-to-End Model | 直接從原始輸入訓練到最終輸出，不需中間步驟 |
| 連接時序分類 | CTC (Connectionist Temporal Classification) | 解決語音與文字序列對齊問題的損失函數 |
| 聲碼器 | Vocoder | 將頻譜圖還原為聲音波形的模組 |
| 聲紋嵌入 | Speaker Embedding | 代表說話者身份特徵的固定長度向量 |
| 韻律特徵 | Prosody | 語音的音調、節奏、音量等超音段特徵 |
| 語者分離 | Speaker Diarization | 在多人對話中分辨「誰在什麼時候說話」 |
| 非自回歸 | Non-Autoregressive | 可以平行生成所有輸出，不依賴前一輸出的生成方式 |

---

## 四、考試重點提示

> **考試重點**：以下是 iPAS 人工智慧考試中與語音 AI 相關的高頻考點：

1. **四大任務方向要記清楚**：ASR（語音→文字）、TTS（文字→語音）、SER（語音→情緒）、語者辨識（語音→身份）
2. **MFCC 的核心概念**：模擬人耳的非線性頻率感知，是傳統語音特徵的代表
3. **CTC 的用途**：解決語音幀數與文字長度不對齊的問題，用動態規劃自動對齊
4. **Whisper 的特點**：OpenAI 開源模型、Transformer 架構、多語言多任務、68 萬小時訓練資料
5. **WaveNet vs FastSpeech**：WaveNet 品質高但速度極慢（自回歸）；FastSpeech 2 非自回歸，速度快且可控制音調與時長
6. **X-vector vs i-vector**：兩者都是語者嵌入向量，X-vector 使用深度神經網路，性能更強
7. **應用場景對應**：智慧音箱 = ASR + TTS；電話客服 = ASR + SER；無障礙 = ASR / TTS

---

<div class="quiz-divider"><span>隨堂小測驗</span></div>

**Q1.** 下列哪一種語音特徵模擬了人耳對頻率的非線性感知，是傳統語音辨識中最常用的特徵？

- A. 原始波形（Raw Waveform）
- B. 梅爾倒頻譜係數（MFCC）
- C. 詞向量（Word Embedding）
- D. 注意力權重（Attention Weight）

---

**Q2.** CTC（Connectionist Temporal Classification）在語音辨識中主要解決哪個問題？

- A. 降低模型的計算量
- B. 語音訊號的去噪
- C. 語音幀與文字序列的長度不對齊問題
- D. 將語音轉換為頻譜圖

---

**Q3.** 下列語音合成模型中，哪一個以「非自回歸（Non-Autoregressive）」架構為核心，可以平行生成頻譜圖，速度遠快於自回歸模型？

- A. WaveNet
- B. Tacotron 2
- C. DeepSpeech
- D. FastSpeech 2

---

**Q4.** 語者驗證（Speaker Verification）與語者辨識（Speaker Identification）的主要差異在於？

- A. 前者處理語音合成，後者處理語音辨識
- B. 前者是一對一比對確認身份，後者是從候選清單中找出最匹配的說話者
- C. 前者使用 MFCC，後者使用頻譜圖
- D. 前者需要大量資料，後者不需要訓練資料

---

**Q5.** OpenAI 發布的 Whisper 模型採用何種架構，並以下列哪個特性著稱？

- A. CNN 架構；僅支援英語辨識
- B. RNN + CTC；高速即時辨識
- C. Transformer Encoder-Decoder；多語言多任務、開源可本地部署
- D. GAN 生成架構；主要用於語音合成

---

### 解答與解析

| 題號 | 答案 | 解析 |
|------|------|------|
| Q1 | **B** | MFCC（梅爾倒頻譜係數）依據梅爾音階模擬人耳的非線性頻率感知，是傳統語音辨識與情緒辨識中最廣泛使用的特徵表示。 |
| Q2 | **C** | CTC 的核心貢獻是透過引入「空白符號」與動態規劃，解決語音輸入幀數遠多於輸出文字序列長度的對齊問題，不需要人工標注每個音框對應的字元。 |
| Q3 | **D** | FastSpeech 2 採用非自回歸架構，同時生成整段 Mel 頻譜圖，並透過時長預測器（Duration Predictor）控制每個音素的長度，速度遠快於 Tacotron（Seq2Seq）與 WaveNet（逐樣本自回歸）。 |
| Q4 | **B** | 語者驗證是一對一比對（「這個聲音是否是聲稱的那個人？」），語者辨識是從候選名單中找出最可能的說話者。兩者都是語者識別的子任務。 |
| Q5 | **C** | Whisper 採用 Transformer Encoder-Decoder 架構，在 68 萬小時多語言語音資料上訓練，支援 99 種語言的辨識與翻譯，並以 Apache 2.0 授權開源，可在本地部署使用。 |
