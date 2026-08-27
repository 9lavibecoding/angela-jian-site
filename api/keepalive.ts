import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 保活端點，由 Vercel Cron 每日觸發（排程見 vercel.json）。
 *
 * 免費方案的專案若一週內資料庫活動過低會被自動暫停，暫停後 API 主機名會從 DNS 消失，
 * 導致 Google 登入與題庫權限全數失效（2026-08-27 曾實際發生）。官方未公布確切門檻，
 * 只說明「每天幾個資料庫請求」即足夠，因此這裡一次發出多個真實查詢以留餘裕。
 *
 * 保活一旦失敗會即時 LINE 通知管理者。靜默失效的保活等於沒有保活。
 */

// 與 ecpay-notify.ts 相同的寫法：LINE 推播在各 API 檔案內各自定義，不共用 lib。
async function linePush(userId: string, text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN 未設定');
  const r = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to: userId, messages: [{ type: 'text', text }] }),
  });
  if (!r.ok) throw new Error(`LINE push HTTP ${r.status}`);
}

function taipeiTime(): string {
  return new Date().toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

/** 通知本身失敗不可蓋掉原始錯誤，因此獨立吞例外並另外記錄。 */
async function notifyFailure(message: string): Promise<void> {
  const adminUserId = process.env.ADMIN_LINE_USER_ID;
  if (!adminUserId) {
    console.error('keepalive: ADMIN_LINE_USER_ID 未設定，無法發送失敗通知');
    return;
  }
  try {
    await linePush(
      adminUserId,
      `🚨 Supabase 保活失敗\n\n時間：${taipeiTime()}\n錯誤：${message}\n\n` +
        `專案可能已被暫停或資料表異常。\n請到 Supabase Dashboard 檢查專案狀態。`
    );
  } catch (e) {
    console.error('keepalive: LINE 通知發送失敗:', e instanceof Error ? e.message : String(e));
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel 在設有 CRON_SECRET 時，會用 Authorization: Bearer <secret> 呼叫排程端點。
  // 未設定時仍允許執行，避免保活因缺少設定而靜默失效。
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    // Vercel 會在排程請求上帶 x-vercel-cron 標頭。有這個標頭卻驗不過，代表 CRON_SECRET
    // 設定有誤、保活其實沒在跑，屬於必須通知的靜默失效；沒有這個標頭則只是外部呼叫，
    // 安靜擋掉即可，避免有人反覆打這支端點就把通知灌爆。
    if (req.headers['x-vercel-cron']) {
      console.error('keepalive: 排程請求金鑰驗證失敗，保活未執行');
      await notifyFailure(
        '排程請求的 CRON_SECRET 驗證失敗，保活未實際執行。' +
          '請確認 Vercel 的 CRON_SECRET 環境變數設定正確並重新部署。'
      );
      return res.status(401).json({ ok: false, error: 'Cron secret mismatch' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecretKey) {
    console.error('keepalive: SUPABASE_URL / SUPABASE_SECRET_KEY 未設定');
    await notifyFailure('伺服器環境變數 SUPABASE_URL / SUPABASE_SECRET_KEY 未設定');
    return res.status(500).json({ ok: false, error: '伺服器設定錯誤' });
  }

  const sb = createClient(supabaseUrl, supabaseSecretKey);
  const checks: Record<string, number | string> = {};

  try {
    // 逐一查詢，任何一個失敗都要讓整體回報失敗，不可吞掉。
    for (const table of ['purchases', 'questions'] as const) {
      const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true });
      if (error) throw new Error(`${table}: ${error.message || '查詢失敗'}`);
      checks[table] = count ?? 0;
    }

    // 一併確認 Auth 服務有回應，登入壞掉時這裡會先亮紅燈。
    const authRes = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseSecretKey },
    });
    if (!authRes.ok) throw new Error(`auth health: HTTP ${authRes.status}`);
    checks.auth = authRes.status;

    console.log('keepalive ok:', JSON.stringify(checks));
    return res.status(200).json({ ok: true, checks, at: new Date().toISOString() });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('keepalive failed:', message);
    await notifyFailure(message);
    return res.status(500).json({ ok: false, error: message, at: new Date().toISOString() });
  }
}
