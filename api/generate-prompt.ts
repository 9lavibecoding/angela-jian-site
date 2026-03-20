import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory rate limiting
const requestLog: number[] = [];
const RATE_LIMIT = 50;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(): boolean {
  const now = Date.now();
  // Remove entries older than 1 hour
  while (requestLog.length > 0 && requestLog[0] < now - RATE_WINDOW_MS) {
    requestLog.shift();
  }
  return requestLog.length >= RATE_LIMIT;
}

function getRemainingRequests(): number {
  const now = Date.now();
  while (requestLog.length > 0 && requestLog[0] < now - RATE_WINDOW_MS) {
    requestLog.shift();
  }
  return Math.max(0, RATE_LIMIT - requestLog.length);
}

const SCENE_LABELS: Record<string, string> = {
  competitive: '競品分析',
  prd: 'PRD 撰寫',
  interview: '用戶訪談整理',
  data: '數據分析',
  weekly: '週報生成',
};

const SYSTEM_PROMPT = `你是一個專業的 Prompt Engineer。根據用戶提供的場景和具體情境，生成一個結構化的、可以直接貼到 ChatGPT 或 Claude 使用的 Prompt。

Prompt 必須包含：
1. 角色設定（Role）
2. 具體任務描述（Task）— 融入用戶提供的情境
3. 分析維度或產出結構（Dimensions）
4. 輸出格式要求（Format）

用繁體中文輸出。直接輸出 Prompt 本身，不要加額外說明。`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  if (isRateLimited()) {
    return res.status(429).json({
      error: '已達到每小時請求上限（50 次），請稍後再試。',
      remaining: 0,
    });
  }

  const { scene, context } = req.body || {};

  if (!scene || !SCENE_LABELS[scene]) {
    return res.status(400).json({ error: '無效的場景類型' });
  }

  if (!context || typeof context !== 'string' || context.trim().length === 0) {
    return res.status(400).json({ error: '請提供具體情境描述' });
  }

  if (context.length > 5000) {
    return res.status(400).json({ error: '情境描述過長，請控制在 5000 字以內' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: '伺服器設定錯誤：缺少 API Key' });
  }

  const userMessage = `場景：${SCENE_LABELS[scene]}\n\n用戶提供的具體情境：\n${context.trim()}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }],
            },
          ],
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorBody = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errorBody);
      return res.status(502).json({ error: 'AI 服務暫時不可用，請稍後再試。' });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Unexpected Gemini response:', JSON.stringify(data));
      return res.status(502).json({ error: 'AI 回應格式異常，請稍後再試。' });
    }

    // Record the successful request for rate limiting
    requestLog.push(Date.now());

    return res.status(200).json({
      prompt: text,
      remaining: getRemainingRequests(),
    });
  } catch (err) {
    console.error('Gemini fetch error:', err);
    return res.status(502).json({ error: 'AI 服務連線失敗，請稍後再試。' });
  }
}
